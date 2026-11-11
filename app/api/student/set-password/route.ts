import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { hashPassword } from "@/lib/auth-student";
import { verifyPasswordToken, passwordFingerprintMatches } from "@/lib/registration-server";

export const dynamic = "force-dynamic";

const INVALID = "This link is invalid, expired, or has already been used. Request a new one from the login page.";

/** GET ?token= — check a token before showing the form. POST {token,password} — set the password. */
async function resolve(token: string) {
  const claims = await verifyPasswordToken(token);
  if (!claims) return null;
  const supabase = createServiceRoleClient();
  if (!supabase) return null;
  const { data: student } = await supabase
    .from("students")
    .select("id, full_name, email, password_hash, is_active")
    .eq("id", claims.studentId)
    .maybeSingle();
  if (!student || !student.is_active) return null;
  // One-time use: token is bound to the password hash at issue time.
  if (!passwordFingerprintMatches(student.password_hash, claims.fp)) return null;
  return { supabase, student, purpose: claims.purpose };
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const r = token ? await resolve(token) : null;
  if (!r) return NextResponse.json({ valid: false, error: INVALID }, { status: 400 });
  return NextResponse.json({ valid: true, email: r.student.email, purpose: r.purpose });
}

export async function POST(req: Request) {
  let token = "";
  let password = "";
  try {
    const body = await req.json();
    token = typeof body.token === "string" ? body.token : "";
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (password.length < 8 || password.length > 200) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return NextResponse.json({ error: "Use at least one letter and one number." }, { status: 400 });
  }

  const r = token ? await resolve(token) : null;
  if (!r) return NextResponse.json({ error: INVALID }, { status: 400 });

  // Conditional update guards against two concurrent uses of the same token.
  const { data, error } = await r.supabase
    .from("students")
    .update({ password_hash: hashPassword(password) })
    .eq("id", r.student.id)
    .eq("password_hash", r.student.password_hash)
    .select("id");

  if (error) {
    console.error("[set-password] update failed:", error.message);
    return NextResponse.json({ error: "Could not update your password. Please try again." }, { status: 500 });
  }
  if (!data || data.length === 0) return NextResponse.json({ error: INVALID }, { status: 400 });

  return NextResponse.json({ success: true, email: r.student.email });
}
