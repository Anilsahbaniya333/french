import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth-admin-check";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  // Run counts in parallel
  const [studentsRes, submissionsRes, assignmentsRes, pendingRes, recentRes] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase.from("assignment_submissions").select("id", { count: "exact", head: true }),
    supabase.from("assignments").select("id", { count: "exact", head: true }),
    supabase
      .from("assignment_submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "submitted"),
    supabase
      .from("assignment_submissions")
      .select("id, student_name, student_email, status, submitted_at, assignment_id, assignments(title)")
      .order("submitted_at", { ascending: false })
      .limit(8),
  ]);

  return NextResponse.json({
    total_students: studentsRes.count ?? 0,
    total_submissions: submissionsRes.count ?? 0,
    total_assignments: assignmentsRes.count ?? 0,
    pending_review: pendingRes.count ?? 0,
    recent_submissions: recentRes.data ?? [],
  });
}
