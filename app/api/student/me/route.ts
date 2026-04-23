import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyStudentSessionToken, STUDENT_COOKIE_NAME } from "@/lib/auth-student";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = (await cookies()).get(STUDENT_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ student: null });

  const student = await verifyStudentSessionToken(token);
  if (!student) return NextResponse.json({ student: null });

  // Fetch level_code, group_uuid and group_name fresh from DB (may not be in JWT for older sessions)
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data } = await supabase
      .from("students")
      .select("level_code, group_uuid, groups(group_name)")
      .eq("id", student.id)
      .single();
    if (data) {
      student.level_code = data.level_code ?? null;
      const ext = student as unknown as Record<string, unknown>;
      ext.group_uuid = data.group_uuid ?? null;
      ext.group_name = (data as any).groups?.group_name ?? null;
    }
  }

  return NextResponse.json({ student });
}
