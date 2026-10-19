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

  const { postId } = await req.json().catch(() => ({})) as { postId?: number };
  if (!postId) {
    return NextResponse.json({ error: "Missing postId." }, { status: 400 });
  }

  const user = session.user as any;
  const userId = Number(user?.id ?? user?.databaseId ?? 0);

  // Fetch the post to verify ownership before deleting
  const check = await fetch(`${BASE}/community-posts/${postId}?_fields=id,author,status,meta`, {
    headers: { Authorization: `Basic ${AUTH}` },
    cache: "no-store",
  });

  if (!check.ok) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  const post = await check.json();

  // Allow: the post's WP author, the community_author_id meta (community posts are
  // created by a service account, so post.author is the API user, not the member),
  // or an admin.
  const communityAuthorId = Number(post.meta?.community_author_id ?? 0);
  const isAuthor = post.author === userId || (communityAuthorId > 0 && communityAuthorId === userId);
  const isAdmin = user?.isAdmin === true || user?.role === "administrator";

  if (!isAuthor && !isAdmin) {
    return NextResponse.json({ error: "You can only delete your own posts." }, { status: 403 });
  }

  // Trash the post (WP soft-delete)
  const del = await fetch(`${BASE}/community-posts/${postId}`, {
    method: "DELETE",
    headers: { Authorization: `Basic ${AUTH}` },
    cache: "no-store",
  });

  if (!del.ok) {
    const err = await del.json().catch(() => ({}));
    return NextResponse.json({ error: (err as any).message ?? "Delete failed." }, { status: del.status });
  }

  revalidatePath("/feed");
  revalidatePath("/");

  return NextResponse.json({ success: true });
}
