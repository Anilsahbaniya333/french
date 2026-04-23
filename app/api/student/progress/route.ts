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

  // Get student's level_code
  const { data: studentRow } = await supabase
    .from("students")
    .select("level_code")
    .eq("id", student.id)
    .single();

  const levelCode = studentRow?.level_code;

  // Get completed lesson IDs for this student
  const { data: progressRows } = await supabase
    .from("student_lesson_progress")
    .select("topic_id, completed_at")
    .eq("student_id", student.id)
    .eq("is_completed", true);

  const completedTopicIds = new Set((progressRows ?? []).map((r: any) => r.topic_id));

  let totalTopics = 0;
  let totalModules = 0;
  let completedModules = 0;
  let nextTopic: { id: string; title: string; moduleTitle: string } | null = null;

  if (levelCode) {
    // Get full curriculum to calculate stats
    const { data: level } = await supabase
      .from("levels")
      .select("id, code, title")
      .eq("code", levelCode)
      .single();

    if (level) {
      const { data: modules } = await supabase
        .from("modules")
        .select("id, title, sort_order, topics(id, title, sort_order)")
        .eq("level_id", level.id)
        .order("sort_order", { ascending: true });

      for (const mod of modules ?? []) {
        const topics = (mod.topics as any[] ?? []).sort((a, b) => a.sort_order - b.sort_order);
        totalModules++;
        totalTopics += topics.length;

        const allDone = topics.length > 0 && topics.every((t: any) => completedTopicIds.has(t.id));
        if (allDone) completedModules++;

        // Find next incomplete topic
        if (!nextTopic) {
          const incomplete = topics.find((t: any) => !completedTopicIds.has(t.id));
          if (incomplete) {
            nextTopic = { id: incomplete.id, title: incomplete.title, moduleTitle: mod.title };
          }
        }
      }
    }
  }

  // Get assignment submission counts
  const { data: submissions } = await supabase
    .from("assignment_submissions")
    .select("id, status, score, feedback")
    .eq("student_email", student.email);

  const totalSubmissions = submissions?.length ?? 0;
  const gradedSubmissions = (submissions ?? []).filter(
    (s: any) => s.status === "graded" || s.status === "reviewed" || s.status === "feedback_sent" || s.status === "completed"
  ).length;

  const completedTopics = completedTopicIds.size;
  const pct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return NextResponse.json({
    levelCode,
    totalTopics,
    completedTopics,
    totalModules,
    completedModules,
    progressPercent: pct,
    nextTopic,
    totalSubmissions,
    gradedSubmissions,
  });
}
