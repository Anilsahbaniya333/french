import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth-admin-check";
import { hashPassword } from "@/lib/auth-student";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!id || id === "null" || id === "undefined") {
    return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
  }
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const body = await req.json();
  const patch: Record<string, unknown> = {};

  if (body.full_name !== undefined) patch.full_name = body.full_name.trim();
  if (body.email !== undefined) patch.email = body.email.trim().toLowerCase();
  if (body.group_id !== undefined) patch.group_id = body.group_id;
  if (body.group_uuid !== undefined) patch.group_uuid = body.group_uuid || null;
  if (body.level_code !== undefined) patch.level_code = body.level_code || null;
  if (body.is_active !== undefined) patch.is_active = body.is_active;
  if (body.password && body.password.length >= 6) {
    patch.password_hash = hashPassword(body.password);
  }

  let { data, error } = await supabase
    .from("students")
    .update(patch)
    .eq("id", id)
    .select("id, full_name, email, group_id, group_uuid, level_code, is_active, created_at")
    .single();

  // Optional columns may not exist yet — retry without them
  if (
    error?.message?.includes("level_code") ||
    error?.message?.includes("group_uuid") ||
    error?.message?.includes("schema cache")
  ) {
    const { level_code: _lc, group_uuid: _gu, ...patchMinimal } = patch;
    const fallback = await supabase
      .from("students")
      .update(patchMinimal)
      .eq("id", id)
      .select("id, full_name, email, group_id, is_active, created_at")
      .single();
    if (fallback.error) return NextResponse.json({ error: fallback.error.message }, { status: 500 });
    data = { ...fallback.data, level_code: null, group_uuid: null } as any;
    error = null;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ student: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
