/**
 * Shared utilities for the Next.js-owned OTP flow.
 *
 * The OTP code is generated and verified entirely in Next.js (stored in a
 * signed HttpOnly cookie). WordPress only handles two things: emailing the
 * code and finding/creating the user account after verification. This
 * eliminates WP object-cache and OPcache as failure modes.
 *
 * Server-only — never import from client components.
 */
import { createHmac, timingSafeEqual } from "crypto";
import { encode, decode } from "next-auth/jwt";

export const OTP_COOKIE = "__otp_p";
export const OTP_CODE_TTL = 600; // 10 minutes
export const PROFILE_JWT_TTL = 120; // 2 minutes — single-use by signIn
export const MAX_OTP_ATTEMPTS = 5;

export interface OtpCookiePayload {
  email: string;
  code: string;
  attempts: number;
  exp: number;
}

function getSecret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET not set");
  return s;
}

export function encodeOtpCookie(email: string, code: string): string {
  const payload: OtpCookiePayload = {
    email,
    code,
    attempts: 0,
    exp: Math.floor(Date.now() / 1000) + OTP_CODE_TTL,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", getSecret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function decodeOtpCookie(token: string): OtpCookiePayload | null {
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const data = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", getSecret()).update(data).digest("base64url");
  try {
    const sigBuf = Buffer.from(sig, "base64url");
    const expBuf = Buffer.from(expected, "base64url");
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
  } catch {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(data, "base64url").toString()) as OtpCookiePayload;
  } catch {
    return null;
  }
}

export function reencodeOtpCookie(payload: OtpCookiePayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", getSecret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export async function encodeProfileJwt(
  profile: Record<string, unknown>
): Promise<string> {
  return encode({
    token: { ...profile, _otp_v: 1 },
    secret: getSecret(),
    maxAge: PROFILE_JWT_TTL,
  });
}

export async function decodeProfileJwt(
  token: string
): Promise<Record<string, unknown> | null> {
  try {
    const decoded = await decode({ token, secret: getSecret() });
    if (!decoded || (decoded as any)._otp_v !== 1) return null;
    return decoded as Record<string, unknown>;
  } catch {
    return null;
  }
}
