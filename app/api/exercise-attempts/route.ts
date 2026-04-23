import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const body = await req.json();
  if (!body.exercise_id || !body.student_email || !body.answer) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Look up correct answer
  const { data: ex } = await supabase
    .from("exercises")
    .select("correct_answer")
    .eq("id", body.exercise_id)
    .single();

  const is_correct = ex ? ex.correct_answer === body.answer : false;

  const { error } = await supabase.from("exercise_attempts").insert({
    exercise_id: body.exercise_id,
    student_email: body.student_email,
    answer: body.answer,
    is_correct,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ is_correct });
}
