import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  OTP_COOKIE,
  OTP_CODE_TTL,
  MAX_OTP_ATTEMPTS,
  decodeOtpCookie,
  reencodeOtpCookie,
  encodeProfileJwt,
} from "@/lib/otp-utils";

const WP_BASE_URL =
  process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

/**
 * Step 2 of the magic-code sign-in.
 *
 * Reads the OTP from the signed HttpOnly cookie set by /request, verifies
 * the code, then asks WordPress to find-or-create the account. Returns a
 * short-lived signed profile JWT that signIn("credentials", { otpVerifiedJwt })
 * exchanges for a real NextAuth session — no WP call needed at that point.
 */
export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const enteredCode = typeof body?.code === "string" ? body.code.replace(/\D/g, "") : "";
  if (enteredCode.length !== 6) {
    return NextResponse.json({ error: "Enter the 6-digit code.", code: "invalid_input" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get(OTP_COOKIE)?.value;
  if (!raw) {
    return NextResponse.json(
      { error: "That code has expired — request a new one.", code: "code_expired" },
      { status: 400 }
    );
  }

  const payload = decodeOtpCookie(raw);
  if (!payload) {
    return NextResponse.json(
      { error: "That code has expired — request a new one.", code: "code_expired" },
      { status: 400 }
    );
  }

  const now = Math.floor(Date.now() / 1000);
  if (now > payload.exp) {
    const response = NextResponse.json(
      { error: "That code has expired — request a new one.", code: "code_expired" },
      { status: 400 }
    );
    response.cookies.delete(OTP_COOKIE);
    return response;
  }

  if (payload.attempts >= MAX_OTP_ATTEMPTS) {
    const response = NextResponse.json(
      { error: "Too many incorrect attempts — request a new code.", code: "too_many_attempts" },
      { status: 429 }
    );
    response.cookies.delete(OTP_COOKIE);
    return response;
  }

  if (enteredCode !== payload.code) {
    const updated = { ...payload, attempts: payload.attempts + 1 };
    const newSigned = reencodeOtpCookie(updated);
    const remaining = MAX_OTP_ATTEMPTS - updated.attempts;
    const response = NextResponse.json(
      {
        error: remaining > 0
          ? `Incorrect code — ${remaining} attempt${remaining === 1 ? "" : "s"} left.`
          : "Too many incorrect attempts — request a new code.",
        code: remaining > 0 ? "invalid_code" : "too_many_attempts",
      },
      { status: 400 }
    );
    if (remaining > 0) {
      response.cookies.set(OTP_COOKIE, newSigned, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: payload.exp - now,
        secure: process.env.NODE_ENV === "production",
      });
    } else {
      response.cookies.delete(OTP_COOKIE);
    }
    return response;
  }

  // Code is correct — fetch user profile from WP.
  const list = typeof body?.list === "string" ? body.list.trim() : "";
  const referral = typeof body?.referral === "string" ? body.referral.trim() : "";

  let wpProfile: Record<string, unknown>;
  try {
    const wpRes = await fetch(
      `${WP_BASE_URL}/wp-json/culture/v1/otp/find-or-create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_SECRET}`,
        },
        body: JSON.stringify({ email: payload.email, list, referral }),
        cache: "no-store",
      }
    );
    if (!wpRes.ok) {
      let wpBody: Record<string, unknown> = {};
      try { wpBody = await wpRes.json(); } catch { /* non-JSON body */ }
      console.error(
        "[otp/verify] WP find-or-create failed:",
        wpRes.status,
        JSON.stringify(wpBody).slice(0, 500)
      );
      const friendlyMsg =
        typeof wpBody?.message === "string" && wpBody.message
          ? wpBody.message
          : "Account error — couldn't complete sign-in. Try again.";
      return NextResponse.json(
        { error: friendlyMsg, code: "wp_error" },
        { status: 502 }
      );
    }
    try {
      wpProfile = await wpRes.json();
    } catch {
      console.error("[otp/verify] WP returned non-JSON 200 response");
      return NextResponse.json(
        { error: "Account error — couldn't complete sign-in. Try again.", code: "wp_error" },
        { status: 502 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach the server — try again.", code: "network_error" },
      { status: 502 }
    );
  }

  const token = await encodeProfileJwt(wpProfile);

  const response = NextResponse.json({ token });
  response.cookies.delete(OTP_COOKIE);
  return response;
}
