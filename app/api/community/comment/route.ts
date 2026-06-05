import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkCommentSpam, checkBlocklist } from "@/lib/spam-protection";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const BASE = `${WP_URL}/wp-json/wp/v2`;
const AUTH = Buffer.from(
  `${process.env.WP_USERNAME ?? ""}:${process.env.WP_APP_PASSWORD ?? ""}`
).toString("base64");

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to comment." }, { status: 401 });
  }

  const { postId, content, parentId } = await req.json();
  if (!postId || !content?.trim()) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }

  const user = session.user as any;
  const userId = String(user?.id ?? user?.databaseId ?? "");
  const tier   = user?.tier ?? "";

  const spamCheck = checkCommentSpam(userId, content.trim(), tier);
  if (!spamCheck.allowed) {
    return NextResponse.json({ error: spamCheck.reason }, { status: spamCheck.status });
  }

  const blocklistCheck = await checkBlocklist(content.trim());
  if (!blocklistCheck.allowed) {
    return NextResponse.json({ error: blocklistCheck.reason }, { status: blocklistCheck.status });
  }

  const authorName  = user.name ?? user.displayName ?? "Community Member";
  const authorEmail = user.email ?? "noreply@themoveee.com";

  const body: Record<string, any> = {
    post: Number(postId),
    content: content.trim(),
    author_name: authorName,
    author_email: authorEmail,
    status: "approve",
  };
  if (parentId) body.parent = Number(parentId);

  const res = await fetch(`${BASE}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${AUTH}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: err.message ?? "Failed to post comment." }, { status: res.status });
  }

  const comment = await res.json();
  return NextResponse.json({ id: comment.id, author_name: comment.author_name, date: comment.date });
}
