import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth-admin-check";

export const dynamic = "force-dynamic";

/** GET — list sessions, optionally filtered by group */
export async function GET(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("group_id");

  let query = supabase
    .from("attendance_sessions")
    .select("id, group_id, session_date, notes, created_at, groups(group_name, level_code)")
    .order("session_date", { ascending: false });

  if (groupId) query = query.eq("group_id", groupId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sessions: data ?? [] });
}

/** POST — create or load a session for group + date, return session + students with current records */
export async function POST(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { group_id, session_date, notes } = await req.json();
  if (!group_id || !session_date) {
    return NextResponse.json({ error: "group_id and session_date are required" }, { status: 400 });
  }

  // Try to find an existing session first (avoids relying on a unique constraint for upsert)
  const { data: existing, error: findErr } = await supabase
    .from("attendance_sessions")
    .select("id, group_id, session_date, notes")
    .eq("group_id", group_id)
    .eq("session_date", session_date)
    .maybeSingle();

  if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 });

  let session: { id: string; group_id: string; session_date: string; notes: string | null };

  if (existing) {
    session = existing;
    // Update notes if provided
    if (notes !== undefined && notes !== existing.notes) {
      const { data: updated, error: upErr } = await supabase
        .from("attendance_sessions")
        .update({ notes: notes ?? null })
        .eq("id", existing.id)
        .select("id, group_id, session_date, notes")
        .single();
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
      session = updated;
    }
  } else {
    const { data: inserted, error: insErr } = await supabase
      .from("attendance_sessions")
      .insert({ group_id, session_date, notes: notes ?? null })
      .select("id, group_id, session_date, notes")
      .single();
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    session = inserted;
  }

  // Load students in this group
  const { data: students } = await supabase
    .from("students")
    .select("id, full_name, email")
    .eq("group_uuid", group_id)
    .eq("is_active", true)
    .order("full_name");

  // Load existing records for this session
  const { data: records } = await supabase
    .from("attendance_records")
    .select("student_id, status")
    .eq("session_id", session.id);

  const recordMap: Record<string, string> = {};
  for (const r of records ?? []) recordMap[r.student_id] = r.status;

  return NextResponse.json({
    session,
    students: (students ?? []).map((s) => ({
      ...s,
      status: recordMap[s.id] ?? "present",
    })),
  });
}
