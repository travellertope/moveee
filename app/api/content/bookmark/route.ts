import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

function wpAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.CULTURE_API_SECRET ?? ""}`,
  };
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { postId?: number };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.postId) {
    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  }

  const u = session.user as any;

  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/content/bookmark`, {
      method: "POST",
      headers: wpAuthHeaders(),
      body: JSON.stringify({ user_id: Number(u.id), post_id: body.postId }),
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.message ?? "Failed" }, { status: 502 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
