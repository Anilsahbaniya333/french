import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth-admin-check";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const groupUuid = searchParams.get("group_uuid");
  const group = searchParams.get("group");

  // ── New: UUID-based group filtering ──────────────────────────────────
  if (groupUuid) {
    // Find all active students in this UUID group
    const { data: students } = await supabase
      .from("students")
      .select("email")
      .eq("group_uuid", groupUuid)
      .eq("is_active", true);

    const emails = (students ?? []).map((s: any) => s.email as string);
    if (emails.length === 0) return NextResponse.json({ submissions: [] });

    // Build assignment map for details
    const { data: allAssignments } = await supabase
      .from("assignments")
      .select("id, title, max_score, topic_id, topics(title, module_id, modules(title, level_id, levels(code, title)))");

    const asgMap: Record<string, any> = {};
    for (const a of allAssignments ?? []) asgMap[a.id] = a;

    // Fetch submissions from students in this group
    const { data: subs, error: subsErr } = await supabase
      .from("assignment_submissions")
      .select("id, student_name, student_email, submission_text, file_url, audio_url, score, feedback, status, submitted_at, graded_at, assignment_id, group_number")
      .in("student_email", emails)
      .order("submitted_at", { ascending: false });

    if (subsErr) return NextResponse.json({ error: subsErr.message }, { status: 500 });

    const submissions = (subs ?? []).map((s: any) => ({
      ...s,
      assignments: asgMap[s.assignment_id] ?? null,
    }));

    return NextResponse.json({ submissions });
  }

  // ── Legacy: integer group_id filtering (fallback for old records) ─────
  const g = group ? parseInt(group) : null;

  const { data: allAssignments } = await supabase
    .from("assignments")
    .select("id, title, max_score, target_groups, topic_id, topics(title, module_id, modules(title, level_id, levels(code, title)))");

  const asgMap: Record<string, any> = {};
  const groupAssignmentIds = new Set<string>();

  for (const a of allAssignments ?? []) {
    const groups: number[] = a.target_groups ?? [];
    if (g === null || groups.length === 0 || groups.includes(g)) {
      groupAssignmentIds.add(a.id);
    }
    asgMap[a.id] = a;
  }

  if (groupAssignmentIds.size === 0) return NextResponse.json({ submissions: [] });

  const { data: subs, error: subsErr } = await supabase
    .from("assignment_submissions")
    .select("id, student_name, student_email, submission_text, file_url, audio_url, score, feedback, status, submitted_at, graded_at, assignment_id, group_number")
    .in("assignment_id", [...groupAssignmentIds])
    .order("submitted_at", { ascending: false });

  if (subsErr) return NextResponse.json({ error: subsErr.message }, { status: 500 });

  const submissions = (subs ?? []).map((s: any) => ({
    ...s,
    assignments: asgMap[s.assignment_id] ?? null,
  }));

  return NextResponse.json({ submissions });
}
