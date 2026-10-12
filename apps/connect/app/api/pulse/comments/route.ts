import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkCommentSpam, checkBlocklist } from "@/lib/spam-protection";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const BASE = `${WP_URL}/wp-json/wp/v2`;
const AUTH = Buffer.from(
  `${process.env.WP_USERNAME ?? ""}:${process.env.WP_APP_PASSWORD ?? ""}`
).toString("base64");

// GET /api/pulse/comments?postId=<id>
// Returns the approved comments for a post as a WpComment array.
export async function GET(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get("postId");
  if (!postId) {
    return NextResponse.json([], { status: 200 });
  }

  const res = await fetch(
    `${BASE}/comments?post=${encodeURIComponent(postId)}&status=approve&per_page=100&order=asc`,
    {
      headers: { Authorization: `Basic ${AUTH}` },
      cache: "no-store",
    }
  );

  if (!res.ok) return NextResponse.json([]);
  const comments = await res.json();
  return NextResponse.json(Array.isArray(comments) ? comments : []);
}

// POST /api/pulse/comments
// Body: { postId, authorName, authorEmail, content, parentId? }
// Returns: { comment: WpComment }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to comment." }, { status: 401 });
  }

  const { postId, authorName, authorEmail, content, parentId } = await req.json();
  if (!postId || !content?.trim()) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }

  const user = session.user as any;
  const userId = String(user?.id ?? user?.databaseId ?? "");
  const tier = user?.tier ?? "";

  const spamCheck = checkCommentSpam(userId, content.trim(), tier);
  if (!spamCheck.allowed) {
    return NextResponse.json({ error: spamCheck.reason }, { status: spamCheck.status });
  }

  const blocklistCheck = await checkBlocklist(content.trim());
  if (!blocklistCheck.allowed) {
    return NextResponse.json({ error: blocklistCheck.reason }, { status: blocklistCheck.status });
  }

  const resolvedName  = authorName ?? user.name ?? user.displayName ?? "Community Member";
  const resolvedEmail = authorEmail ?? user.email ?? "noreply@themoveee.com";

  const body: Record<string, any> = {
    post: Number(postId),
    content: content.trim(),
    author_name: resolvedName,
    author_email: resolvedEmail,
    status: "approve",
  };
  if (parentId) body.parent = Number(parentId);

  const res = await fetch(`${BASE}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${AUTH}` },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    // If comments are closed on this post, open them and retry once.
    if (err.code === "comment_closed" || (err.message ?? "").toLowerCase().includes("closed")) {
      // Try to identify the post type to use the right REST base
      for (const restBase of ["community-posts", "posts"]) {
        await fetch(`${BASE}/${restBase}/${Number(postId)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Basic ${AUTH}` },
          body: JSON.stringify({ comment_status: "open" }),
          cache: "no-store",
        }).catch(() => {});
      }

      const retry = await fetch(`${BASE}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Basic ${AUTH}` },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      if (retry.ok) {
        const comment = await retry.json();
        awardPoints(userId, postId);
        return NextResponse.json({ comment });
      }
    }
    return NextResponse.json(
      { error: err.message ?? "Failed to post comment." },
      { status: res.status }
    );
  }

  const comment = await res.json();
  awardPoints(userId, postId);
  return NextResponse.json({ comment });
}

function awardPoints(userId: string, postId: string | number) {
  const API_KEY = process.env.CULTURE_API_SECRET ?? "";
  if (!userId || !API_KEY) return;
  fetch(`${WP_URL}/wp-json/culture/v1/award-points`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    body: JSON.stringify({ user_id: userId, action: "community_comment", post_id: postId }),
  }).catch(() => {});
}
