import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminSessionToken, COOKIE_NAME } from "@/lib/auth-admin";

function safeCompare(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "utf8");
    const bb = Buffer.from(b, "utf8");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || expected.length < 8) {
    return NextResponse.json(
      { error: "Admin password not configured on server. Set ADMIN_PASSWORD in .env.local." },
      { status: 503 }
    );
  }

  const token = await createAdminSessionToken();
  if (!token) {
    return NextResponse.json(
      {
        error:
          "Set ADMIN_SESSION_SECRET (at least 16 characters) in .env.local.",
      },
      { status: 503 }
    );
  }

  if (!safeCompare(password, expected)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
