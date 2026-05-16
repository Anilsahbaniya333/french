import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyStudentSessionToken, STUDENT_COOKIE_NAME } from "@/lib/auth-student";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getStudent() {
  const token = (await cookies()).get(STUDENT_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyStudentSessionToken(token);
}

export async function GET() {
  const student = await getStudent();
  if (!student) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 503 });

  const { data, error } = await supabase
    .from("student_availability")
    .select("*")
    .eq("student_id", student.id)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ availability: data ?? null });
}

export async function POST(req: Request) {
  const student = await getStudent();
  if (!student) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 503 });

  const body = await req.json();
  const availability_text = (body.availability_text ?? "").trim();
  const note = (body.note ?? "").trim() || null;

  if (!availability_text) {
    return NextResponse.json({ error: "availability_text is required" }, { status: 400 });
  }

  const { data: studentData } = await supabase
    .from("students")
    .select("group_uuid")
    .eq("id", student.id)
    .single();

  const group_id = studentData?.group_uuid ?? null;

  const { data, error } = await supabase
    .from("student_availability")
    .upsert(
      {
        student_id: student.id,
        group_id,
        availability_text,
        note,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "student_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ availability: data });
}
