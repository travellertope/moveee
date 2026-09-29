import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

// Member geolocation — a single, privacy-fuzzed browser Geolocation snapshot
// (see class-culture-geolocation.php: coordinates are rounded to ~1km before
// storage regardless of source precision). One-time capture only, triggered
// by StoopProximityBanner's "Turn on" button via navigator.geolocation — no
// continuous/background tracking on web, same as the mobile GPS capture.

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const res = await fetch(`${WP_URL}/wp-json/culture/v1/me/location`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...body, user_id: session.user.id }),
  }).catch(() => null);

  if (!res) return NextResponse.json({ error: "Could not reach the server." }, { status: 502 });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function GET() {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const res = await fetch(
    `${WP_URL}/wp-json/culture/v1/me/location?user_id=${session.user.id}`,
    { headers: { Authorization: `Bearer ${API_SECRET}` }, cache: "no-store" }
  ).catch(() => null);

  if (!res) return NextResponse.json({ error: "Could not reach the server." }, { status: 502 });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE() {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const res = await fetch(
    `${WP_URL}/wp-json/culture/v1/me/location?user_id=${session.user.id}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${API_SECRET}` } }
  ).catch(() => null);

  if (!res) return NextResponse.json({ error: "Could not reach the server." }, { status: 502 });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
