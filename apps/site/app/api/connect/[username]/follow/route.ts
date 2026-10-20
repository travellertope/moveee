import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

async function resolveUserId(username: string): Promise<number | null> {
  const res = await fetch(
    `${WP_URL}/wp-json/culture/v1/member/${encodeURIComponent(username)}`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  const profile = await res.json();
  return profile.id ?? null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { username } = await params;
  const targetId = await resolveUserId(username);
  if (!targetId) return NextResponse.json({ error: "Member not found." }, { status: 404 });

  const res = await fetch(
    `${WP_URL}/wp-json/culture/v1/follow/status?user_id=${session.user.id}&target_id=${targetId}`,
    { headers: { Authorization: `Bearer ${API_SECRET}` }, cache: "no-store" }
  );
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { username } = await params;
  const targetId = await resolveUserId(username);
  if (!targetId) return NextResponse.json({ error: "Member not found." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const action = body.action === "unfollow" ? "unfollow" : "follow";

  const res = await fetch(`${WP_URL}/wp-json/culture/v1/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_SECRET}` },
    body: JSON.stringify({
      user_id: session.user.id,
      target_id: targetId,
      notify_posts: !!body.notify_posts,
    }),
    cache: "no-store",
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { username } = await params;
  const targetId = await resolveUserId(username);
  if (!targetId) return NextResponse.json({ error: "Member not found." }, { status: 404 });

  const body = await req.json().catch(() => ({}));

  const res = await fetch(`${WP_URL}/wp-json/culture/v1/follow/notify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_SECRET}` },
    body: JSON.stringify({
      user_id: session.user.id,
      target_id: targetId,
      notify_posts: !!body.notify_posts,
    }),
    cache: "no-store",
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
