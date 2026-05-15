import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth-admin-check";

export const dynamic = "force-dynamic";

const COLS = "id, group_id, title, class_date, description, video_url, file_url, file_name, special_instructions, is_published, sort_order, created_at, updated_at, groups(group_name)";

export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { data, error } = await supabase
    .from("daily_recording_posts")
    .select(COLS)
    .order("class_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error?.code === "42P01") return NextResponse.json({ recordings: [] });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ recordings: data ?? [] });
}

export async function POST(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const body = await req.json();
  if (!body.title?.trim()) return NextResponse.json({ error: "title is required" }, { status: 400 });
  if (!body.group_id) return NextResponse.json({ error: "group_id is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("daily_recording_posts")
    .insert({
      group_id:             body.group_id,
      title:                body.title.trim(),
      class_date:           body.class_date   || null,
      description:          body.description?.trim()          || null,
      video_url:            body.video_url?.trim()            || null,
      file_url:             body.file_url                     || null,
      file_name:            body.file_name                    || null,
      special_instructions: body.special_instructions?.trim() || null,
      is_published:         body.is_published ?? true,
      sort_order:           body.sort_order   ?? 0,
    })
    .select(COLS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ recording: data }, { status: 201 });
}
