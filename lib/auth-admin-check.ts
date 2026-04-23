/**
 * Shared admin auth check for API routes
 */
import { cookies } from "next/headers";
import { verifyAdminSessionToken, COOKIE_NAME } from "@/lib/auth-admin";

export async function checkAdmin(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (
    password && password.length >= 8 &&
    secret && secret.length >= 16 &&
    (!token || !(await verifyAdminSessionToken(token)))
  ) {
    return false;
  }
  return true;
}
