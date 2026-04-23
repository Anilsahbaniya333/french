import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth-admin-check";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { data, error } = await supabase
    .from("materials")
    .select("id,title,file_url,file_type,created_at")
    .eq("topic_id", id)
    .order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: topicId } = await params;
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const levelId = formData.get("levelId") as string | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `topics/${topicId}/${Date.now()}_${safeName}`;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";

  const arrayBuffer = await file.arrayBuffer();
  const { data: storageData, error: storageErr } = await supabase.storage
    .from("materials")
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false });

  if (storageErr) return NextResponse.json({ error: storageErr.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from("materials").getPublicUrl(storageData.path);

  const row: Record<string, unknown> = {
    topic_id: topicId,
    title: file.name.replace(/\.[^.]+$/, ""),
    file_url: urlData.publicUrl,
    file_type: ext,
  };
  if (levelId) row.level_id = levelId;

  const { data, error } = await supabase.from("materials").insert(row).select("id,title,file_url,file_type").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
