/**
 * POST /api/community/react
 * GET  /api/community/react?postId=123
 *
 * Toggles/switches an emoji reaction (love/fire/clap) on a community post,
 * Pulse story, or quote. Proxies to the PHP-mirrored `/culture/v1/community/react`
 * endpoint (same per-user/per-post/per-type semantics as mobile's
 * `/mobile/community/react`) rather than patching WP REST meta directly —
 * the server is the single source of truth for "did this user react, and
 * with what emoji", not localStorage.
 *
 * POST body: { postId: string | number, type: "love" | "fire" | "clap" }
 * POST response: { liked: boolean, reactionType: string | null, count: number,
 *                   reactions: { love: number, fire: number, clap: number } }
 * GET response: { userReaction: string | null }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const WP_URL      = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET  = process.env.CULTURE_API_SECRET;

const VALID_TYPES = ["love", "fire", "clap"] as const;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ userReaction: null });
  }

  const postId = req.nextUrl.searchParams.get("postId");
  if (!postId) {
    return NextResponse.json({ error: "Missing postId." }, { status: 400 });
  }

  const userId = (session.user as any).id ?? "";

  const res = await fetch(
    `${WP_URL}/wp-json/culture/v1/user/reaction?user_id=${encodeURIComponent(userId)}&post_id=${encodeURIComponent(postId)}`,
    {
      headers: { Authorization: `Bearer ${API_SECRET}` },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    return NextResponse.json({ userReaction: null });
  }

  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to react." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { postId, type } = body as { postId?: string | number; type?: string };

  if (!postId || !(VALID_TYPES as readonly string[]).includes(type ?? "")) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const userId = (session.user as any).id ?? "";

  const res = await fetch(`${WP_URL}/wp-json/culture/v1/community/react`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_SECRET}`,
    },
    body: JSON.stringify({ user_id: userId, post_id: postId, type }),
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { error: data?.message ?? "Failed to update reaction." },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
