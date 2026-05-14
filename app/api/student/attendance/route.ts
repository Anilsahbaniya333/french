import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyStudentSessionToken, STUDENT_COOKIE_NAME } from "@/lib/auth-student";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = (await cookies()).get(STUDENT_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const student = await verifyStudentSessionToken(token);
  if (!student) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  // Get student's group_uuid from DB (session token may be stale)
  const { data: studentRow } = await supabase
    .from("students")
    .select("group_uuid")
    .eq("id", student.id)
    .single();

  const groupUuid = studentRow?.group_uuid ?? student.group_uuid;
  if (!groupUuid) return NextResponse.json({ records: [], stats: { total: 0, present: 0, absent: 0, late: 0, pct: 0 } });

  // All sessions for the student's group
  const { data: sessions } = await supabase
    .from("attendance_sessions")
    .select("id, session_date, notes")
    .eq("group_id", groupUuid)
    .order("session_date", { ascending: false });

  if (!sessions?.length) return NextResponse.json({ records: [], stats: { total: 0, present: 0, absent: 0, late: 0, pct: 0 } });

  const sessionIds = sessions.map((s) => s.id);

  // This student's records
  const { data: records } = await supabase
    .from("attendance_records")
    .select("session_id, status")
    .eq("student_id", student.id)
    .in("session_id", sessionIds);

  const recordMap: Record<string, string> = {};
  for (const r of records ?? []) recordMap[r.session_id] = r.status;

  const enriched = sessions.map((s) => ({
    session_date: s.session_date,
    notes: s.notes,
    status: recordMap[s.id] ?? "absent",
  }));

  const present = enriched.filter((r) => r.status === "present").length;
  const absent  = enriched.filter((r) => r.status === "absent").length;
  const late    = enriched.filter((r) => r.status === "late").length;
  const total   = enriched.length;

  return NextResponse.json({
    records: enriched,
    stats: { total, present, absent, late, pct: total ? Math.round(((present + late) / total) * 100) : 0 },
  });
}
