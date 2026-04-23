import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceRoleClient, createServerClient } from "@/lib/supabase/server";
import { verifyAdminSessionToken, COOKIE_NAME } from "@/lib/auth-admin";

const ALLOWED_STATUSES = ["pending", "approved", "rejected"] as const;
type Status = (typeof ALLOWED_STATUSES)[number];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (
    password &&
    password.length >= 8 &&
    secret &&
    secret.length >= 16 &&
    (!token || !(await verifyAdminSessionToken(token)))
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: { status?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = body.status as string;
  if (!ALLOWED_STATUSES.includes(status as Status)) {
    return NextResponse.json(
      { error: `status must be one of: ${ALLOWED_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient() ?? createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { error } = await supabase
    .from("student_registrations")
    .update({ status })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, status });
}
