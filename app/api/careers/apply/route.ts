import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: Request) {
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const job_id    = (formData.get("job_id")    as string | null)?.trim();
  const full_name = (formData.get("full_name") as string | null)?.trim();
  const email     = (formData.get("email")     as string | null)?.trim();
  const phone     = (formData.get("phone")     as string | null)?.trim() || null;
  const message   = (formData.get("message")   as string | null)?.trim() || null;
  const file      = formData.get("resume") as File | null;

  if (!full_name) return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  if (!email || !email.includes("@")) return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  if (!job_id) return NextResponse.json({ error: "Job ID is missing" }, { status: 400 });

  let resume_url: string | null = null;

  if (file && file.size > 0) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Resume must be a PDF, DOC, or DOCX file" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Resume must be under 10 MB" }, { status: 400 });
    }

    // Create bucket if it doesn't exist yet (safe to call even if it exists)
    await supabase.storage.createBucket("career-resumes", { public: false }).catch(() => {});

    const ext  = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
    const path = `${job_id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buf  = await file.arrayBuffer();

    const { error: uploadErr } = await supabase.storage
      .from("career-resumes")
      .upload(path, buf, { contentType: file.type, upsert: false });

    if (uploadErr) {
      return NextResponse.json({ error: "Resume upload failed. Please try again." }, { status: 500 });
    }

    resume_url = path;
  }

  const { error } = await supabase.from("career_applications").insert({
    job_id,
    full_name,
    email,
    phone,
    message,
    resume_url,
    status: "new",
  });

  if (error?.code === "42P01") {
    return NextResponse.json(
      { error: "Applications unavailable right now. Please contact us directly." },
      { status: 503 }
    );
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
