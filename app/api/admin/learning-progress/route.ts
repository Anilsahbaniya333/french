import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth-admin-check";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 503 });

  const [studentsRes, itemsRes, progressRes, groupsRes] = await Promise.all([
    supabase
      .from("students")
      .select("id, full_name, email, group_uuid, level_code")
      .eq("is_active", true),
    supabase
      .from("learning_checklist_items")
      .select("id, target_group_uuids")
      .eq("is_active", true),
    supabase
      .from("student_learning_progress")
      .select("student_id, checklist_item_id, is_completed, updated_at"),
    supabase
      .from("groups")
      .select("id, group_name, level_code")
      .order("group_name", { ascending: true }),
  ]);

  if (studentsRes.error) return NextResponse.json({ error: studentsRes.error.message }, { status: 500 });
  if (itemsRes.error) return NextResponse.json({ error: itemsRes.error.message }, { status: 500 });

  const students = studentsRes.data ?? [];
  const items = itemsRes.data ?? [];
  const progress = progressRes.data ?? [];
  const groups = groupsRes.data ?? [];

  const groupMap: Record<string, { group_name: string; level_code: string | null }> = {};
  groups.forEach((g: any) => {
    groupMap[g.id] = { group_name: g.group_name, level_code: g.level_code };
  });

  const result = students.map((s: any) => {
    const groupInfo = s.group_uuid ? groupMap[s.group_uuid] : null;

    const assignedItems = s.group_uuid
      ? items.filter(
          (item: any) =>
            Array.isArray(item.target_group_uuids) &&
            item.target_group_uuids.includes(s.group_uuid)
        )
      : [];

    const total = assignedItems.length;
    const assignedIds = new Set(assignedItems.map((i: any) => i.id));

    const studentProgress = progress.filter((p: any) => p.student_id === s.id);
    const completed = studentProgress.filter(
      (p: any) => p.is_completed && assignedIds.has(p.checklist_item_id)
    ).length;

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Most recent interaction with the checklist
    const timestamps = studentProgress.map((p: any) => p.updated_at).filter(Boolean);
    const last_updated = timestamps.length > 0
      ? timestamps.reduce((a: string, b: string) => (a > b ? a : b))
      : null;

    return {
      id: s.id,
      full_name: s.full_name,
      email: s.email,
      group_uuid: s.group_uuid,
      group_name: groupInfo?.group_name ?? null,
      level_code: s.level_code ?? groupInfo?.level_code ?? null,
      completed,
      total,
      percent,
      last_updated,
    };
  });

  return NextResponse.json({ progress: result, groups });
}
