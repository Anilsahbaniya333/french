import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth-admin-check";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  let { data, error } = await supabase
    .from("levels")
    .select("id, code, title, fee, fee_note")
    .order("code");

  if (error?.message?.includes("fee") || error?.code === "42703") {
    const fallback = await supabase.from("levels").select("id, code, title").order("code");
    if (fallback.error) return NextResponse.json({ error: fallback.error.message }, { status: 500 });
    data = (fallback.data ?? []).map((l) => ({ ...l, fee: null, fee_note: null })) as any;
    error = null;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ levels: data ?? [] });
}

export async function PATCH(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const body = await req.json();
  // body: [{ id, fee, fee_note }, ...]
  const rows: { id: string; fee: string | null; fee_note: string | null }[] = Array.isArray(body) ? body : [body];

  for (const row of rows) {
    if (!row.id) continue;
    await supabase
      .from("levels")
      .update({ fee: row.fee || null, fee_note: row.fee_note || null })
      .eq("id", row.id);
  }

  return NextResponse.json({ success: true });
}
