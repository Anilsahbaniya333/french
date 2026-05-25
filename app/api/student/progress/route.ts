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

  // Student details
  const { data: studentRow } = await supabase
    .from("students")
    .select("level_code, group_uuid")
    .eq("id", student.id)
    .single();

  const levelCode = studentRow?.level_code ?? null;
  const groupUuid = studentRow?.group_uuid ?? null;

  // Fetch everything in parallel
  const [lessonProgressRes, submissionsRes, assignmentsRes, checklistItemsRes, checklistProgressRes] =
    await Promise.all([
      supabase
        .from("student_lesson_progress")
        .select("topic_id")
        .eq("student_id", student.id)
        .eq("is_completed", true),
      supabase
        .from("assignment_submissions")
        .select("id, status")
        .eq("student_email", student.email),
      supabase
        .from("assignments")
        .select("id, target_group_uuids"),
      supabase
        .from("learning_checklist_items")
        .select("id, item_text, description, level_code, coverage_notes, video_url, resource_file_url, exercise_instructions, target_group_uuids, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("student_learning_progress")
        .select("checklist_item_id, is_completed")
        .eq("student_id", student.id),
    ]);

  const completedTopicIds = new Set((lessonProgressRes.data ?? []).map((r: any) => r.topic_id));

  // ── Curriculum stats ─────────────────────────────────────────────────────
  let totalTopics = 0;
  let totalModules = 0;
  let completedModules = 0;
  let nextTopic: { id: string; title: string; moduleTitle: string } | null = null;

  if (levelCode) {
    const { data: level } = await supabase
      .from("levels")
      .select("id")
      .eq("code", levelCode)
      .single();

    if (level) {
      const { data: modules } = await supabase
        .from("modules")
        .select("id, title, sort_order, topics(id, title, sort_order)")
        .eq("level_id", level.id)
        .order("sort_order", { ascending: true });

      for (const mod of modules ?? []) {
        const topics = ((mod.topics as any[]) ?? []).sort((a, b) => a.sort_order - b.sort_order);
        totalModules++;
        totalTopics += topics.length;

        const allDone = topics.length > 0 && topics.every((t: any) => completedTopicIds.has(t.id));
        if (allDone) completedModules++;

        if (!nextTopic) {
          const incomplete = topics.find((t: any) => !completedTopicIds.has(t.id));
          if (incomplete) {
            nextTopic = { id: incomplete.id, title: incomplete.title, moduleTitle: mod.title };
          }
        }
      }
    }
  }

  // ── Assignment stats ─────────────────────────────────────────────────────
  const completedTopics = completedTopicIds.size;
  const totalSubmissions = submissionsRes.data?.length ?? 0;
  const gradedSubmissions = (submissionsRes.data ?? []).filter((s: any) =>
    ["graded", "reviewed", "feedback_sent", "completed"].includes(s.status)
  ).length;

  const totalAssignments = groupUuid
    ? (assignmentsRes.data ?? []).filter(
        (a: any) =>
          Array.isArray(a.target_group_uuids) && a.target_group_uuids.includes(groupUuid)
      ).length
    : 0;

  // ── Checklist stats ──────────────────────────────────────────────────────
  const assignedChecklistItems = groupUuid
    ? (checklistItemsRes.data ?? []).filter(
        (item: any) =>
          Array.isArray(item.target_group_uuids) && item.target_group_uuids.includes(groupUuid)
      )
    : [];

  const assignedIds = new Set(assignedChecklistItems.map((i: any) => i.id));
  const checklistTotal = assignedChecklistItems.length;

  const checklistProgressMap: Record<string, boolean> = {};
  (checklistProgressRes.data ?? []).forEach((p: any) => {
    checklistProgressMap[p.checklist_item_id] = p.is_completed;
  });

  const checklistCompleted = (checklistProgressRes.data ?? []).filter(
    (p: any) => p.is_completed && assignedIds.has(p.checklist_item_id)
  ).length;

  const nextChecklistItemRaw = assignedChecklistItems
    .slice()
    .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .find((item: any) => !checklistProgressMap[item.id]);

  const nextChecklistItem = nextChecklistItemRaw
    ? {
        id: nextChecklistItemRaw.id,
        item_text: nextChecklistItemRaw.item_text,
        description: nextChecklistItemRaw.description ?? null,
        level_code: nextChecklistItemRaw.level_code ?? null,
        coverage_notes: nextChecklistItemRaw.coverage_notes ?? null,
        video_url: nextChecklistItemRaw.video_url ?? null,
        resource_file_url: nextChecklistItemRaw.resource_file_url ?? null,
        exercise_instructions: nextChecklistItemRaw.exercise_instructions ?? null,
      }
    : null;

  // ── Final progress formula ───────────────────────────────────────────────
  // Course progress = average of 4 components
  const lessonsPct    = totalTopics      > 0 ? (completedTopics   / totalTopics)      * 100 : 0;
  const modulesPct    = totalModules     > 0 ? (completedModules  / totalModules)     * 100 : 0;
  const submittedPct  = totalAssignments > 0 ? Math.min((totalSubmissions / totalAssignments) * 100, 100) : 0;
  const reviewedPct   = totalSubmissions > 0 ? (gradedSubmissions / totalSubmissions) * 100 : 0;

  const coursePercent     = (lessonsPct + modulesPct + submittedPct + reviewedPct) / 4;
  const checklistPercent  = checklistTotal > 0 ? (checklistCompleted / checklistTotal) * 100 : 0;
  const finalPercent      = Math.round(coursePercent * 0.6 + checklistPercent * 0.4);

  return NextResponse.json({
    levelCode,
    // Course breakdown
    totalTopics,
    completedTopics,
    totalModules,
    completedModules,
    totalSubmissions,
    gradedSubmissions,
    totalAssignments,
    // Checklist
    checklistTotal,
    checklistCompleted,
    checklistPercent: Math.round(checklistPercent),
    // Scores
    coursePercent: Math.round(coursePercent),
    finalPercent,
    // Kept for backward compat (dashboard home uses this field)
    progressPercent: finalPercent,
    nextTopic,
    nextChecklistItem,
  });
}
