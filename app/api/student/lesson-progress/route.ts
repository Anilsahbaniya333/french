import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyStudentSessionToken, STUDENT_COOKIE_NAME } from "@/lib/auth-student";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET: return all completed topic IDs for this student
export async function GET() {
  const token = (await cookies()).get(STUDENT_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const student = await verifyStudentSessionToken(token);
  if (!student) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { data, error } = await supabase
    .from("student_lesson_progress")
    .select("topic_id, completed_at")
    .eq("student_id", student.id)
    .eq("is_completed", true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ completed: (data ?? []).map((r: any) => r.topic_id) });
}

// POST: mark or unmark a topic as complete
export async function POST(req: Request) {
  const token = (await cookies()).get(STUDENT_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const student = await verifyStudentSessionToken(token);
  if (!student) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const body = await req.json();
  const { topic_id, is_completed = true } = body;
  if (!topic_id) return NextResponse.json({ error: "topic_id required" }, { status: 400 });

  const { error } = await supabase
    .from("student_lesson_progress")
    .upsert(
      { student_id: student.id, topic_id, is_completed, completed_at: is_completed ? new Date().toISOString() : null },
      { onConflict: "student_id,topic_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, is_completed });
}
