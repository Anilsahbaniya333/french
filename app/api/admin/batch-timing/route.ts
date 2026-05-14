import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth-admin-check";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  let { data, error } = await supabase
    .from("groups")
    .select("id, group_name, level_code, schedule, schedule_days, schedule_time, start_date, end_date, is_active")
    .order("group_name");

  if (error?.message?.includes("schedule_days") || error?.message?.includes("schedule_time") ||
      error?.message?.includes("end_date") || error?.code === "42703") {
    const fallback = await supabase
      .from("groups")
      .select("id, group_name, level_code, schedule, start_date, is_active")
      .order("group_name");
    if (fallback.error) return NextResponse.json({ error: fallback.error.message }, { status: 500 });
    data = (fallback.data ?? []).map((g) => ({
      ...g, schedule_days: null, schedule_time: null, end_date: null,
    })) as any;
    error = null;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ groups: data ?? [] });
}

export async function PATCH(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const body = await req.json();
  const { id, schedule, schedule_days, schedule_time, start_date, end_date } = body;
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (schedule !== undefined) patch.schedule = schedule || null;
  if (schedule_days !== undefined) patch.schedule_days = schedule_days || null;
  if (schedule_time !== undefined) patch.schedule_time = schedule_time || null;
  if (start_date !== undefined) patch.start_date = start_date || null;
  if (end_date !== undefined) patch.end_date = end_date || null;

  let { data, error } = await supabase
    .from("groups")
    .update(patch)
    .eq("id", id)
    .select("id, group_name, level_code, schedule, schedule_days, schedule_time, start_date, end_date, is_active")
    .single();

  if (error?.message?.includes("schedule_days") || error?.message?.includes("schedule_time") ||
      error?.message?.includes("end_date") || error?.code === "42703") {
    const safePatch: Record<string, unknown> = {};
    if (patch.schedule !== undefined) safePatch.schedule = patch.schedule;
    if (patch.start_date !== undefined) safePatch.start_date = patch.start_date;
    if (Object.keys(safePatch).length) {
      await supabase.from("groups").update(safePatch).eq("id", id);
    }
    const fallback = await supabase
      .from("groups").select("id, group_name, level_code, schedule, start_date, is_active").eq("id", id).single();
    data = fallback.data ? { ...fallback.data, schedule_days: null, schedule_time: null, end_date: null } as any : null;
    error = fallback.error ?? null;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ group: data });
}
