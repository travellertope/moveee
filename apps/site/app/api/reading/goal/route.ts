import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

// Reading goal — Phase 2, see docs/reading-tracker-plan.md §1.2/§3.3.
// user_id is always resolved server-side from the session, never trusted
// from the client body, same as the Phase 1 shelf routes.

export async function GET(req: NextRequest) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year") ?? "";

  const url = `${WP_URL}/wp-json/culture/v1/reading/goal?user_id=${session.user.id}${year ? `&year=${year}` : ""}`;
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
  const res = await fetch(`${WP_URL}/wp-json/culture/v1/reading/goal`, {
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
