import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_API_URL = process.env.CULTURE_API_URL;
const API_SECRET = process.env.CULTURE_API_SECRET;

export async function GET(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get("post_id");
  if (!postId) return NextResponse.json({ error: "post_id required" }, { status: 400 });

  const res = await fetch(`${WP_API_URL}/comments?post_id=${postId}`, {
    headers: { "X-Culture-Secret": API_SECRET! },
    next: { revalidate: 60 },
  });
  if (!res.ok) return NextResponse.json({ comments: [] });
  return NextResponse.json(await res.json());
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await req.json();
  const { post_id, content } = body;
  if (!post_id || !content?.trim()) {
    return NextResponse.json({ error: "post_id and content are required" }, { status: 400 });
  }

  const res = await fetch(`${WP_API_URL}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Culture-Secret": API_SECRET!,
    },
    body: JSON.stringify({ post_id, content: content.trim(), user_id: session.user.id }),
  });

  const data = await res.json();
  if (!res.ok) return NextResponse.json({ error: data.message ?? "Failed to post comment" }, { status: res.status });
  return NextResponse.json(data);
}
