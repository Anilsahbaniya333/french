import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyAdminSessionToken, COOKIE_NAME } from "@/lib/auth-admin";

async function checkAdmin() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (
    password && password.length >= 8 &&
    secret && secret.length >= 16 &&
    (!token || !(await verifyAdminSessionToken(token)))
  ) {
    return false;
  }
  return true;
}

const ALLOWED = ["modules", "topics", "videos", "materials", "assignments", "practice"];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ resource: string; id: string }> }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { resource, id } = await params;
  if (!ALLOWED.includes(resource)) {
    return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await req.json();
  const patch: Record<string, unknown> = {};

  switch (resource) {
    case "modules":
      if (body.title !== undefined) patch.title = body.title;
      if (body.isPublished !== undefined) patch.is_published = body.isPublished;
      break;
    case "topics":
      if (body.title !== undefined) patch.title = body.title;
      if (body.isPreview !== undefined) patch.is_preview = body.isPreview;
      if (body.isPublished !== undefined) patch.is_published = body.isPublished;
      break;
    case "videos":
      // DB columns: title, url, order_index (no description)
      if (body.title !== undefined) patch.title = body.title;
      if (body.url !== undefined) patch.url = body.url;
      break;
    case "materials":
      // DB columns: title, file_url, file_type, order_index
      if (body.title !== undefined) patch.title = body.title;
      if (body.publicUrl !== undefined) patch.file_url = body.publicUrl;
      if (body.type !== undefined) patch.file_type = body.type;
      break;
    case "assignments":
      // DB columns: title, instructions, due_date_time
      if (body.title !== undefined) patch.title = body.title;
      if (body.instructions !== undefined) patch.instructions = body.instructions;
      if (body.dueNote !== undefined) patch.due_date_time = body.dueNote;
      break;
    case "practice":
      // DB columns: question, options, correct_answer
      if (body.title !== undefined) patch.question = body.title;
      if (body.content !== undefined) patch.options = body.content ? [body.content] : [];
      if (body.instructions !== undefined) patch.correct_answer = body.instructions;
      break;
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await supabase.from(resource).update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ resource: string; id: string }> }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { resource, id } = await params;
  if (!ALLOWED.includes(resource)) {
    return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { error } = await supabase.from(resource).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
