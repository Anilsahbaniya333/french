import { NextResponse } from "next/server";
import { createServerClient, createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createServiceRoleClient() ?? createServerClient();
  if (!supabase) return NextResponse.json({ programs: [] });

  const { data, error } = await supabase
    .from("programs")
    .select("id, title, subtitle, tutor_name, badge, cta_label, cta_href, sort_order")
    .eq("is_active", true)
    .order("sort_order")
    .order("created_at");

  if (error) return NextResponse.json({ programs: [] });
  return NextResponse.json({ programs: data ?? [] });
}
