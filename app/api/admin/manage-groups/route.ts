import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth-admin-check";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { data, error } = await supabase
    .from("groups")
    .select("id, group_name, level_code, schedule, start_date, is_active, created_at, tutors(id, full_name, email)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ groups: data ?? [] });
}

export async function POST(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const body = await req.json();
  const { group_name, level_code, tutor_id, schedule, start_date, is_active } = body;

  if (!group_name?.trim()) {
    return NextResponse.json({ error: "group_name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("groups")
    .insert({
      group_name: group_name.trim(),
      level_code: level_code || null,
      tutor_id: tutor_id || null,
      schedule: schedule?.trim() || null,
      start_date: start_date || null,
      is_active: is_active !== false,
    })
    .select("id, group_name, level_code, schedule, start_date, is_active, created_at, tutors(id, full_name, email)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ group: data }, { status: 201 });
}
