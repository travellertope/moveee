import { NextRequest, NextResponse } from "next/server";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { email, post_id } = body as { email?: string; post_id?: number };

  if (!email || !post_id) {
    return NextResponse.json({ error: "Missing email or post_id." }, { status: 400 });
  }

  const res = await fetch(`${WP_URL}/wp-json/culture/v1/community/event/rsvp-paid-guest-initiate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, post_id }),
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { error: data?.message ?? "Could not start payment." },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
