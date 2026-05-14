import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth-admin-check";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { data, error } = await supabase
    .from("career_applications")
    .select("id, full_name, email, phone, message, resume_url, status, created_at, careers(title)")
    .order("created_at", { ascending: false });

  if (error?.code === "42P01") return NextResponse.json({ applications: [] });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Generate 1-hour signed URLs for any stored resumes
  const applications = await Promise.all(
    (data ?? []).map(async (app) => {
      let resume_signed_url: string | null = null;
      if (app.resume_url) {
        const { data: signed } = await supabase.storage
          .from("career-resumes")
          .createSignedUrl(app.resume_url, 3600);
        resume_signed_url = signed?.signedUrl ?? null;
      }
      return { ...app, resume_signed_url };
    })
  );

  return NextResponse.json({ applications });
}
