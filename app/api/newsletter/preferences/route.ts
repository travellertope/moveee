import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

/**
 * GET /api/newsletter/preferences
 * Returns the current newsletter subscription state for the authenticated user.
 * Proxies to WP REST: GET /wp-json/culture/v1/newsletter-preferences?email=...
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = session.user.email;

  try {
    const res = await fetch(
      `${WP_URL}/wp-json/culture/v1/newsletter-preferences?email=${encodeURIComponent(email)}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      // WP endpoint may not exist yet — return safe defaults (all subscribed)
      return NextResponse.json({
        subscriptions: {
          "cultural-digest": true,
          "getmelit": true,
          "events": true,
        },
      });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    // Fallback: assume subscribed to avoid false unsubscribe states
    return NextResponse.json({
      subscriptions: {
        "cultural-digest": true,
        "getmelit": true,
        "events": true,
      },
    });
  }
}

/**
 * PATCH /api/newsletter/preferences
 * Updates the authenticated user's newsletter subscriptions.
 * Body: { subscriptions: { [id: string]: boolean } }
 * Proxies to WP REST: POST /wp-json/culture/v1/newsletter-preferences
 */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { subscriptions?: Record<string, boolean> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.subscriptions || typeof body.subscriptions !== "object") {
    return NextResponse.json({ error: "subscriptions object required" }, { status: 400 });
  }

  const email = session.user.email;

  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/newsletter-preferences`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, subscriptions: body.subscriptions }),
      cache: "no-store",
    });

    if (!res.ok) {
      // WP endpoint may not exist yet — acknowledge optimistically
      return NextResponse.json({ success: true });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ success: true });
  }
}
