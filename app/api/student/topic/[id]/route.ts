import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyStudentSessionToken, STUDENT_COOKIE_NAME } from "@/lib/auth-student";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = (await cookies()).get(STUDENT_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const student = await verifyStudentSessionToken(token);
  if (!student) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const [topicRes, videosRes, materialsRes, exercisesRes, assignmentRes, progressRes] = await Promise.all([
    // Include video_url/video_title which admin saves directly on the topic
    supabase
      .from("topics")
      .select("id, title, description, notes, video_url, video_title, sort_order, estimated_duration, modules(id, title, levels(code, title))")
      .eq("id", id)
      .single(),
    // Videos stored in the videos table (alternative method)
    supabase
      .from("videos")
      .select("id, title, url, description, sort_order")
      .eq("topic_id", id)
      .order("sort_order"),
    // Materials: admin uses file_url + file_type columns
    supabase
      .from("materials")
      .select("id, title, file_url, file_type, sort_order")
      .eq("topic_id", id)
      .order("sort_order"),
    supabase
      .from("exercises")
      .select("id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, order_index")
      .eq("topic_id", id)
      .order("order_index"),
    supabase
      .from("assignments")
      .select("id, title, instructions, due_date_time, max_score, target_groups")
      .eq("topic_id", id)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("student_lesson_progress")
      .select("is_completed, completed_at")
      .eq("student_id", student.id)
      .eq("topic_id", id)
      .maybeSingle(),
  ]);

  if (topicRes.error) return NextResponse.json({ error: "Topic not found" }, { status: 404 });

  const topicData = topicRes.data as any;

  // Build unified video list: topic.video_url takes precedence, then videos table
  const videoList: { id: string; title: string; url: string; description?: string }[] = [];
  if (topicData.video_url) {
    videoList.push({
      id: `inline-${id}`,
      title: topicData.video_title ?? "Lesson Video",
      url: topicData.video_url,
    });
  }
  // Also add any videos from the videos table (skip duplicates by URL)
  for (const v of videosRes.data ?? []) {
    if (!videoList.find((x) => x.url === v.url)) {
      videoList.push(v);
    }
  }

  // Build unified material list: map file_url → url, file_type → type for UI
  const materialList = (materialsRes.data ?? []).map((m: any) => ({
    id: m.id,
    title: m.title,
    type: m.file_type ?? "pdf",
    url: m.file_url ?? null,
    sort_order: m.sort_order,
  }));

  // Fetch submission status + feedback for this student
  let submission: { status: string; score: number | null; feedback: string | null } | null = null;
  if (assignmentRes.data) {
    const { data: sub } = await supabase
      .from("assignment_submissions")
      .select("id, status, score, feedback")
      .eq("assignment_id", assignmentRes.data.id)
      .eq("student_email", student.email)
      .maybeSingle();
    if (sub) {
      submission = { status: sub.status, score: sub.score ?? null, feedback: sub.feedback ?? null };
    }
  }

  return NextResponse.json({
    topic: {
      id: topicData.id,
      title: topicData.title,
      description: topicData.description,
      notes: topicData.notes,
      modules: topicData.modules,
    },
    videos: videoList,
    materials: materialList,
    exercises: exercisesRes.data ?? [],
    assignment: assignmentRes.data
      ? {
          id: assignmentRes.data.id,
          title: assignmentRes.data.title,
          instructions: assignmentRes.data.instructions,
          due_date_time: assignmentRes.data.due_date_time,
          max_score: assignmentRes.data.max_score,
        }
      : null,
    submission,
    isCompleted: progressRes.data?.is_completed ?? false,
    completedAt: progressRes.data?.completed_at ?? null,
  });
}
