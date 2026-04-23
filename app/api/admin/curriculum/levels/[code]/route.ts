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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await params;
  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await req.json();
  const patch: Record<string, unknown> = {};

  if (body.title !== undefined) patch.title = body.title;
  if (body.subtitle !== undefined) patch.subtitle = body.subtitle;
  if (body.description !== undefined) patch.description = body.description;
  if (body.overview !== undefined) patch.overview = body.overview;
  if (body.duration !== undefined) patch.duration = body.duration;
  if (body.levelGoals !== undefined) patch.goals = body.levelGoals;
  if (body.isPublished !== undefined) patch.is_published = body.isPublished;

  const { error } = await supabase
    .from("levels")
    .update(patch)
    .eq("code", code.toUpperCase());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
