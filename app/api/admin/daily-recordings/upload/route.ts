import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth-admin-check";

export const dynamic = "force-dynamic";

const BUCKET = "daily-recording-files";
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];
const ALLOWED_EXTS = [".pdf", ".doc", ".docx", ".ppt", ".pptx"];
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

export async function POST(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  let formData: FormData;
  try { formData = await req.formData(); }
  catch { return NextResponse.json({ error: "Invalid form data" }, { status: 400 }); }

  const file     = formData.get("file") as File | null;
  const groupId  = (formData.get("group_id") as string | null) ?? "general";

  if (!file || file.size === 0) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext = "." + (file.name.split(".").pop()?.toLowerCase() ?? "");
  if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTS.includes(ext)) {
    return NextResponse.json({ error: "Only PDF, DOC, DOCX, PPT, PPTX files are accepted" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `File must be under 50 MB (got ${(file.size / 1024 / 1024).toFixed(1)} MB)` }, { status: 400 });
  }

  // Ensure bucket exists
  await supabase.storage.createBucket(BUCKET, { public: false }).catch(() => {});

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path     = `${groupId}/${Date.now()}-${safeName}`;
  const buf      = await file.arrayBuffer();

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, buf, { contentType: file.type, upsert: false });

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  return NextResponse.json({ file_url: path, file_name: file.name });
}
