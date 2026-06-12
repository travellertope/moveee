import { NextRequest, NextResponse } from "next/server";

const WP_GAMES_SUBSCRIBE_URL = `${process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com"}/wp-json/culture/v1/games-subscribe`;

export async function POST(req: NextRequest) {
  let email: string;

  try {
    const body = await req.json();
    email = body?.email?.trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  try {
    const res = await fetch(WP_GAMES_SUBSCRIBE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Subscription failed" }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
