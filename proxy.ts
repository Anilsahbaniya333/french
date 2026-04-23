import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminSessionToken, COOKIE_NAME } from "@/lib/auth-admin";
import { verifyStudentSessionToken, STUDENT_COOKIE_NAME } from "@/lib/auth-student";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Protect admin routes (except login page) ────────────────────────────────
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const password = process.env.ADMIN_PASSWORD;
    const secret = process.env.ADMIN_SESSION_SECRET;

    // If auth not fully configured, allow access (dev convenience)
    if (password && password.length >= 8 && secret && secret.length >= 16) {
      const token = request.cookies.get(COOKIE_NAME)?.value;
      if (!token || !(await verifyAdminSessionToken(token))) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/login";
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
    }
    return NextResponse.next();
  }

  // ── Protect student dashboard routes ────────────────────────────────────────
  if (pathname.startsWith("/student/dashboard")) {
    const token = request.cookies.get(STUDENT_COOKIE_NAME)?.value;
    if (!token || !(await verifyStudentSessionToken(token))) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/student/login";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/student/dashboard/:path*"],
};
