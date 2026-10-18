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
  const since = req.nextUrl.searchParams.get("since") ?? "0";
  const res = await fetch(
    `${WP_URL}/wp-json/culture/v1/cluster/${id}/chatter?since=${since}&user_id=${session.user.wpUserId ?? ""}`,
    { headers: { Authorization: `Bearer ${API_SECRET}` }, cache: "no-store" }
  );

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const wpUserId = session.user.wpUserId ? Number(session.user.wpUserId) : 0;

  const res = await fetch(
    `${WP_URL}/wp-json/culture/v1/cluster/${id}/chatter`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...body, user_id: wpUserId }),
      cache: "no-store",
    }
  );

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
