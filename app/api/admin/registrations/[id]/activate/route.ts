import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth-admin-check";
import { hashPassword } from "@/lib/auth-student";
import { sendEmail, getAdmissionsEmail } from "@/lib/email";
import { COURSE_PACKAGES, getCoursePackage } from "@/data/courses";
import {
  createPasswordToken,
  logRegistrationEvent,
  siteUrl,
  updateRegistrationRow,
  welcomeEmail,
} from "@/lib/registration-server";

export const dynamic = "force-dynamic";

const LEVELS = ["a1", "a2", "b1", "b2"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Insert/update on `students`, dropping optional columns the DB doesn't have yet. */
async function writeStudent(
  supabase: SupabaseClient,
  op: { kind: "insert"; row: Record<string, unknown> } | { kind: "update"; id: string; row: Record<string, unknown> }
): Promise<{ id?: string; error?: string; code?: string }> {
  const optional = ["level_code", "group_uuid", "course_package", "registration_id"];
  const row = { ...op.row };
  for (let i = 0; i <= optional.length; i++) {
    const res =
      op.kind === "insert"
        ? await supabase.from("students").insert(row).select("id").single()
        : await supabase.from("students").update(row).eq("id", op.id).select("id").single();
    if (!res.error) return { id: String(res.data.id) };
    const col = optional.find((c) => c in row && res.error.message.includes(c));
    if (!col) return { error: res.error.message, code: res.error.code };
    delete row[col];
  }
  return { error: "Could not save student account" };
}

/**
 * Approve a registration and activate the student's portal account.
 * - New email → creates the account with an unusable random password and emails a
 *   single-use password-setup link (no plain-text passwords).
 * - Existing email → reactivates / re-links the same account (never a duplicate).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { id } = await params;
  let body: { level_code?: unknown; group_uuid?: unknown; note?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body is fine */
  }

  const levelCode = typeof body.level_code === "string" && LEVELS.includes(body.level_code) ? body.level_code : "a1";
  const groupUuid = typeof body.group_uuid === "string" && UUID_RE.test(body.group_uuid) ? body.group_uuid : null;
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 2000) : "";

  const { data: reg, error: regErr } = await supabase.from("student_registrations").select("*").eq("id", id).maybeSingle();
  if (regErr) return NextResponse.json({ error: regErr.message }, { status: 500 });
  if (!reg) return NextResponse.json({ error: "Registration not found" }, { status: 404 });

  const email = String(reg.email).trim().toLowerCase();
  const fullName = String(reg.full_name ?? reg.name ?? "").trim();
  const course =
    getCoursePackage(reg.course_package as string | null) ??
    COURSE_PACKAGES.find((c) => c.code === reg.level) ??
    null;

  // ── Create or reactivate the account ──────────────────────────────────
  const { data: existing } = await supabase
    .from("students")
    .select("id, password_hash, is_active")
    .eq("email", email)
    .maybeSingle();

  const linkFields: Record<string, unknown> = {
    is_active: true,
    level_code: levelCode,
    course_package: course?.id ?? null,
    registration_id: id,
    ...(groupUuid ? { group_uuid: groupUuid } : {}),
  };

  let studentId: string;
  let passwordHash: string;
  if (existing) {
    const r = await writeStudent(supabase, { kind: "update", id: existing.id, row: linkFields });
    if (r.error) {
      console.error("[activate] student update failed:", r.error);
      return NextResponse.json({ error: "Could not activate the existing student account." }, { status: 500 });
    }
    studentId = existing.id;
    passwordHash = existing.password_hash;
  } else {
    passwordHash = hashPassword(randomBytes(32).toString("hex")); // unusable until the student sets one
    const r = await writeStudent(supabase, {
      kind: "insert",
      row: { full_name: fullName, email, password_hash: passwordHash, group_id: null, ...linkFields },
    });
    if (r.error || !r.id) {
      console.error("[activate] student insert failed:", r.error);
      const dup = r.code === "23505";
      return NextResponse.json(
        { error: dup ? "An account with this email already exists." : "Could not create the student account." },
        { status: dup ? 409 : 500 }
      );
    }
    studentId = r.id;
  }

  // ── Mark the registration approved ────────────────────────────────────
  const { error: upErr } = await updateRegistrationRow(
    supabase,
    id,
    { status: "approved", student_id: studentId, reviewed_at: new Date().toISOString(), ...(note ? { admin_notes: note } : {}) },
    ["student_id", "reviewed_at", "admin_notes"]
  );
  if (upErr) {
    console.error("[activate] registration update failed:", upErr.message);
    return NextResponse.json(
      { error: "The account was activated, but the registration status could not be updated. Try again." },
      { status: 500 }
    );
  }

  await logRegistrationEvent(supabase, {
    registrationId: id,
    event: "account_activated",
    fromStatus: (reg.status as string) ?? "pending",
    toStatus: "approved",
    note: `${existing ? "Existing account re-activated" : "New student account created"} · level ${levelCode.toUpperCase()}${groupUuid ? " · batch assigned" : ""}${note ? ` · ${note}` : ""}`,
    actor: "admin",
  });

  // ── Welcome email with a single-use password-setup link (new accounts only) ──
  const base = siteUrl(req);
  let setupUrl: string | null = null;
  if (!existing) {
    const token = await createPasswordToken(studentId, passwordHash, "setup");
    if (token) setupUrl = `${base}/student/set-password?token=${encodeURIComponent(token)}`;
  }
  const mail = welcomeEmail({
    name: fullName,
    courseName: course?.name ?? "your French course",
    setupUrl,
    loginUrl: `${base}/student/login`,
    existing: Boolean(existing),
  });
  const sent = await sendEmail({ to: email, ...mail, replyTo: getAdmissionsEmail() });
  if (!sent.sent) console.error("[activate] welcome email not sent:", sent.error);

  return NextResponse.json({
    success: true,
    existingAccount: Boolean(existing),
    emailSent: sent.sent,
    // Returned so the admin can share it manually if email isn't configured. Single use, 7-day expiry.
    setupUrl,
  });
}
