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

export async function verifyStudentSessionToken(token: string): Promise<StudentPayload | null> {
  const secret = getSecret();
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== "student") return null;
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
