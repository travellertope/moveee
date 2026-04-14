import { NextRequest, NextResponse } from "next/server";

const WP_RSVP_URL = "https://cms.themoveee.com/wp-json/culture/v1/event-rsvp";

export async function POST(req: NextRequest) {
  let payload: any;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, email, eventSlug, eventTitle } = payload;

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
        event_title: eventTitle
      }),
    });

    if (!res.ok) {
      console.error(`RSVP failed for ${eventSlug}: ${res.statusText}`);
      // Fallback: If the endpoint is not yet configured, return success for now 
      // but log the error so the user knows they need to register the endpoint in WP.
      // This allows the UI to stay functional while they configure their backend.
      // return NextResponse.json({ success: true, warning: 'Endpoint not yet registered in WP' });
      return NextResponse.json({ error: "RSVP failed. Integration pending in WordPress." }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("RSVP API Route Error:", error);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
