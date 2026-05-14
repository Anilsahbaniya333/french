import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Public endpoint — returns only contact-safe settings */
export async function GET() {
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ settings: {} });

  const { data } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["contact_email", "contact_phone", "contact_phone_2", "contact_address"]);

  const settings: Record<string, string> = {};
  for (const row of data ?? []) settings[row.key] = row.value ?? "";
  return NextResponse.json({ settings });
}
