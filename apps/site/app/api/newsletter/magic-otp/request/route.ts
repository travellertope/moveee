import { NextRequest, NextResponse } from "next/server";
import {
  OTP_COOKIE,
  OTP_CODE_TTL,
  encodeOtpCookie,
} from "@/lib/otp-utils";

const WP_BASE_URL =
  process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

/**
 * Step 1 of the magic-code subscribe flow used by <SubscribeForm> widgets
 * on the magazine site. Generates the code here, stores it in a signed
 * HttpOnly cookie, and asks WordPress only to send the email.
 * Step 2 calls /api/auth/magic-otp/verify (Site A's copy) with the code.
 */
export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");

  try {
    const emailRes = await fetch(
      `${WP_BASE_URL}/wp-json/culture/v1/otp/send-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_SECRET}`,
        },
        body: JSON.stringify({ email, code }),
        cache: "no-store",
      }
    );
    if (!emailRes.ok) {
      const j = await emailRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: j?.message || "Couldn't send a code — try again." },
        { status: emailRes.status }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach the server — try again." },
      { status: 502 }
    );
  }

  const signed = encodeOtpCookie(email, code);
  const response = NextResponse.json({ success: true });
  response.cookies.set(OTP_COOKIE, signed, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: OTP_CODE_TTL,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
