import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_API_URL = (process.env.NEXT_PUBLIC_WP_URL || "https://cms.themoveee.com") + "/wp-json/culture/v1";
const CULTURE_API_SECRET = process.env.CULTURE_API_SECRET;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const post_id = searchParams.get("post_id");

  if (!post_id) {
    return NextResponse.json({ error: "post_id is required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${WP_API_URL}/comments/paragraph?post_id=${post_id}`, {
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { post_id, paragraph_idx, content } = await request.json();

  if (!post_id || paragraph_idx === undefined || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const user = session.user as any;
    const res = await fetch(`${WP_API_URL}/comments/paragraph`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CULTURE_API_SECRET}`,
        "X-Culture-API-Secret": CULTURE_API_SECRET || "",
      },
      body: JSON.stringify({
        post_id,
        paragraph_idx,
        content,
        user_id: parseInt(user.id),
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to save comment");

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
