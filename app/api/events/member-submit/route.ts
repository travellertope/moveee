import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_KEY = process.env.CULTURE_API_SECRET ?? "";

export async function POST(req: NextRequest) {
  // Require a logged-in session.
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user) {
    return NextResponse.json({ error: "You must be signed in to submit an event." }, { status: 401 });
  }

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { title, event_date } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Event title is required." }, { status: 400 });
  }
  if (!event_date?.trim()) {
    return NextResponse.json({ error: "Event date is required." }, { status: 400 });
  }

  // Ensure the date is not in the past.
  const parsed = new Date(event_date);
  if (isNaN(parsed.getTime())) {
    return NextResponse.json({ error: "Invalid event date." }, { status: 400 });
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (parsed < today) {
    return NextResponse.json({ error: "Event date must be in the future." }, { status: 400 });
  }

  // Format start/end time into a human-readable opening_hours string.
  const fmt12 = (t: string) => {
    if (!t) return "";
    const [h, m] = t.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };
  const startFmt = fmt12(body.start_time ?? "");
  const endFmt   = fmt12(body.end_time ?? "");
  const openingHours = startFmt
    ? endFmt ? `${startFmt} – ${endFmt}` : startFmt
    : "";

  // Forward to WordPress with server-side API key.
  const wpRes = await fetch(`${WP_URL}/wp-json/culture/v1/events/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      title:          body.title?.trim(),
      excerpt:        body.description?.trim() ?? "",
      content:        body.description?.trim() ?? "",
      event_date:     body.event_date,
      end_date:       body.end_date ?? "",
      location:       body.location?.trim() ?? "",
      city:           body.city?.trim() ?? "",
      admission:      body.admission?.trim() ?? "",
      ticketing_url:  body.ticketing_url?.trim() ?? "",
      image_url:          body.image_url?.trim() ?? "",
      featured_image_id:  body.image_id ? Number(body.image_id) : 0,
      opening_hours:      openingHours,
      tagline:        "",
      attribution:    "",
      interests:      body.category ? [body.category] : (Array.isArray(body.interests) ? body.interests : []),
      ai_generated:   true,
      auto_publish:   true,
      submitter_name:  session.user.name ?? "",
      submitter_email: session.user.email ?? "",
    }),
    cache: "no-store",
  });

  if (wpRes.status === 409) {
    return NextResponse.json({ error: "This event has already been submitted." }, { status: 409 });
  }

  if (!wpRes.ok) {
    const err = await wpRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: (err as any).message || "Could not submit the event. Please try again." },
      { status: 500 }
    );
  }

  const data = await wpRes.json();
  return NextResponse.json({ success: true, slug: data.slug });
}
