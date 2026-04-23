import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyStudentSessionToken, STUDENT_COOKIE_NAME } from "@/lib/auth-student";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = (await cookies()).get(STUDENT_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const student = await verifyStudentSessionToken(token);
  if (!student) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { data, error } = await supabase
    .from("assignment_submissions")
    .select(`
      id, submission_text, file_url, audio_url, score, feedback, status, submitted_at, graded_at,
      assignments ( id, title, max_score, topics ( title, modules ( title, levels ( code, title ) ) ) )
    `)
    .eq("student_email", student.email)
    .order("submitted_at", { ascending: false });

  // audio_url may not exist yet — graceful fallback
  if (error?.message?.includes("audio_url")) {
    const fallback = await supabase
      .from("assignment_submissions")
      .select(`
        id, submission_text, file_url, score, feedback, status, submitted_at, graded_at,
        assignments ( id, title, max_score, topics ( title, modules ( title, levels ( code, title ) ) ) )
      `)
      .eq("student_email", student.email)
      .order("submitted_at", { ascending: false });
    if (fallback.error) return NextResponse.json({ error: fallback.error.message }, { status: 500 });
    return NextResponse.json({ submissions: fallback.data ?? [] });
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  console.log(`[student/submissions] email=${student.email} count=${(data ?? []).length} graded=${(data ?? []).filter((s: any) => s.score != null || s.feedback).length}`);
  return NextResponse.json({ submissions: data ?? [] });
}
