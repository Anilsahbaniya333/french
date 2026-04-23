import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyStudentSessionToken, STUDENT_COOKIE_NAME } from "@/lib/auth-student";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET — student reads their own feedback history
export async function GET() {
  const token = (await cookies()).get(STUDENT_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const student = await verifyStudentSessionToken(token);
  if (!student) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { data, error } = await supabase
    .from("student_feedback")
    .select("id, type, subject, message, status, created_at, topics(title)")
    .eq("student_id", student.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ feedback: data ?? [] });
}

// POST — student submits feedback
export async function POST(req: Request) {
  const token = (await cookies()).get(STUDENT_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const student = await verifyStudentSessionToken(token);
  if (!student) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  // Get fresh student name from DB
  const { data: studentRow } = await supabase
    .from("students")
    .select("full_name, email")
    .eq("id", student.id)
    .single();

  const body = await req.json();
  const { type, subject, message, topic_id } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const VALID_TYPES = ["general", "lesson", "technical", "suggestion", "other"];
  const feedbackType = VALID_TYPES.includes(type) ? type : "general";

  const row: Record<string, unknown> = {
    student_id: student.id,
    student_name: studentRow?.full_name ?? student.full_name,
    student_email: studentRow?.email ?? student.email,
    type: feedbackType,
    subject: subject?.trim() || null,
    message: message.trim(),
    status: "unread",
  };
  if (topic_id) row.topic_id = topic_id;

  const { data, error } = await supabase
    .from("student_feedback")
    .insert(row)
    .select("id, type, subject, message, status, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ feedback: data }, { status: 201 });
}
