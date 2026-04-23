import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const [topicRes, materialsRes, exercisesRes, assignmentRes] = await Promise.all([
    supabase
      .from("topics")
      .select("id,title,description,notes,video_url,video_title,is_preview,module_id,order_index")
      .eq("id", id)
      .single(),
    supabase
      .from("materials")
      .select("id,title,file_url,file_type")
      .eq("topic_id", id)
      .order("created_at"),
    supabase
      .from("exercises")
      .select("id,question,option_a,option_b,option_c,option_d,correct_answer,explanation,order_index")
      .eq("topic_id", id)
      .order("order_index"),
    supabase
      .from("assignments")
      .select("id,title,instructions,due_date_time,max_score")
      .eq("topic_id", id)
      .limit(1)
      .maybeSingle(),
  ]);

  if (topicRes.error) return NextResponse.json({ error: topicRes.error.message }, { status: 404 });

  return NextResponse.json({
    topic: topicRes.data,
    materials: materialsRes.data ?? [],
    exercises: exercisesRes.data ?? [],
    assignment: assignmentRes.data ?? null,
  });
}
