import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkPostSpam } from "@/lib/spam-protection";

export const runtime = "nodejs";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const BASE = `${WP_URL}/wp-json/wp/v2`;
const AUTH = Buffer.from(
  `${process.env.WP_USERNAME ?? ""}:${process.env.WP_APP_PASSWORD ?? ""}`
).toString("base64");

const TAGS = ["Music", "Fashion", "Art", "Film", "Food", "Sport", "Travel", "Ideas", "Literature", "Design", "Tech"] as const;
type Tag = (typeof TAGS)[number];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "You must be signed in to post." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { text, imageUrl, tag, region, authorTier } = body as {
    text?: string;
    imageUrl?: string;
    tag?: string;
    region?: string;
    authorTier?: string;
  };

  const content = (text ?? "").trim();
  if (!content || content.length < 3) {
    return NextResponse.json({ error: "Post must be at least 3 characters." }, { status: 400 });
  }
  if (content.length > 500) {
    return NextResponse.json({ error: "Post must be 500 characters or fewer." }, { status: 400 });
  }

  const user = session.user as any;
  const userId: string = String(user?.id ?? user?.databaseId ?? "");
  const sessionTier: string = user?.tier ?? "";

  const spamCheck = checkPostSpam(userId, content, sessionTier);
  if (!spamCheck.allowed) {
    return NextResponse.json({ error: spamCheck.reason }, { status: spamCheck.status });
  }

  const validTag = tag && (TAGS as readonly string[]).includes(tag) ? tag : null;
  const authorName: string = user?.name ?? user?.displayName ?? user?.username ?? "Community Member";
  const authorId: string = userId;

  const title = content.slice(0, 80) + (content.length > 80 ? "…" : "");
  const htmlContent = `<p>${content.replace(/\n/g, "</p><p>")}</p>`;

  const createRes = await fetch(`${BASE}/community-posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${AUTH}` },
    body: JSON.stringify({
      title,
      content: htmlContent,
      status: "publish",
      comment_status: "open",
      meta: {
        community_author_name: authorName,
        community_author_id:   authorId,
        community_image_url:   imageUrl?.trim() || "",
        community_tag:         validTag ?? "",
        community_region:      region?.trim() || "",
        community_author_tier: (authorTier?.trim() || sessionTier) || "",
      },
    }),
    cache: "no-store",
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    return NextResponse.json({ error: (err as any).message || `HTTP ${createRes.status}` }, { status: 500 });
  }

  const post = await createRes.json();
  return NextResponse.json({ success: true, id: post.id, slug: post.slug });
}
