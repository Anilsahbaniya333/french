import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth-admin-check";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const body = await req.json();
  const patch: Record<string, unknown> = {};
  if (body.question !== undefined) patch.question = body.question;
  if (body.option_a !== undefined) patch.option_a = body.option_a;
  if (body.option_b !== undefined) patch.option_b = body.option_b;
  if (body.option_c !== undefined) patch.option_c = body.option_c;
  if (body.option_d !== undefined) patch.option_d = body.option_d;
  if (body.correct_answer !== undefined) patch.correct_answer = body.correct_answer;
  if (body.explanation !== undefined) patch.explanation = body.explanation;

  const { error } = await supabase.from("exercises").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { error } = await supabase.from("exercises").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
