import { NextRequest, NextResponse } from "next/server";

const WP_GRAPHQL_URL =
  process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://cms.themoveee.com/graphql";
const WP_BASE_URL = WP_GRAPHQL_URL.replace(/\/graphql\/?$/, "");

/**
 * Step 1 of the magic-code sign-in that /login and /register both lead with.
 *
 * Site A has its own copy of this proxy at app/api/newsletter/magic-otp/request
 * for the <SubscribeForm> widgets; this is Site B's, for the auth pages. Both
 * are thin passes to the same public WordPress route — WordPress owns the rate
 * limiting (3 per 10 minutes per address) and deliberately never reveals
 * whether the address already has an account, so this route adds no logic of
 * its own beyond shape-checking the body.
 *
 * There is no verify proxy on either app: step 2 calls next-auth's
 * signIn("credentials", { otpEmail, otpCode, ... }) directly, which reaches
 * WordPress through authorize() in packages/shared/lib/auth.ts.
 */
export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  try {
    const res = await fetch(`${WP_BASE_URL}/wp-json/culture/v1/magic-otp/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: json?.message || "Couldn't send a code — try again." },
        { status: res.status }
      );
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Couldn't reach the server — try again." }, { status: 502 });
  }
}
