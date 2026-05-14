import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth-admin-check";

export const dynamic = "force-dynamic";

/** PATCH — bulk-save attendance records for a session */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId } = await params;
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  // body: { records: [{ student_id, status }] }
  const { records } = await req.json();
  if (!Array.isArray(records)) return NextResponse.json({ error: "records array required" }, { status: 400 });

  const upserts = records.map((r: { student_id: string; status: string }) => ({
    session_id: sessionId,
    student_id: r.student_id,
    status: r.status ?? "present",
  }));

  if (upserts.length) {
    const { error } = await supabase
      .from("attendance_records")
      .upsert(upserts, { onConflict: "session_id,student_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, saved: upserts.length });
}

/** DELETE — remove a session (cascades to records) */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId } = await params;
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { error } = await supabase.from("attendance_sessions").delete().eq("id", sessionId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
