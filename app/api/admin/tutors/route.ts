import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth-admin-check";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  let { data, error } = await supabase
    .from("tutors")
    .select("id, full_name, email, phone, bio, photo_url, experience, specializations, qualifications, certifications, show_on_homepage, created_at")
    .order("full_name");

  // Profile columns may not exist yet — fall back to base columns
  if (error?.message?.includes("bio") || error?.message?.includes("photo_url") ||
      error?.message?.includes("qualifications") || error?.message?.includes("show_on_homepage") ||
      error?.message?.includes("schema cache") || error?.code === "42703") {
    const fallback = await supabase
      .from("tutors")
      .select("id, full_name, email, phone, created_at")
      .order("full_name");
    if (fallback.error) return NextResponse.json({ error: fallback.error.message }, { status: 500 });
    data = (fallback.data ?? []).map((t) => ({
      ...t, bio: null, photo_url: null, experience: null,
      specializations: [], qualifications: [], certifications: [], show_on_homepage: false,
    })) as any;
    error = null;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tutors: data ?? [] });
}

export async function POST(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const body = await req.json();
  const { full_name, email, phone } = body;

  if (!full_name?.trim()) {
    return NextResponse.json({ error: "full_name is required" }, { status: 400 });
  }

  let { data, error } = await supabase
    .from("tutors")
    .insert({ full_name: full_name.trim(), email: email?.trim() || null, phone: phone?.trim() || null })
    .select("id, full_name, email, phone, bio, photo_url, experience, specializations, qualifications, certifications, show_on_homepage, created_at")
    .single();

  // Profile columns may not exist yet — retry with base columns
  if (error?.message?.includes("bio") || error?.message?.includes("photo_url") ||
      error?.message?.includes("qualifications") || error?.message?.includes("show_on_homepage") ||
      error?.message?.includes("schema cache") || error?.code === "42703") {
    const fallback = await supabase
      .from("tutors")
      .insert({ full_name: full_name.trim(), email: email?.trim() || null, phone: phone?.trim() || null })
      .select("id, full_name, email, phone, created_at")
      .single();
    if (fallback.error) return NextResponse.json({ error: fallback.error.message }, { status: 500 });
    data = { ...fallback.data, bio: null, photo_url: null, experience: null, specializations: [], qualifications: [], certifications: [], show_on_homepage: false } as any;
    error = null;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tutor: data }, { status: 201 });
}
