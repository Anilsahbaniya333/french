import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth-admin-check";

export const dynamic = "force-dynamic";

const COLS = "id, group_id, title, class_date, description, video_url, file_url, file_name, special_instructions, is_published, sort_order, created_at, updated_at, groups(group_name)";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const body = await req.json();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.title               !== undefined) patch.title               = body.title?.trim()               || null;
  if (body.group_id            !== undefined) patch.group_id            = body.group_id                    || null;
  if (body.class_date          !== undefined) patch.class_date          = body.class_date                  || null;
  if (body.description         !== undefined) patch.description         = body.description?.trim()         || null;
  if (body.video_url           !== undefined) patch.video_url           = body.video_url?.trim()           || null;
  if (body.file_url            !== undefined) patch.file_url            = body.file_url                    || null;
  if (body.file_name           !== undefined) patch.file_name           = body.file_name                   || null;
  if (body.special_instructions !== undefined) patch.special_instructions = body.special_instructions?.trim() || null;
  if (body.is_published        !== undefined) patch.is_published        = body.is_published;
  if (body.sort_order          !== undefined) patch.sort_order          = body.sort_order;

  const { data, error } = await supabase
    .from("daily_recording_posts")
    .update(patch)
    .eq("id", id)
    .select(COLS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ recording: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { error } = await supabase.from("daily_recording_posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
