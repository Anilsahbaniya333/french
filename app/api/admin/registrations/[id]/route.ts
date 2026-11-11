import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth-admin-check";
import { proofViewUrl } from "@/lib/registration-server";

export const dynamic = "force-dynamic";

/** Full registration details for the admin review panel: signed screenshot URL, history, linked account. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { id } = await params;
  const { data: row, error } = await supabase.from("student_registrations").select("*").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "Registration not found" }, { status: 404 });

  const [proofUrl, eventsRes, accountRes] = await Promise.all([
    proofViewUrl(supabase, row.payment_screenshot_url as string | null),
    supabase
      .from("registration_events")
      .select("id, event, from_status, to_status, note, actor, created_at")
      .eq("registration_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("students")
      .select("id, is_active, level_code, group_uuid, created_at")
      .eq("email", String(row.email).toLowerCase())
      .maybeSingle(),
  ]);

  return NextResponse.json(
    {
      proofUrl,
      history: eventsRes.error ? null : eventsRes.data ?? [],
      historyAvailable: !eventsRes.error,
      account: accountRes.data ?? null,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
