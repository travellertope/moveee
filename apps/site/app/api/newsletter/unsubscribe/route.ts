/**
 * Newsletter unsubscribe API route.
 *
 * Proxies the request to the WordPress REST API so the CMS backend URL
 * (cms.themoveee.com) is never exposed to the subscriber's browser.
 * All token validation happens server-side in WordPress.
 */

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

export async function POST(req: Request) {
  let body: { email?: string; token?: string; campaign_id?: number };

  try {
    body = await req.json();
  } catch {
    return Response.json(
      { success: false, message: "Invalid request body." },
      { status: 400 }
    );
  }

  const { email, token, campaign_id } = body;

  if (!email || !token) {
    return Response.json(
      { success: false, message: "email and token are required." },
      { status: 400 }
    );
  }

  try {
    const wpRes = await fetch(
      `${WP_URL}/wp-json/culture/v1/newsletter-unsubscribe`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, campaign_id }),
        cache: "no-store",
      }
    );

    const data = await wpRes.json();

    return Response.json(data, { status: wpRes.ok ? 200 : wpRes.status });
  } catch {
    return Response.json(
      { success: false, message: "Service temporarily unavailable." },
      { status: 503 }
    );
  }
}
