import { SignJWT, jwtVerify } from "jose";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

export const STUDENT_COOKIE_NAME = "student_session";

export interface StudentPayload {
  id: string;
  email: string;
  full_name: string;
  group_id: number | null;
  level_code: string | null;
  group_uuid?: string | null;
}

function getSecret(): Uint8Array | null {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 16) return null;
  return new TextEncoder().encode(s);
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    const hashBuffer = Buffer.from(hash, "hex");
    const derivedBuffer = scryptSync(password, salt, 64);
    return timingSafeEqual(hashBuffer, derivedBuffer);
  } catch {
    return false;
  }
}

export async function createStudentSessionToken(payload: StudentPayload): Promise<string | null> {
  const secret = getSecret();
  if (!secret) return null;
  return new SignJWT({ role: "student", ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

/* ── Account status check ─────────────────────────────────────────────────
   A signed session alone isn't enough: if an admin deactivates (or deletes) a
   student, access to paid content must stop. Cached briefly per instance. */
const activeCache = new Map<string, { active: boolean; at: number }>();
const ACTIVE_TTL_MS = 60_000;

async function isStudentActive(id: string): Promise<boolean> {
  const hit = activeCache.get(id);
  if (hit && Date.now() - hit.at < ACTIVE_TTL_MS) return hit.active;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return true; // DB not configured (local dev) — fall back to token-only

  try {
    const res = await fetch(`${url}/rest/v1/students?id=eq.${encodeURIComponent(id)}&select=is_active`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return hit?.active ?? true; // transient DB error: don't lock everyone out
    const rows = (await res.json()) as { is_active: boolean | null }[];
    const active = rows.length > 0 && rows[0].is_active !== false;
    activeCache.set(id, { active, at: Date.now() });
    if (activeCache.size > 10_000) activeCache.clear();
    return active;
  } catch {
    return hit?.active ?? true;
  }
}

export async function verifyStudentSessionToken(token: string): Promise<StudentPayload | null> {
  const secret = getSecret();
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== "student") return null;
    if (typeof payload.id !== "string" || !(await isStudentActive(payload.id))) return null;
    return {
      id: payload.id as string,
      email: payload.email as string,
      full_name: payload.full_name as string,
      group_id: typeof payload.group_id === "number" ? payload.group_id : null,
      level_code: typeof payload.level_code === "string" ? payload.level_code : null,
      group_uuid: typeof payload.group_uuid === "string" ? payload.group_uuid : null,
    };
  } catch {
    return null;
  }
}
