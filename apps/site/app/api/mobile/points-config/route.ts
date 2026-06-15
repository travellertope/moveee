import { NextResponse } from "next/server";

const WP_API = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

export const revalidate = 3600; // cache for 1 hour

export async function GET() {
  const res = await fetch(`${WP_API}/wp-json/culture/v1/mobile/points-config`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return NextResponse.json({ error: "Failed to load config" }, { status: 502 });
  const data = await res.json();
  return NextResponse.json(data);
}
