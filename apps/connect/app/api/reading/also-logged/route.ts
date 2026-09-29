import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

// "People who logged this also logged…" — fully public co-occurrence data,
// no session needed.

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const directoryId = searchParams.get("directory_id") ?? "";
  if (!directoryId) {
    return NextResponse.json({ error: "directory_id is required." }, { status: 400 });
  }

  const res = await fetch(
    `${WP_URL}/wp-json/culture/v1/reading/also-logged?directory_id=${directoryId}`,
    { headers: { Authorization: `Bearer ${API_SECRET}` }, cache: "no-store" }
  ).catch(() => null);

  if (!res) return NextResponse.json({ error: "Could not reach the server." }, { status: 502 });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
