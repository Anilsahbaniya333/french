import { NextResponse } from "next/server";
import { STUDENT_COOKIE_NAME } from "@/lib/auth-student";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(STUDENT_COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return response;
}
