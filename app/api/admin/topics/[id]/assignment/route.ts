import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth-admin-check";

const SELECT = `
  id, title, instructions, due_date_time, max_score,
  target_group_uuids, level_id, topic_id, created_at
`;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { data, error } = await supabase
    .from("assignments")
    .select(SELECT)
    .eq("topic_id", id)
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json(null);

  return NextResponse.json(data);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const body = await req.json();
  const target_group_uuids: string[] = Array.isArray(body.target_group_uuids) ? body.target_group_uuids : [];

  const { data, error } = await supabase
    .from("assignments")
    .insert({
      topic_id: id,
      level_id: body.level_id ?? null,
      title: body.title,
      instructions: body.instructions ?? null,
      due_date_time: body.due_date_time ?? null,
      max_score: body.max_score ?? 100,
      target_group_uuids,
    })
    .select(SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: topicId } = await params;
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const body = await req.json();
  const { assignmentId, ...rest } = body;
  if (!assignmentId) return NextResponse.json({ error: "assignmentId required" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (rest.title !== undefined) patch.title = rest.title;
  if (rest.instructions !== undefined) patch.instructions = rest.instructions ?? null;
  if (rest.due_date_time !== undefined) patch.due_date_time = rest.due_date_time ?? null;
  if (rest.max_score !== undefined) patch.max_score = rest.max_score;
  if (rest.target_group_uuids !== undefined) {
    patch.target_group_uuids = Array.isArray(rest.target_group_uuids) ? rest.target_group_uuids : [];
  }

  const { data, error } = await supabase
    .from("assignments")
    .update(patch)
    .eq("id", assignmentId)
    .eq("topic_id", topicId)
    .select(SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
