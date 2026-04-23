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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ resource: string }> }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { resource } = await params;
  if (!ALLOWED.includes(resource)) {
    return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await req.json();
  console.log(`[curriculum POST] resource=${resource} body=`, JSON.stringify(body));
  let row: Record<string, unknown>;

  switch (resource) {
    case "modules":
      // DB columns: id, level_id, title, sort_order, created_at
      row = {
        level_id: body.levelId,
        title: body.title,
        sort_order: body.sortOrder ?? 0,
      };
      break;
    case "topics":
      // DB columns: id, module_id, title, is_preview, sort_order, created_at
      row = {
        module_id: body.moduleId,
        title: body.title,
        is_preview: body.isPreview ?? false,
        sort_order: body.sortOrder ?? 0,
      };
      break;
    case "videos":
      // DB columns: id, topic_id, title, url, sort_order, created_at
      row = {
        topic_id: body.topicId ?? body.levelId,
        title: body.title,
        url: body.url,
        sort_order: body.sortOrder ?? 0,
      };
      break;
    case "materials":
      // DB columns: id, topic_id, title, file_url, file_type, sort_order, created_at
      row = {
        topic_id: body.topicId ?? null,
        level_id: body.levelId ?? null,
        title: body.title,
        file_url: body.publicUrl ?? null,
        file_type: body.type ?? "pdf",
        sort_order: body.sortOrder ?? 0,
      };
      break;
    case "assignments":
      // DB columns: id, level_id, topic_id, title, instructions, description, due_date_time
      row = {
        level_id: body.levelId ?? null,
        topic_id: body.topicId ?? null,
        title: body.title,
        instructions: body.instructions ?? null,
        due_date_time: body.dueNote ?? null,
      };
      break;
    case "practice":
      // DB columns: id, level_id, question, options, correct_answer, created_at
      row = {
        level_id: body.levelId,
        question: body.title ?? "",
        options: body.content ? [body.content] : [],
        correct_answer: body.instructions ?? "",
      };
      break;
    default:
      return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
  }

  const { data, error } = await supabase.from(resource).insert(row).select("id").single();
  if (error) {
    console.error(`[curriculum POST] ${resource} insert failed:`, error.message, "| row:", JSON.stringify(row));
    return NextResponse.json({ error: error.message, detail: error.details, hint: error.hint }, { status: 500 });
  }
  return NextResponse.json({ id: (data as Record<string, unknown>).id });
}
