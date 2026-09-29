import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

// Saved lines — a short quote a member attaches to any culture_directory
// entry, independent of shelf status. GET is public (any visitor sees every
// saved line on an entry, same as book reviews) — user_id, when present, is
// only used so the response can flag the viewer's own lines as deletable.
// POST requires a session.

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const directoryId = searchParams.get("directory_id") ?? "";
  if (!directoryId) {
    return NextResponse.json({ error: "directory_id is required." }, { status: 400 });
  }

  const session = (await getServerSession(authOptions as any).catch(() => null)) as any;
  const userIdParam = session?.user?.id ? `&user_id=${session.user.id}` : "";

  const res = await fetch(
    `${WP_URL}/wp-json/culture/v1/reading/saved-lines?directory_id=${directoryId}${userIdParam}`,
    { headers: { Authorization: `Bearer ${API_SECRET}` }, cache: "no-store" }
  ).catch(() => null);

  if (!res) return NextResponse.json({ error: "Could not reach the server." }, { status: 502 });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const res = await fetch(`${WP_URL}/wp-json/culture/v1/reading/saved-lines`, {
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
