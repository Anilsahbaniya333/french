import { SignJWT, jwtVerify } from "jose";

export const COOKIE_NAME = "admin_session";

function getSecret(): Uint8Array | null {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 16) return null;
  return new TextEncoder().encode(s);
}

/** Whether admin password protection is enabled */
export function isAdminAuthConfigured(): boolean {
  return !!(
    process.env.ADMIN_PASSWORD &&
    process.env.ADMIN_PASSWORD.length >= 8 &&
    getSecret()
  );
}

export async function createAdminSessionToken(): Promise<string | null> {
  const secret = getSecret();
  if (!secret) return null;
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyAdminSessionToken(token: string): Promise<boolean> {
  const secret = getSecret();
  if (!secret) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}
