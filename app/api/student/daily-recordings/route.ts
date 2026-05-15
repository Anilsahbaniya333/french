import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyStudentSessionToken, STUDENT_COOKIE_NAME } from "@/lib/auth-student";

export const dynamic = "force-dynamic";

const BUCKET = "daily-recording-files";

export async function GET() {
  const token = (await cookies()).get(STUDENT_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const student = await verifyStudentSessionToken(token);
  if (!student) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  // Always fetch fresh group_uuid from DB (session token may be stale)
  const { data: studentRow } = await supabase
    .from("students")
    .select("group_uuid")
    .eq("id", student.id)
    .single();

  const groupUuid = studentRow?.group_uuid ?? (student as any).group_uuid;
  if (!groupUuid) return NextResponse.json({ recordings: [] });

  const { data, error } = await supabase
    .from("daily_recording_posts")
    .select("id, title, class_date, description, video_url, file_url, file_name, special_instructions, created_at")
    .eq("group_id", groupUuid)
    .eq("is_published", true)
    .order("class_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error?.code === "42P01") return NextResponse.json({ recordings: [] });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Generate 1-hour signed URLs for attached files
  const recordings = await Promise.all(
    (data ?? []).map(async (rec) => {
      let signed_file_url: string | null = null;
      if (rec.file_url) {
        const { data: signed } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(rec.file_url, 3600);
        signed_file_url = signed?.signedUrl ?? null;
      }
      return { ...rec, signed_file_url };
    })
  );

  return NextResponse.json({ recordings });
}
