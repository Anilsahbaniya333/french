import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ tutors: [], staff: [] });

  const [tutorsRes, staffRes] = await Promise.all([
    supabase
      .from("tutors")
      .select("id, full_name, photo_url, bio, experience, specializations")
      .eq("show_on_homepage", true)
      .order("full_name"),
    supabase
      .from("staff_profiles")
      .select("id, name, role, photo_url, description")
      .eq("show_on_homepage", true)
      .order("sort_order")
      .order("created_at"),
  ]);

  return NextResponse.json({
    tutors: tutorsRes.error ? [] : (tutorsRes.data ?? []),
    staff: staffRes.error ? [] : (staffRes.data ?? []),
  });
}
