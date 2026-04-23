import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceRoleClient, createServerClient } from "@/lib/supabase/server";
import { fetchContacts } from "@/lib/supabase/queries";
import { verifyAdminSessionToken, COOKIE_NAME } from "@/lib/auth-admin";

export async function GET() {
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

  const supabase = createServiceRoleClient() ?? createServerClient();
  const contacts = await fetchContacts(supabase);
  return NextResponse.json({ contacts });
}
