import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth-admin-check";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["submitted", "reviewed", "needs_revision", "feedback_sent", "graded", "completed"] as const;
const GRADED_STATUSES = new Set(["reviewed", "needs_revision", "feedback_sent", "graded", "completed"]);

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const body = await req.json();
  console.log(`[admin/submissions] PATCH id=${id} payload=${JSON.stringify(body)}`);

  const patch: Record<string, unknown> = {};

  if (body.score !== undefined) patch.score = body.score ?? null;
  if (body.feedback !== undefined) patch.feedback = body.feedback ?? null;

  if (body.status && VALID_STATUSES.includes(body.status)) {
    patch.status = body.status;
    if (GRADED_STATUSES.has(body.status)) {
      patch.graded_at = new Date().toISOString();
    }
  } else if (body.score != null || body.feedback != null) {
    patch.status = "graded";
    patch.graded_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("assignment_submissions")
    .update(patch)
    .eq("id", id);

  if (error) {
    console.error(`[admin/submissions] PATCH DB error: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch and return the updated row so the client can sync state
  const { data: updated, error: fetchErr } = await supabase
    .from("assignment_submissions")
    .select("id, score, feedback, status, graded_at, submitted_at, student_name, student_email, audio_url, file_url, submission_text, group_number")
    .eq("id", id)
    .single();

  if (fetchErr) {
    console.warn(`[admin/submissions] Could not fetch updated row: ${fetchErr.message}`);
    return NextResponse.json({ success: true });
  }

  console.log(`[admin/submissions] PATCH success → status=${updated.status} score=${updated.score} graded_at=${updated.graded_at}`);
  return NextResponse.json({ success: true, submission: updated });
}
