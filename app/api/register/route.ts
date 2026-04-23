import { NextResponse } from "next/server";
import { createServiceRoleClient, createServerClient } from "@/lib/supabase/server";
import { insertRegistration } from "@/lib/supabase/queries";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const BUCKET = "registration-proofs";

export async function POST(req: Request) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid form data" }, { status: 400 });
  }

  const fullName = (formData.get("fullName") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const phone = (formData.get("phone") as string | null)?.trim() ?? "";
  const level = (formData.get("level") as string | null)?.trim() ?? "";
  const experience = (formData.get("experience") as string | null)?.trim() || null;
  const preferredMode = (formData.get("preferredMode") as string | null)?.trim() || null;
  const preferredTime = (formData.get("preferredTime") as string | null)?.trim() || null;
  const goals = (formData.get("goals") as string | null)?.trim() || null;
  const message = (formData.get("message") as string | null)?.trim() || null;
  const screenshotFile = formData.get("paymentScreenshot");

  if (!fullName || !email || !phone || !level) {
    return NextResponse.json(
      { success: false, error: "Missing required fields (fullName, email, phone, level)" },
      { status: 400 }
    );
  }

  if (!(screenshotFile instanceof File) || screenshotFile.size === 0) {
    return NextResponse.json(
      { success: false, error: "Payment screenshot is required" },
      { status: 400 }
    );
  }

  if (!ALLOWED_IMAGE_TYPES.includes(screenshotFile.type)) {
    return NextResponse.json(
      { success: false, error: "Screenshot must be a JPG, PNG, or WebP image" },
      { status: 400 }
    );
  }

  if (screenshotFile.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { success: false, error: "Screenshot must be under 10 MB" },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient() ?? createServerClient();
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Database not configured. Add Supabase env vars to .env.local." },
      { status: 503 }
    );
  }

  // Upload screenshot to Supabase Storage
  const safeName = screenshotFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${Date.now()}_${safeName}`;

  const arrayBuffer = await screenshotFile.arrayBuffer();
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, arrayBuffer, {
      contentType: screenshotFile.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("[/api/register] Storage upload failed:", uploadError.message);
    return NextResponse.json(
      { success: false, error: "Failed to upload payment screenshot: " + uploadError.message },
      { status: 500 }
    );
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(uploadData.path);
  const paymentScreenshotUrl = urlData.publicUrl;

  let result: { success: boolean; error?: string };
  try {
    result = await insertRegistration(supabase, {
      fullName,
      email,
      phone,
      level,
      experience,
      preferredMode,
      preferredTime,
      goals,
      message,
      paymentScreenshotUrl,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[/api/register] insertRegistration threw:", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }

  if (result.success) {
    return NextResponse.json({ success: true });
  }

  console.error("[/api/register] Supabase insert failed:", result.error);
  return NextResponse.json(
    { success: false, error: result.error || "Could not save registration." },
    { status: 500 }
  );
}
