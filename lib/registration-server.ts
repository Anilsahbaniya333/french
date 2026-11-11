/**
 * Server-only helpers for the registration → payment verification → account activation workflow.
 */
import { createHash } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import type { SupabaseClient } from "@supabase/supabase-js";
import { escapeHtml } from "@/lib/email";
import { ADMISSIONS_EMAIL } from "@/data/courses";

/* ── Private payment-proof storage ─────────────────────────────────────── */

export const PAYMENT_BUCKET = "registration-payments";
const STORAGE_PREFIX = "storage:";

export const ALLOWED_PROOF_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_PROOF_BYTES = 10 * 1024 * 1024;

/** Check the real file signature, not just the client-supplied MIME type. */
export function sniffImageType(buf: Uint8Array): (typeof ALLOWED_PROOF_TYPES)[number] | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (
    buf.length >= 12 &&
    String.fromCharCode(...buf.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...buf.slice(8, 12)) === "WEBP"
  )
    return "image/webp";
  return null;
}

async function ensurePrivateBucket(supabase: SupabaseClient): Promise<string | null> {
  const { data, error } = await supabase.storage.getBucket(PAYMENT_BUCKET);
  if (data) {
    if (data.public) return "Payment storage bucket is public — set it to private in Supabase Storage.";
    return null;
  }
  if (error && !/not found/i.test(error.message)) return error.message;
  const created = await supabase.storage.createBucket(PAYMENT_BUCKET, {
    public: false,
    fileSizeLimit: MAX_PROOF_BYTES,
    allowedMimeTypes: [...ALLOWED_PROOF_TYPES],
  });
  return created.error && !/already exists/i.test(created.error.message) ? created.error.message : null;
}

/** Uploads to the private bucket and returns a "storage:<path>" reference (never a public URL). */
export async function uploadPaymentProof(
  supabase: SupabaseClient,
  bytes: Uint8Array,
  contentType: string
): Promise<{ ref?: string; path?: string; error?: string }> {
  const bucketErr = await ensurePrivateBucket(supabase);
  if (bucketErr) return { error: bucketErr };
  const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const d = new Date();
  const path = `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(PAYMENT_BUCKET).upload(path, bytes, {
    contentType,
    upsert: false,
    cacheControl: "0",
  });
  if (error) return { error: error.message };
  return { ref: `${STORAGE_PREFIX}${PAYMENT_BUCKET}/${path}`, path };
}

export async function removePaymentProof(supabase: SupabaseClient, path: string) {
  await supabase.storage.from(PAYMENT_BUCKET).remove([path]).catch(() => undefined);
}

/** Short-lived signed URL for a stored proof. Legacy rows hold a full URL, returned as-is. */
export async function proofViewUrl(supabase: SupabaseClient, stored: string | null | undefined): Promise<string | null> {
  if (!stored) return null;
  if (!stored.startsWith(STORAGE_PREFIX)) return stored;
  const rest = stored.slice(STORAGE_PREFIX.length);
  const slash = rest.indexOf("/");
  const bucket = rest.slice(0, slash);
  const path = rest.slice(slash + 1);
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 10);
  return error ? null : data.signedUrl;
}

/** Update a row, dropping optional columns the DB doesn't have yet (pre-migration). */
export async function updateRegistrationRow(
  supabase: SupabaseClient,
  id: string,
  patch: Record<string, unknown>,
  optional: string[]
) {
  const data = { ...patch };
  for (let i = 0; i <= optional.length; i++) {
    const { error } = await supabase.from("student_registrations").update(data).eq("id", id);
    if (!error) return { error: null };
    const col = optional.find((c) => c in data && error.message.includes(c));
    if (!col) return { error };
    delete data[col];
  }
  return { error: { message: "Update failed", code: "" } };
}

/* ── Audit trail ───────────────────────────────────────────────────────── */

export async function logRegistrationEvent(
  supabase: SupabaseClient,
  e: { registrationId: string; event: string; fromStatus?: string | null; toStatus?: string | null; note?: string | null; actor?: string }
): Promise<boolean> {
  const { error } = await supabase.from("registration_events").insert({
    registration_id: e.registrationId,
    event: e.event,
    from_status: e.fromStatus ?? null,
    to_status: e.toStatus ?? null,
    note: e.note ?? null,
    actor: e.actor ?? "system",
  });
  // Table may not exist until migration_registration_v3.sql is run — history is best-effort.
  return !error;
}

/* ── Password setup / reset tokens ─────────────────────────────────────────
   Stateless signed tokens. Each embeds a fingerprint of the student's current
   password hash, so it becomes invalid as soon as the password is changed
   (one-time use) — no token table needed. */

function tokenKey(): Uint8Array | null {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 16) return null;
  return new TextEncoder().encode(`${s}|student-password-token`);
}

function fingerprint(passwordHash: string): string {
  return createHash("sha256").update(passwordHash).digest("hex").slice(0, 24);
}

export async function createPasswordToken(
  studentId: string,
  passwordHash: string,
  purpose: "setup" | "reset"
): Promise<string | null> {
  const key = tokenKey();
  if (!key) return null;
  return new SignJWT({ sid: studentId, fp: fingerprint(passwordHash), purpose })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(purpose === "setup" ? "7d" : "1h")
    .sign(key);
}

export async function verifyPasswordToken(
  token: string
): Promise<{ studentId: string; fp: string; purpose: string } | null> {
  const key = tokenKey();
  if (!key) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    if (typeof payload.sid !== "string" || typeof payload.fp !== "string") return null;
    return { studentId: payload.sid, fp: payload.fp, purpose: String(payload.purpose ?? "") };
  } catch {
    return null;
  }
}

export function passwordFingerprintMatches(passwordHash: string, fp: string): boolean {
  return fingerprint(passwordHash) === fp;
}

/* ── Links & emails ────────────────────────────────────────────────────── */

export function siteUrl(req: Request): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (env) return env;
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}`;
}

const wrap = (body: string) =>
  `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;color:#1e293b;line-height:1.6">${body}<p style="color:#64748b;font-size:13px;margin-top:28px">— Mappell French Admissions · <a href="mailto:${ADMISSIONS_EMAIL}">${ADMISSIONS_EMAIL}</a></p></div>`;
const button = (href: string, label: string) =>
  `<p style="margin:24px 0"><a href="${escapeHtml(href)}" style="background:#f59e0b;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:10px;display:inline-block">${escapeHtml(label)}</a></p>`;

export function welcomeEmail(o: { name: string; courseName: string; setupUrl: string | null; loginUrl: string; existing: boolean }) {
  const first = o.name.split(/\s+/)[0];
  const action = o.setupUrl
    ? `<p>To access your student portal, create your password using the secure link below. The link is valid for 7 days and can be used once.</p>${button(o.setupUrl, "Set your password")}`
    : `<p>Sign in with your existing Mappell French account.</p>${button(o.loginUrl, "Go to Student Login")}`;
  const textAction = o.setupUrl
    ? `Create your password (link valid 7 days, single use):\n${o.setupUrl}`
    : `Sign in with your existing account: ${o.loginUrl}`;
  return {
    subject: o.existing ? `You're enrolled: ${o.courseName}` : "Welcome to Mappell French — your enrollment is confirmed",
    html: wrap(
      `<h2 style="color:#0f1f42">Bienvenue, ${escapeHtml(first)}!</h2><p>Your payment has been verified and your enrollment in <strong>${escapeHtml(o.courseName)}</strong> is confirmed.</p>${action}<p>Inside the portal you'll find your class recordings, course materials, assignments, weekly mini exams, teacher feedback and progress.</p>`
    ),
    text: `Bienvenue, ${first}!\n\nYour payment has been verified and your enrollment in ${o.courseName} is confirmed.\n\n${textAction}\n\n— Mappell French Admissions (${ADMISSIONS_EMAIL})`,
  };
}

export function infoRequiredEmail(o: { name: string; message: string }) {
  const first = o.name.split(/\s+/)[0];
  return {
    subject: "Action needed: your Mappell French registration",
    html: wrap(
      `<h2 style="color:#0f1f42">Bonjour ${escapeHtml(first)},</h2><p>We're reviewing your registration and need a little more information:</p><blockquote style="border-left:3px solid #f59e0b;margin:16px 0;padding:8px 16px;background:#fffbeb;white-space:pre-wrap">${escapeHtml(o.message)}</blockquote><p>Please reply to this email with the requested details.</p>`
    ),
    text: `Bonjour ${first},\n\nWe're reviewing your registration and need a little more information:\n\n${o.message}\n\nPlease reply to this email with the requested details.\n\n— Mappell French Admissions`,
  };
}

export function rejectedEmail(o: { name: string; message: string | null }) {
  const first = o.name.split(/\s+/)[0];
  const reason = o.message ? `\n\n${o.message}` : "";
  return {
    subject: "Update on your Mappell French registration",
    html: wrap(
      `<h2 style="color:#0f1f42">Bonjour ${escapeHtml(first)},</h2><p>We were unable to confirm your registration at this time.</p>${o.message ? `<p style="white-space:pre-wrap">${escapeHtml(o.message)}</p>` : ""}<p>If you believe this is a mistake or have questions, simply reply to this email.</p>`
    ),
    text: `Bonjour ${first},\n\nWe were unable to confirm your registration at this time.${reason}\n\nIf you have questions, reply to this email.\n\n— Mappell French Admissions`,
  };
}

export function resetEmail(o: { name: string; url: string }) {
  const first = o.name.split(/\s+/)[0];
  return {
    subject: "Reset your Mappell French password",
    html: wrap(
      `<h2 style="color:#0f1f42">Bonjour ${escapeHtml(first)},</h2><p>We received a request to reset your student portal password. This link is valid for 1 hour and can be used once.</p>${button(o.url, "Reset password")}<p style="color:#64748b;font-size:13px">If you didn't request this, you can ignore this email — your password won't change.</p>`
    ),
    text: `Bonjour ${first},\n\nReset your password (valid 1 hour, single use):\n${o.url}\n\nIf you didn't request this, ignore this email.`,
  };
}
