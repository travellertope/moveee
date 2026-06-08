import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { post_id, option_index } = body as { post_id?: number; option_index?: number };

  if (!post_id || option_index === undefined) {
    return NextResponse.json({ error: "Missing post_id or option_index." }, { status: 400 });
  }

  const user = session.user as any;
  const wpCookie = user.wpCookie ?? "";

  const res = await fetch(`${WP_URL}/wp-json/culture/v1/community/poll-vote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: wpCookie,
    },
    body: JSON.stringify({ post_id, option_index }),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { error: data?.message ?? "Vote failed." },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
