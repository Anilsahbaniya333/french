import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth-admin-check";

export const dynamic = "force-dynamic";

const COLS = "id, title, location, job_type, description, requirements, is_active, sort_order, created_at";

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

  if (body.title       !== undefined) patch.title       = body.title?.trim()       || null;
  if (body.location    !== undefined) patch.location    = body.location?.trim()    || null;
  if (body.job_type    !== undefined) patch.job_type    = body.job_type?.trim()    || null;
  if (body.description !== undefined) patch.description = body.description?.trim() || null;
  if (body.requirements !== undefined) patch.requirements = body.requirements?.trim() || null;
  if (body.is_active   !== undefined) patch.is_active   = body.is_active;
  if (body.sort_order  !== undefined) patch.sort_order  = body.sort_order;

  if (!Object.keys(patch).length) return NextResponse.json({ error: "No fields to update" }, { status: 400 });

  const { data, error } = await supabase
    .from("careers")
    .update(patch)
    .eq("id", id)
    .select(COLS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ career: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { error } = await supabase.from("careers").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
