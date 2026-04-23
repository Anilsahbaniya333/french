import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth-admin-check";
import { hashPassword } from "@/lib/auth-student";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  let { data, error } = await supabase
    .from("students")
    .select("id, full_name, email, group_id, group_uuid, level_code, is_active, created_at")
    .order("created_at", { ascending: false });

  // level_code / group_uuid columns may not exist yet — fall back to minimal select
  if (
    error?.message?.includes("level_code") ||
    error?.message?.includes("group_uuid") ||
    error?.message?.includes("schema cache")
  ) {
    const fallback = await supabase
      .from("students")
      .select("id, full_name, email, group_id, is_active, created_at")
      .order("created_at", { ascending: false });
    if (fallback.error) return NextResponse.json({ error: fallback.error.message }, { status: 500 });
    data = (fallback.data ?? []).map((s) => ({ ...s, level_code: null, group_uuid: null })) as any;
    error = null;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ students: data ?? [] });
}

export async function POST(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const body = await req.json();
  const { full_name, email, password, group_id, group_uuid, level_code } = body;

  if (!full_name?.trim() || !email?.trim() || !password || password.length < 6) {
    return NextResponse.json({ error: "full_name, email, and password (min 6 chars) are required" }, { status: 400 });
  }

  const password_hash = hashPassword(password);

  // Try insert with level_code and group_uuid; fall back to minimal if columns missing
  const normalizedEmail = email.trim().toLowerCase();

  const insertData: Record<string, unknown> = {
    full_name: full_name.trim(),
    email: normalizedEmail,
    password_hash,
    group_id: group_id ?? null,
    is_active: true,
  };
  if (level_code) insertData.level_code = level_code;
  if (group_uuid) insertData.group_uuid = group_uuid;

  // Step 1: INSERT only — no .select() to avoid Supabase "returning" quirks
  let { error: insertError } = await supabase
    .from("students")
    .insert(insertData);

  // Optional columns (level_code / group_uuid) may not exist yet — retry without them
  if (
    insertError?.message?.includes("level_code") ||
    insertError?.message?.includes("group_uuid") ||
    insertError?.message?.includes("schema cache")
  ) {
    const { level_code: _lc, group_uuid: _gu, ...rowMinimal } = insertData;
    const { error: fallbackErr } = await supabase
      .from("students")
      .insert(rowMinimal);
    insertError = fallbackErr ?? null;
  }

  if (insertError) {
    if (insertError.message.includes("unique") || insertError.message.includes("duplicate")) {
      return NextResponse.json({ error: "A student with this email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Step 2: SELECT the newly created student by email
  const { data, error: selectError } = await supabase
    .from("students")
    .select()
    .eq("email", normalizedEmail)
    .single();

  if (selectError) {
    return NextResponse.json({ error: selectError.message }, { status: 500 });
  }
  if (!data?.id) {
    return NextResponse.json({ error: "Student was created but could not be retrieved" }, { status: 500 });
  }

  return NextResponse.json({ student: data }, { status: 201 });
}
