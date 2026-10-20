import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const BASE = `${WP_URL}/wp-json/wp/v2`;
const AUTH = Buffer.from(
  `${process.env.WP_USERNAME ?? ""}:${process.env.WP_APP_PASSWORD ?? ""}`
).toString("base64");

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const user = session.user as any;
  const tier = user?.tier ?? "citizen";

  if (tier !== "patron" && tier !== "lit" && user?.isAdmin !== true) {
    return NextResponse.json({ error: "Editing posts requires Moveee Pro." }, { status: 403 });
  }

  const { postId, text, tag } = await req.json().catch(() => ({})) as {
    postId?: number;
    text?: string;
    tag?: string;
  };

  if (!postId || !text?.trim()) {
    return NextResponse.json({ error: "Missing postId or text." }, { status: 400 });
  }

  const userId = Number(user?.id ?? user?.databaseId ?? 0);

  // Verify ownership
  const check = await fetch(`${BASE}/community-posts/${postId}?_fields=id,author,meta`, {
    headers: { Authorization: `Basic ${AUTH}` },
    cache: "no-store",
  });

  if (!check.ok) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  const post = await check.json();
  const communityAuthorId = Number(post.meta?.community_author_id ?? 0);
  const isAuthor = post.author === userId || (communityAuthorId > 0 && communityAuthorId === userId);
  const isAdmin = user?.isAdmin === true || user?.role === "administrator";

  if (!isAuthor && !isAdmin) {
    return NextResponse.json({ error: "You can only edit your own posts." }, { status: 403 });
  }

  const body: Record<string, any> = {
    content: text.trim(),
  };
  if (tag) {
    body.meta = { community_tag: tag };
  }

  const res = await fetch(`${BASE}/community-posts/${postId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${AUTH}` },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: (err as any).message ?? "Edit failed." }, { status: res.status });
  }

  revalidatePath("/feed");
  revalidatePath(`/community`);

  return NextResponse.json({ success: true });
}
