import { NextRequest, NextResponse } from "next/server";
import { LITERARY_TOKEN_COOKIE } from "@/lib/literary-access";

const WP_GRAPHQL_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://cms.themoveee.com/graphql";
const WP_BASE_URL = WP_GRAPHQL_URL.replace(/\/graphql\/?$/, "");

/**
 * Step 2 — verifies the code, then relays WordPress's signed verification
 * token into a first-party httpOnly cookie on themoveee.com (WordPress and
 * apps/site are different origins, so WP can't set this cookie directly —
 * same relay pattern /api/preview uses for the draft-preview token).
 *
 * Shared verbatim by /magazine (MagazinePieceGate.tsx) as well as /literary
 * — the optional `context` field only controls which newsletter list a
 * free (non-Pro) verifier joins on the WordPress side (Culture Drop for
 * magazine, the Literary Club list otherwise); everything else about the
 * token/cookie is identical, so verifying once unlocks gated content in
 * both sections.
 */
export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const context = body?.context === "magazine" ? "magazine" : "literary";
  if (!email || !code) {
    return NextResponse.json({ error: "Email and code are required." }, { status: 400 });
  }

  try {
    const res = await fetch(`${WP_BASE_URL}/wp-json/culture/v1/literary/verify-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, context }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.token) {
      return NextResponse.json({ error: json?.message || "That code didn't work." }, { status: res.status || 400 });
    }

    const response = NextResponse.json({ success: true, access: json.access });
    response.cookies.set(LITERARY_TOKEN_COOKIE, json.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Couldn't reach the server — try again." }, { status: 502 });
  }
}
