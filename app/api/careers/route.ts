import { NextResponse } from "next/server";
import { createServiceRoleClient, createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createServiceRoleClient() ?? createServerClient();
  if (!supabase) return NextResponse.json({ careers: [] });

  const { data, error } = await supabase
    .from("careers")
    .select("id, title, location, job_type, description, requirements, created_at")
    .eq("is_active", true)
    .order("sort_order")
    .order("created_at", { ascending: false });

  if (error?.code === "42P01") return NextResponse.json({ careers: [] });
  if (error) return NextResponse.json({ careers: [] });
  return NextResponse.json({ careers: data ?? [] });
}
