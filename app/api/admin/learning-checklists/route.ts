import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth-admin-check";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 503 });

  const { data, error } = await supabase
    .from("learning_checklist_items")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("item_text", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 503 });

  const body = await req.json();
  const { item_text, description, level_code, target_group_uuids, sort_order, is_active } = body;

  if (!item_text?.trim()) {
    return NextResponse.json({ error: "topic name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("learning_checklist_items")
    .insert({
      item_text: item_text.trim(),
      description: description?.trim() || null,
      level_code: level_code?.trim() || null,
      target_group_uuids: target_group_uuids ?? [],
      sort_order: sort_order ?? 0,
      is_active: is_active !== false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data }, { status: 201 });
}
