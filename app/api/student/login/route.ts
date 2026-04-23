import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyPassword, createStudentSessionToken, STUDENT_COOKIE_NAME } from "@/lib/auth-student";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const body = await req.json();
  const { email, password } = body;

  if (!email?.trim() || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const { data: student, error } = await supabase
    .from("students")
    .select("id, full_name, email, password_hash, group_id, group_uuid, level_code, is_active")
    .eq("email", email.trim().toLowerCase())
    .single();

  if (error || !student) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  if (!student.is_active) {
    return NextResponse.json({ error: "Your account has been deactivated. Please contact your teacher." }, { status: 403 });
  }

  const valid = verifyPassword(password, student.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = await createStudentSessionToken({
    id: student.id,
    email: student.email,
    full_name: student.full_name,
    group_id: student.group_id,
    level_code: student.level_code ?? null,
  });

  if (!token) {
    return NextResponse.json({ error: "Session configuration error" }, { status: 500 });
  }

  const response = NextResponse.json({
    student: { id: student.id, full_name: student.full_name, email: student.email, group_id: student.group_id },
  });

  response.cookies.set(STUDENT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  return response;
}
