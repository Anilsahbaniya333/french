import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth-admin-check";

export const dynamic = "force-dynamic";

const BUCKET = "course-videos";

/** Ensure the course-videos bucket exists and is public. Safe to call on every upload. */
async function ensureBucket(supabase: ReturnType<typeof createServiceRoleClient>) {
  if (!supabase) return;
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 524288000, // 500 MB
  });
  // "already exists" is not a real error — ignore it
  if (error && !error.message.toLowerCase().includes("already exists")) {
    console.warn(`[video] bucket create warning: ${error.message}`);
  }
}

/**
 * POST — two accepted formats:
 *  1. multipart/form-data with field "file" (preferred — browser sends file directly here)
 *  2. application/json with { path, originalName } (legacy — file already in storage)
 *
 * Both paths save video_url + video_title to the topics row and return them.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  let publicUrl: string;
  let videoTitle: string;

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    // ── Path 1: browser sends file directly ───────────────────────────────
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log(`[video] upload start | topic=${id} file="${file.name}" size=${file.size}`);

    await ensureBucket(supabase);

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `topics/${id}/${Date.now()}_${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    const { data: storageData, error: storageErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, arrayBuffer, {
        contentType: file.type || "video/mp4",
        upsert: true,
      });

    if (storageErr) {
      console.error(`[video] storage upload failed | topic=${id}:`, storageErr.message);
      return NextResponse.json({ error: `Storage upload failed: ${storageErr.message}` }, { status: 500 });
    }

    console.log(`[video] storage upload success | path=${storageData.path}`);

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storageData.path);
    publicUrl = urlData.publicUrl;
    videoTitle = file.name.replace(/\.[^.]+$/, "");

  } else {
    // ── Path 2: legacy — file was uploaded directly to storage by the browser ──
    const body = await req.json().catch(() => ({}));
    const { path, originalName } = body as { path?: string; originalName?: string };
    if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });

    console.log(`[video] legacy path save | topic=${id} path=${path}`);

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    publicUrl = urlData.publicUrl;
    videoTitle = originalName?.replace(/\.[^.]+$/, "") ?? "";
  }

  // ── Save URL and title to topics row ───────────────────────────────────
  console.log(`[video] saving to DB | topic=${id} url=${publicUrl}`);

  const { error: dbErr } = await supabase
    .from("topics")
    .update({ video_url: publicUrl, video_title: videoTitle })
    .eq("id", id);

  if (dbErr) {
    console.error(`[video] DB update failed | topic=${id}:`, dbErr.message);
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  console.log(`[video] done | topic=${id} url=${publicUrl}`);
  return NextResponse.json({ video_url: publicUrl, video_title: videoTitle });
}

/** DELETE — clear video_url and video_title from the topic row */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  console.log(`[video] delete | topic=${id}`);

  const { error } = await supabase
    .from("topics")
    .update({ video_url: null, video_title: null })
    .eq("id", id);

  if (error) {
    console.error(`[video] delete DB error | topic=${id}:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
