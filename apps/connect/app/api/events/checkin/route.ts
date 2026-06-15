import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_KEY = process.env.CULTURE_API_SECRET ?? "";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { event_id, token } = await req.json();
  if (!event_id || !token) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const res = await fetch(`${WP_URL}/wp-json/culture/v1/events/self-checkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    body: JSON.stringify({ event_id, token, user_id: session.user.id }),
    next: { revalidate: 0 },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.ok ? 200 : res.status });
}
