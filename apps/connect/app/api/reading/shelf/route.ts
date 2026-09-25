import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

// Reading Tracker shelves — see docs/reading-tracker-plan.md (Phase 1).
// user_id is always resolved server-side from the session, never trusted
// from the client body, per the plan's own privacy ground rule (§7).

export async function GET(req: NextRequest) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "";
  const page = searchParams.get("page") ?? "1";
  const perPage = searchParams.get("per_page") ?? "20";

  const url = `${WP_URL}/wp-json/culture/v1/reading/shelf?user_id=${session.user.id}&status=${encodeURIComponent(status)}&page=${page}&per_page=${perPage}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${API_SECRET}` },
    cache: "no-store",
  }).catch(() => null);

  if (!res) return NextResponse.json({ error: "Could not reach the server." }, { status: 502 });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const res = await fetch(`${WP_URL}/wp-json/culture/v1/reading/shelf`, {
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

export async function DELETE(req: NextRequest) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const directoryId = searchParams.get("directory_id") ?? "";

  const url = `${WP_URL}/wp-json/culture/v1/reading/shelf?user_id=${session.user.id}&directory_id=${directoryId}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${API_SECRET}` },
  }).catch(() => null);

  if (!res) return NextResponse.json({ error: "Could not reach the server." }, { status: 502 });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
