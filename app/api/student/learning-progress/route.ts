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

  const { data: studentData } = await supabase
    .from("students")
    .select("group_uuid")
    .eq("id", student.id)
    .single();

  const groupUuid = studentData?.group_uuid ?? null;

  const { data: allItems, error: ie } = await supabase
    .from("learning_checklist_items")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("category", { ascending: true });

  if (ie) return NextResponse.json({ error: ie.message }, { status: 500 });

  const items = groupUuid
    ? (allItems ?? []).filter(
        (item: any) =>
          Array.isArray(item.target_group_uuids) &&
          item.target_group_uuids.includes(groupUuid)
      )
    : [];

  const { data: progressData, error: pe } = await supabase
    .from("student_learning_progress")
    .select("checklist_item_id, is_completed")
    .eq("student_id", student.id);

  if (pe) return NextResponse.json({ error: pe.message }, { status: 500 });

  const progressMap: Record<string, boolean> = {};
  (progressData ?? []).forEach((p: any) => {
    progressMap[p.checklist_item_id] = p.is_completed;
  });

  const itemsWithProgress = items.map((item: any) => ({
    ...item,
    is_completed: progressMap[item.id] ?? false,
  }));

  const total = itemsWithProgress.length;
  const completed = itemsWithProgress.filter((i: any) => i.is_completed).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return NextResponse.json({ items: itemsWithProgress, total, completed, percent });
}

export async function POST(req: Request) {
  const student = await getStudent();
  if (!student) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 503 });

  const body = await req.json();
  const { updates } = body;

  if (!Array.isArray(updates)) {
    return NextResponse.json({ error: "updates must be an array" }, { status: 400 });
  }

  const rows = updates.map((u: any) => ({
    student_id: student.id,
    checklist_item_id: u.checklist_item_id,
    is_completed: Boolean(u.is_completed),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("student_learning_progress")
    .upsert(rows, { onConflict: "student_id,checklist_item_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
