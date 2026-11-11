import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail, getAdmissionsEmail, isEmailConfigured } from "@/lib/email";
import { createPasswordToken, resetEmail, siteUrl } from "@/lib/registration-server";

export const dynamic = "force-dynamic";

const WINDOW_MS = 15 * 60_000;
const hits = new Map<string, number[]>();
function limited(key: string, max: number) {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return list.length > max;
}

const GENERIC =
  "If an active student account exists for that email, we've sent a password reset link. It expires in 1 hour.";

export async function POST(req: Request) {
  let email = "";
  try {
    const body = await req.json();
    email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 200) : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const ip = (req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown").trim();
  const ipKey = createHash("sha256").update(ip).digest("hex");
  if (limited(`ip:${ipKey}`, 10) || limited(`em:${email}`, 3)) {
    return NextResponse.json({ error: "Too many requests. Please try again in a few minutes." }, { status: 429 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: `Password reset by email isn't available yet. Please contact ${getAdmissionsEmail()}.` },
      { status: 503 }
    );
  }

  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const { data: student } = await supabase
    .from("students")
    .select("id, full_name, password_hash, is_active")
    .eq("email", email)
    .maybeSingle();

  // Same response whether or not the account exists (no account enumeration).
  if (student?.is_active) {
    const token = await createPasswordToken(student.id, student.password_hash, "reset");
    if (token) {
      const url = `${siteUrl(req)}/student/set-password?token=${encodeURIComponent(token)}`;
      const res = await sendEmail({ to: email, ...resetEmail({ name: student.full_name ?? "", url }) });
      if (!res.sent) console.error("[forgot-password] email not sent:", res.error);
    }
  }
  return NextResponse.json({ success: true, message: GENERIC });
}
