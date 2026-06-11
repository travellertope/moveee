import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const WP_SUBSCRIBE_URL = process.env.NEXT_PUBLIC_WP_URL
  ? `${process.env.NEXT_PUBLIC_WP_URL}/wp-json/culture/v1/newsletter-subscribe`
  : "https://cms.themoveee.com/wp-json/culture/v1/newsletter-subscribe";

const VALID_LISTS    = ["getmelit", "culture-drop", "culture-narratives-digest", "vendor-letter", "origins-field-notes"];
const VALID_SEGMENTS = ["us", "uk", "ng", "gh", "ca", "au", ""];

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const { allowed } = await checkRateLimit("nl-subscribe", ip, 3, "1h");
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

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

  if (!VALID_LISTS.includes(list)) {
    return NextResponse.json({ error: "Invalid list." }, { status: 400 });
  }
  if (!VALID_SEGMENTS.includes(segment)) {
    return NextResponse.json({ error: "Invalid segment." }, { status: 400 });
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
