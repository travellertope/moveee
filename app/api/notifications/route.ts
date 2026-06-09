import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit  = searchParams.get("limit") ?? "30";
  const offset = searchParams.get("offset") ?? "0";

  const res = await fetch(
    `${WP_URL}/wp-json/culture/v1/notifications?user_id=${session.user.id}&limit=${limit}&offset=${offset}`,
    { headers: { Authorization: `Bearer ${API_SECRET}` }, cache: "no-store" }
  );
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const res = await fetch(`${WP_URL}/wp-json/culture/v1/notifications/read`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_SECRET}` },
    body: JSON.stringify({ user_id: session.user.id, notification_id: body.notification_id }),
    cache: "no-store",
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
