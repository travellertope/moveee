import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const wpUserId = String(session.user.wpUserId ?? "0");
  const res = await fetch(
    `${WP_URL}/wp-json/culture/v1/cluster/${id}/agenda?user_id=${wpUserId}`,
    {
      headers: { Authorization: `Bearer ${API_SECRET}`, "X-WP-User-Id": wpUserId },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    return NextResponse.json({ gatherings: [] }, { status: 200 });
  }

  const data = await res.json().catch(() => ({ gatherings: [] }));
  return NextResponse.json(data, { status: 200 });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const res = await fetch(
    `${WP_URL}/wp-json/culture/v1/cluster/${id}/agenda`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_SECRET}`,
        "Content-Type": "application/json",
        "X-WP-User-Id": String(session.user.wpUserId ?? ""),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
  const data = await res.json().catch(() => ({ ok: true }));
  return NextResponse.json(data, { status: 200 });
}
