import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth-admin-check";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { data, error } = await supabase
    .from("assignments")
    .select(`
      id, title, instructions, due_date_time, max_score, target_group_uuids, created_at,
      topics (
        id, title,
        modules ( id, title, levels ( code, title ) )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ assignments: data ?? [] });
}

export async function POST(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const body = await req.json();
  const { title, instructions, due_date_time, max_score, target_group_uuids, topic_id } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const row: Record<string, unknown> = {
    title: title.trim(),
    instructions: instructions?.trim() || null,
    due_date_time: due_date_time || null,
    max_score: max_score ? Number(max_score) : 100,
    target_group_uuids: target_group_uuids ?? [],
    topic_id: topic_id || null,
  };

  const { data, error } = await supabase
    .from("assignments")
    .insert(row)
    .select(`
      id, title, instructions, due_date_time, max_score, target_group_uuids, created_at,
      topics ( id, title, modules ( id, title, levels ( code, title ) ) )
    `)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  console.log(`[admin/assignments] Created id=${data!.id} target_group_uuids=${JSON.stringify(data!.target_group_uuids)}`);

  return NextResponse.json({ assignment: data }, { status: 201 });
}
