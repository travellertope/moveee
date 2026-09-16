import { NextRequest, NextResponse } from "next/server";

const WP_GRAPHQL_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://cms.themoveee.com/graphql";
const WP_BASE_URL = WP_GRAPHQL_URL.replace(/\/graphql\/?$/, "");

/**
 * Step 1 of The Moveee Literary's email/OTP verification — see
 * culture-community/includes/core/class-culture-literary-access.php.
 * Public: WordPress itself rate-limits and never returns whether the
 * email exists anywhere, so there's nothing sensitive to gate here.
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
    const res = await fetch(`${WP_BASE_URL}/wp-json/culture/v1/literary/request-code`, {
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
