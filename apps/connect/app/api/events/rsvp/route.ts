import { NextRequest, NextResponse } from "next/server";

const WP_RSVP_URL = `${process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com"}/wp-json/culture/v1/event-rsvp`;

export async function POST(req: NextRequest) {
  let payload: any;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, email, eventSlug, eventTitle, ticket, source } = payload;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  if (!name || !eventSlug) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const res = await fetch(WP_RSVP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        event_slug: eventSlug,
        event_title: eventTitle ?? "",
        ticket_type: ticket ?? "general",
        source: source ?? "",
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorCode = data?.error ?? "rsvp_failed";
      const message = data?.message ?? "Could not complete your RSVP. Please try again.";
      return NextResponse.json({ error: errorCode, message }, { status: res.status });
    }

    return NextResponse.json({ success: true, message: data.message }, { status: 201 });
  } catch (error) {
    console.error("RSVP API Route Error:", error);
    return NextResponse.json({ error: "service_unavailable", message: "Service unavailable. Please try again later." }, { status: 503 });
  }
}
