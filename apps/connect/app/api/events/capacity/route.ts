import { NextRequest, NextResponse } from "next/server";

const WP_CAPACITY_URL = `${process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com"}/wp-json/culture/v1/event-rsvp/capacity`;

export async function GET(req: NextRequest) {
  const eventSlug = req.nextUrl.searchParams.get("event_slug");
  if (!eventSlug) {
    return NextResponse.json({ error: "Missing event_slug" }, { status: 400 });
  }

  try {
    const res = await fetch(`${WP_CAPACITY_URL}?event_slug=${encodeURIComponent(eventSlug)}`, {
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "service_unavailable" }, { status: 503 });
  }
}
