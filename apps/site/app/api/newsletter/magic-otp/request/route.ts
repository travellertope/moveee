import { NextRequest, NextResponse } from "next/server";

const WP_GRAPHQL_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://cms.themoveee.com/graphql";
const WP_BASE_URL = WP_GRAPHQL_URL.replace(/\/graphql\/?$/, "");

/**
 * Step 1 of the magic-code sign-in/subscribe flow every <SubscribeForm>
 * on the site now uses (see components/SubscribeForm.tsx and
 * culture-community/includes/core/class-culture-magic-otp.php). Public —
 * WordPress itself rate-limits and never reveals whether the email already
 * has an account. Step 2 (verify) has no proxy route of its own: the
 * client calls next-auth's signIn("credentials", { otpEmail, otpCode, ... })
 * directly, which reaches WordPress via authorize() in
 * packages/shared/lib/auth.ts.
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
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ error: json?.message || "Couldn't send a code — try again." }, { status: res.status });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Couldn't reach the server — try again." }, { status: 502 });
  }
}
