import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth-admin-check";
import { isRegistrationStatus, statusLabel, STATUSES_NEEDING_V3 } from "@/data/registration-status";
import { sendEmail, getAdmissionsEmail } from "@/lib/email";
import { logRegistrationEvent, infoRequiredEmail, rejectedEmail, updateRegistrationRow } from "@/lib/registration-server";

export const dynamic = "force-dynamic";

/**
 * Change a registration's status (admin only).
 * Approval is NOT done here — it goes through /api/admin/registrations/[id]/activate
 * so an approved registration always has an activated student account.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let body: { status?: unknown; note?: unknown; notifyStudent?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = body.status;
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 2000) : "";
  const notify = body.notifyStudent !== false;

  if (!isRegistrationStatus(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  if (status === "approved") {
    return NextResponse.json(
      { error: "Use “Approve & activate account” so the student's portal access is created." },
      { status: 400 }
    );
  }
  if (status === "info_required" && !note) {
    return NextResponse.json({ error: "Tell the student what information is needed." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { data: current, error: readErr } = await supabase
    .from("student_registrations")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });
  if (!current) return NextResponse.json({ error: "Registration not found" }, { status: 404 });

  const { error } = await updateRegistrationRow(
    supabase,
    id,
    { status, reviewed_at: new Date().toISOString(), ...(note ? { admin_notes: note } : {}) },
    ["reviewed_at", "admin_notes"]
  );

  if (error) {
    if ((error as { code?: string }).code === "23514" && STATUSES_NEEDING_V3.includes(status)) {
      return NextResponse.json(
        { error: `“${statusLabel(status)}” needs the database update: run supabase/migration_registration_v3.sql.` },
        { status: 409 }
      );
    }
    console.error("[PATCH /api/registrations] update failed:", error.message);
    return NextResponse.json({ error: "Could not update the registration." }, { status: 500 });
  }

  await logRegistrationEvent(supabase, {
    registrationId: id,
    event: "status_changed",
    fromStatus: (current.status as string) ?? "pending",
    toStatus: status,
    note: note || null,
    actor: "admin",
  });

  // Notify the student where it matters. Report honestly whether the email went out.
  let emailSent: boolean | null = null;
  const name = String(current.full_name ?? current.name ?? "");
  const to = String(current.email);
  if (notify && status === "info_required") {
    emailSent = (await sendEmail({ to, ...infoRequiredEmail({ name, message: note }), replyTo: getAdmissionsEmail() })).sent;
  } else if (notify && status === "rejected") {
    emailSent = (await sendEmail({ to, ...rejectedEmail({ name, message: note || null }), replyTo: getAdmissionsEmail() })).sent;
  }

  return NextResponse.json({ success: true, status, emailSent });
}
