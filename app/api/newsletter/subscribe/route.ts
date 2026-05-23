import { NextRequest, NextResponse } from "next/server";

const WP_SUBSCRIBE_URL = "https://cms.themoveee.com/wp-json/culture/v1/newsletter-subscribe";

export async function POST(req: NextRequest) {
  let email: string;
  let name = "";
  let list = "culture-drop";
  let segment = "";

  try {
    const body = await req.json();
    email = body?.email?.trim();
    if (body?.name) name = String(body.name).trim().slice(0, 100);
    if (body?.list) list = String(body.list).trim();
    if (body?.segment) segment = String(body.segment).trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  try {
    const res = await fetch(WP_SUBSCRIBE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, list, segment }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Subscription failed" }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
