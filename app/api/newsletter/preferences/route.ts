import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

function wpAuthHeaders() {
  const secret = process.env.CULTURE_API_SECRET ?? "";
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${secret}`,
    "X-Culture-API-Secret": secret,
  };
}

/** GET /api/newsletter/preferences */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(
      `${WP_URL}/wp-json/culture/v1/newsletter-preferences?email=${encodeURIComponent(session.user.email)}`,
      { headers: wpAuthHeaders(), cache: "no-store" }
    );
    if (!res.ok) throw new Error();
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({
      subscriptions: { "cultural-digest": true, getmelit: true, events: true },
    });
  }
}

/** PATCH /api/newsletter/preferences */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { subscriptions?: Record<string, boolean> };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.subscriptions || typeof body.subscriptions !== "object") {
    return NextResponse.json({ error: "subscriptions object required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/newsletter-preferences`, {
      method: "POST",
      headers: wpAuthHeaders(),
      body: JSON.stringify({ email: session.user.email, subscriptions: body.subscriptions }),
      cache: "no-store",
    });
    if (!res.ok) throw new Error();
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ success: true });
  }
}
