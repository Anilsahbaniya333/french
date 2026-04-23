import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyStudentSessionToken, STUDENT_COOKIE_NAME } from "@/lib/auth-student";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = (await cookies()).get(STUDENT_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const student = await verifyStudentSessionToken(token);
  if (!student) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  // Get student's level_code from DB
  const { data: studentRow } = await supabase
    .from("students")
    .select("level_code")
    .eq("id", student.id)
    .single();

  const levelCode = studentRow?.level_code;
  if (!levelCode) return NextResponse.json({ level: null, modules: [] });

  // Fetch the level
  const { data: level } = await supabase
    .from("levels")
    .select("id, code, title, subtitle, description, duration")
    .eq("code", levelCode)
    .single();

  if (!level) return NextResponse.json({ level: null, modules: [] });

  // Fetch modules with topics (including video_url for hasVideo badge, and file/exercise/assignment counts)
  // Only show published modules and topics to students
  const { data: modules } = await supabase
    .from("modules")
    .select(`
      id, title, description, sort_order, is_published,
      topics (
        id, title, description, estimated_duration, sort_order, is_published,
        video_url,
        videos ( id ),
        materials ( id ),
        exercises ( id ),
        assignments ( id )
      )
    `)
    .eq("level_id", level.id)
    .neq("is_published", false)
    .order("sort_order", { ascending: true });

  // Sort topics + normalize hasVideo to include both video_url and videos table
  const sorted = (modules ?? []).map((m: any) => ({
    ...m,
    topics: (m.topics ?? [])
      .filter((t: any) => t.is_published !== false)
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((t: any) => ({
        ...t,
        // Normalize: hasVideo = true if video_url exists OR videos table has entries
        hasVideo: !!(t.video_url || (t.videos && t.videos.length > 0)),
        hasMaterial: (t.materials ?? []).length > 0,
        hasExercise: (t.exercises ?? []).length > 0,
        hasAssignment: (t.assignments ?? []).length > 0,
        // Keep raw arrays for compatibility
        videos: t.videos ?? [],
        materials: t.materials ?? [],
        exercises: t.exercises ?? [],
        assignments: t.assignments ?? [],
      })),
  }));

  return NextResponse.json({ level, modules: sorted });
}
