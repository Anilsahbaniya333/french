import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const group = searchParams.get("group");         // legacy integer group_id
  const groupUuid = searchParams.get("group_uuid"); // new UUID-based group

  const { data, error } = await supabase
    .from("assignments")
    .select(`
      id, title, instructions, due_date_time, max_score, target_groups, target_group_uuids,
      topics (
        id, title, module_id,
        modules ( id, title, level_id, levels ( code, title ) )
      )
    `)
    .order("created_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let assignments = (data ?? []) as any[];

  if (groupUuid) {
    // UUID-based filtering: empty target_group_uuids = visible to all
    assignments = assignments.filter((a) => {
      const uuids: string[] = a.target_group_uuids ?? [];
      return uuids.length === 0 || uuids.includes(groupUuid);
    });
  } else if (group) {
    // Legacy integer group filtering
    const g = parseInt(group);
    assignments = assignments.filter((a) => {
      const groups: number[] = a.target_groups ?? [];
      return groups.length === 0 || groups.includes(g);
    });
  }

  console.log(`[assignments] group_uuid=${groupUuid ?? "-"} group=${group ?? "-"} total=${(data ?? []).length} filtered=${assignments.length}`);

  // Strip internal fields from client response
  assignments = assignments.map(({ target_groups: _tg, target_group_uuids: _tgu, ...rest }) => rest);

  return NextResponse.json({ assignments });
}
