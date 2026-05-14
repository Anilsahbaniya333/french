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
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const body = await req.json();
  const patch: Record<string, unknown> = {};

  if (body.name !== undefined) patch.name = body.name?.trim() || null;
  if (body.role !== undefined) patch.role = body.role?.trim() || null;
  if (body.photo_url !== undefined) patch.photo_url = body.photo_url?.trim() || null;
  if (body.description !== undefined) patch.description = body.description?.trim() || null;
  if (body.show_on_homepage !== undefined) patch.show_on_homepage = body.show_on_homepage;
  if (body.sort_order !== undefined) patch.sort_order = body.sort_order;

  if (!Object.keys(patch).length) return NextResponse.json({ error: "No fields to update" }, { status: 400 });

  const { data, error } = await supabase
    .from("staff_profiles")
    .update(patch)
    .eq("id", id)
    .select("id, name, role, photo_url, description, show_on_homepage, sort_order, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ staff: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { error } = await supabase.from("staff_profiles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
