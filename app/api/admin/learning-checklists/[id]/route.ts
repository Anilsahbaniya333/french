import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth-admin-check";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 503 });

  const body = await req.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.item_text !== undefined) updates.item_text = body.item_text.trim();
  if (body.description !== undefined) updates.description = body.description?.trim() || null;
  if (body.level_code !== undefined) updates.level_code = body.level_code?.trim() || null;
  if (body.target_group_uuids !== undefined) updates.target_group_uuids = body.target_group_uuids;
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
  if (body.is_active !== undefined) updates.is_active = body.is_active;

  const { data, error } = await supabase
    .from("learning_checklist_items")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 503 });

  const { error } = await supabase
    .from("learning_checklist_items")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
