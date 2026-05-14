import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth-admin-check";

export const dynamic = "force-dynamic";

const SELECT_COLS = "id, full_name, email, phone, bio, photo_url, experience, specializations, qualifications, certifications, show_on_homepage, created_at";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { data, error } = await supabase
    .from("tutors")
    .select(SELECT_COLS)
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tutor: data });
}

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

  if (body.full_name !== undefined) patch.full_name = body.full_name?.trim() || null;
  if (body.email !== undefined) patch.email = body.email?.trim() || null;
  if (body.phone !== undefined) patch.phone = body.phone?.trim() || null;
  if (body.bio !== undefined) patch.bio = body.bio?.trim() || null;
  if (body.photo_url !== undefined) patch.photo_url = body.photo_url?.trim() || null;
  if (body.experience !== undefined) patch.experience = body.experience?.trim() || null;
  if (body.specializations !== undefined) patch.specializations = body.specializations;
  if (body.qualifications !== undefined) patch.qualifications = body.qualifications;
  if (body.certifications !== undefined) patch.certifications = body.certifications;
  if (body.show_on_homepage !== undefined) patch.show_on_homepage = body.show_on_homepage;

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  let { data, error } = await supabase
    .from("tutors")
    .update(patch)
    .eq("id", id)
    .select(SELECT_COLS)
    .single();

  // Profile columns may not exist yet — retry update + select with base columns only
  if (error?.message?.includes("bio") || error?.message?.includes("photo_url") ||
      error?.message?.includes("qualifications") || error?.message?.includes("schema cache") ||
      error?.code === "42703") {
    const safeFields = ["full_name", "email", "phone"];
    const safePatch: Record<string, unknown> = {};
    for (const k of safeFields) { if (patch[k] !== undefined) safePatch[k] = patch[k]; }
    if (Object.keys(safePatch).length) {
      await supabase.from("tutors").update(safePatch).eq("id", id);
    }
    const fallback = await supabase
      .from("tutors")
      .select("id, full_name, email, phone, created_at")
      .eq("id", id)
      .single();
    if (fallback.error) return NextResponse.json({ error: fallback.error.message }, { status: 500 });
    data = { ...fallback.data, bio: null, photo_url: null, experience: null, specializations: [], qualifications: [], certifications: [], show_on_homepage: false } as any;
    error = null;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tutor: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { error } = await supabase.from("tutors").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
