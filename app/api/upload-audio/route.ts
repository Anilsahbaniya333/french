import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const assignmentId = (formData.get("assignment_id") as string | null) ?? "unknown";

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
  }

  const path = `audio/${assignmentId}/${Date.now()}.webm`;
  console.log(`[upload-audio] Starting upload — path=${path} size=${file.size}`);

  const arrayBuffer = await file.arrayBuffer();
  const { data, error } = await supabase.storage
    .from("assignments")
    .upload(path, arrayBuffer, { contentType: "audio/webm", upsert: false });

  if (error) {
    console.error(`[upload-audio] Storage error: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("assignments").getPublicUrl(data.path);
  const url = urlData.publicUrl;

  console.log(`[upload-audio] Upload succeeded → ${url}`);
  return NextResponse.json({ url });
}
