import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ groups: [] });

  const { data } = await supabase
    .from("groups")
    .select("id, group_name, level_code")
    .eq("is_active", true)
    .order("created_at");

  return NextResponse.json({ groups: data ?? [] });
}
