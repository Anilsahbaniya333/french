import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth-admin-check";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { data, error } = await supabase
    .from("staff_profiles")
    .select("id, name, role, photo_url, description, show_on_homepage, sort_order, created_at")
    .order("sort_order")
    .order("created_at");

  // Table may not exist yet — return empty list instead of 500
  if (error?.code === "42P01" || error?.message?.includes("staff_profiles")) {
    return NextResponse.json({ staff: [] });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ staff: data ?? [] });
}

export async function POST(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const body = await req.json();
  if (!body.name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });
  if (!body.role?.trim()) return NextResponse.json({ error: "role is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("staff_profiles")
    .insert({
      name: body.name.trim(),
      role: body.role.trim(),
      photo_url: body.photo_url?.trim() || null,
      description: body.description?.trim() || null,
      show_on_homepage: body.show_on_homepage ?? false,
      sort_order: body.sort_order ?? 0,
    })
    .select("id, name, role, photo_url, description, show_on_homepage, sort_order, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ staff: data }, { status: 201 });
}
