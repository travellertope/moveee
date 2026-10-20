/**
 * POST /api/community/bookmark
 * Toggles a bookmark on a community post, pulse story, or quote.
 * Proxies to the PHP /culture/v1/content/bookmark endpoint.
 *
 * Body: { postId: string | number, contentType?: "article" | "quote" | "community" }
 * Response: { bookmarked: boolean }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const WP_URL     = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to bookmark." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { postId, contentType } = body as { postId?: string | number; contentType?: string };

  if (!postId) {
    return NextResponse.json({ error: "Missing postId." }, { status: 400 });
  }

  const userId = (session.user as any).id ?? "";

  const res = await fetch(`${WP_URL}/wp-json/culture/v1/content/bookmark`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_SECRET}`,
    },
    body: JSON.stringify({
      user_id:      userId,
      post_id:      postId,
      content_type: contentType ?? "",
    }),
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { error: data?.message ?? "Failed to bookmark." },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
