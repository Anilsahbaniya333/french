import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const contentType = req.headers.get("content-type") ?? "";

  let assignment_id: string, student_name: string, student_email: string,
    submission_text: string | null = null, file_url: string | null = null,
    audio_url: string | null = null, group_number: number | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    assignment_id = formData.get("assignment_id") as string;
    student_name = formData.get("student_name") as string;
    student_email = formData.get("student_email") as string;
    submission_text = formData.get("submission_text") as string | null;
    const gn = formData.get("group_number");
    group_number = gn ? parseInt(gn as string) : null;
    audio_url = formData.get("audio_url") as string | null;
    const file = formData.get("file") as File | null;

    if (file) {
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const path = `submissions/${assignment_id}/${Date.now()}_${safeName}`;
      const arrayBuffer = await file.arrayBuffer();
      const { data: storageData, error: storageErr } = await supabase.storage
        .from("assignments")
        .upload(path, arrayBuffer, { contentType: file.type, upsert: false });
      if (storageErr) return NextResponse.json({ error: storageErr.message }, { status: 500 });
      const { data: urlData } = supabase.storage.from("assignments").getPublicUrl(storageData.path);
      file_url = urlData.publicUrl;
    }
  } else {
    const body = await req.json();
    assignment_id = body.assignment_id;
    student_name = body.student_name;
    student_email = body.student_email;
    submission_text = body.submission_text ?? null;
    group_number = body.group_number ?? null;
    audio_url = body.audio_url ?? null;
  }

  if (!assignment_id || !student_name || !student_email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const row: Record<string, unknown> = {
    assignment_id,
    student_name,
    student_email,
    submission_text,
    file_url,
    audio_url,
    group_number,
    status: "submitted",
  };

  let { data, error } = await supabase
    .from("assignment_submissions")
    .insert(row)
    .select("id,submitted_at")
    .single();

  // One or both extended columns missing — strip them and retry
  if (error?.message?.includes("group_number") || error?.message?.includes("audio_url")) {
    const { group_number: _g, audio_url: _a, ...rowCore } = row;
    const fallback = await supabase
      .from("assignment_submissions")
      .insert(rowCore)
      .select("id,submitted_at")
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, id: data?.id, submitted_at: data?.submitted_at });
}
