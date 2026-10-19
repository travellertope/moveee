import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const postId = req.nextUrl.searchParams.get("post_id");
  if (!postId) {
    return NextResponse.json({ error: "Missing post_id." }, { status: 400 });
  }

  const userId = (session.user as any).id ?? "";
  const API_SECRET = process.env.CULTURE_API_SECRET;

  const res = await fetch(
    `${WP_URL}/wp-json/culture/v1/community/event/rsvp-status?post_id=${encodeURIComponent(postId)}&user_id=${encodeURIComponent(userId)}`,
    {
      headers: { "Authorization": `Bearer ${API_SECRET}` },
      cache: "no-store",
    }
  );

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: data?.message ?? "RSVP status failed." }, { status: res.status });
  }

  return NextResponse.json(data);
}
