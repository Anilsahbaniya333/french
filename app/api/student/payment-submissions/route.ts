import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyStudentSessionToken, STUDENT_COOKIE_NAME } from "@/lib/auth-student";

export const dynamic = "force-dynamic";

const PAYMENT_BUCKET = "payment-proofs";
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

async function getStudent() {
  const token = (await cookies()).get(STUDENT_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyStudentSessionToken(token);
}

/** GET — list the current student's own payment submissions */
export async function GET() {
  const student = await getStudent();
  if (!student) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { data, error } = await supabase
    .from("payment_submissions")
    .select("id, image_url, note, status, created_at, groups(id, group_name, level_code, tutors(full_name))")
    .eq("student_id", student.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ submissions: data ?? [] });
}

/** POST — upload screenshot + create submission record */
export async function POST(req: Request) {
  const student = await getStudent();
  if (!student) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const formData = await req.formData();
  const file = formData.get("screenshot") as File | null;
  const group_id = (formData.get("group_id") as string | null) || null;
  const note = (formData.get("note") as string | null)?.trim() || null;

  if (!file) {
    return NextResponse.json({ error: "screenshot file is required" }, { status: 400 });
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG, or WebP images are accepted" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Image must be under 10 MB" }, { status: 400 });
  }

  // Upload image to Supabase Storage
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `${student.id}/${Date.now()}_${safeName}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(PAYMENT_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from(PAYMENT_BUCKET).getPublicUrl(uploadData.path);
  const image_url = urlData.publicUrl;

  // Insert DB record (student can only submit for their own id — enforced here)
  const { data, error } = await supabase
    .from("payment_submissions")
    .insert({ student_id: student.id, group_id, image_url, note, status: "pending" })
    .select("id, image_url, note, status, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ submission: data }, { status: 201 });
}
