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

  // INSERT — only request `id` back to avoid schema-cache issues with optional columns
  let insertResult = await supabase
    .from("students")
    .insert(insertData)
    .select("id")
    .single();

  // Optional columns (level_code / group_uuid) may not exist yet — retry without them
  const missingCol =
    insertResult.error?.message?.includes("level_code") ||
    insertResult.error?.message?.includes("group_uuid") ||
    insertResult.error?.message?.includes("schema cache") ||
    insertResult.error?.code === "42703";

  if (missingCol) {
    const { level_code: _lc, group_uuid: _gu, ...rowMinimal } = insertData;
    insertResult = await supabase
      .from("students")
      .insert(rowMinimal)
      .select("id")
      .single();
  }

  if (insertResult.error) {
    const err = insertResult.error;
    console.error("[POST /api/admin/students] insert error:", { code: err.code, message: err.message, details: err.details, hint: err.hint });
    const msg = err.message ?? "";
    if (msg.includes("unique") || msg.includes("duplicate") || err.code === "23505") {
      return NextResponse.json({ error: "A student with this email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: msg || "Insert failed", code: err.code }, { status: 500 });
  }

  const newId = insertResult.data?.id as string | undefined;
  if (!newId) {
    return NextResponse.json({ error: "Insert returned no ID — check database logs" }, { status: 500 });
  }

  // Fetch the full student row by its new ID
  let { data: student, error: fetchError } = await supabase
    .from("students")
    .select("id, full_name, email, group_id, group_uuid, level_code, is_active, created_at")
    .eq("id", newId)
    .single();

  if (fetchError || !student) {
    // Fallback: minimal select if optional columns aren't in schema yet
    const fallback = await supabase
      .from("students")
      .select("id, full_name, email, group_id, is_active, created_at")
      .eq("id", newId)
      .single();
    if (fallback.data) {
      student = { ...fallback.data, group_uuid: null, level_code: null } as any;
    } else {
      // Last resort: construct from known insert data
      student = {
        id: newId,
        full_name: (insertData.full_name as string),
        email: normalizedEmail,
        group_id: null,
        group_uuid: null,
        level_code: null,
        is_active: true,
        created_at: new Date().toISOString(),
      } as any;
    }
  }

  return NextResponse.json({ student }, { status: 201 });
}
