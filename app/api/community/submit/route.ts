import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkPostSpam, checkBlocklist, getReviewDays } from "@/lib/spam-protection";

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
  const { text, imageUrl, tag, region, authorTier, linkUrl, ogTitle, ogDescription, ogImage } = body as {
    text?: string;
    imageUrl?: string;
    tag?: string;
    region?: string;
    authorTier?: string;
    linkUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  };

  const content = (text ?? "").trim();
  if (!content || content.length < 3) {
    return NextResponse.json({ error: "Post must be at least 3 characters." }, { status: 400 });
  }
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  if (wordCount > 600) {
    return NextResponse.json({ error: "Post must be 600 words or fewer." }, { status: 400 });
  }

  const user = session.user as any;
  const userId: string = String(user?.id ?? user?.databaseId ?? "");
  const sessionTier: string = user?.tier ?? "";

  const spamCheck = checkPostSpam(userId, content, sessionTier);
  if (!spamCheck.allowed) {
    return NextResponse.json({ error: spamCheck.reason }, { status: spamCheck.status });
  }

  // Both blocklist and review-days come from the same cached WP fetch — no extra round-trip.
  const [blocklistCheck, reviewDays] = await Promise.all([
    checkBlocklist(content),
    getReviewDays(),
  ]);
  if (!blocklistCheck.allowed) {
    return NextResponse.json({ error: blocklistCheck.reason }, { status: blocklistCheck.status });
  }

  // New-member moderation: accounts newer than the admin-configured review period go to pending.
  const REVIEW_DAYS_S = reviewDays * 24 * 60 * 60;
  const registeredAt: number = user?.registeredAt ?? 0;
  const isNewAccount = REVIEW_DAYS_S > 0 && registeredAt > 0 && (Date.now() / 1000 - registeredAt) < REVIEW_DAYS_S;
  const postStatus = isNewAccount ? "pending" : "publish";

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
      status: postStatus,
      comment_status: "open",
      meta: {
        community_author_name:  authorName,
        community_author_id:    authorId,
        community_image_url:    imageUrl?.trim() || "",
        community_tag:          validTag ?? "",
        community_region:       region?.trim() || "",
        community_author_tier:  (authorTier?.trim() || sessionTier) || "",
        community_link_url:     linkUrl?.trim() || "",
        community_og_title:     ogTitle?.trim() || "",
        community_og_description: ogDescription?.trim() || "",
        community_og_image:     ogImage?.trim() || "",
      },
    }),
    cache: "no-store",
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    return NextResponse.json({ error: (err as any).message || `HTTP ${createRes.status}` }, { status: 500 });
  }

  const post = await createRes.json();
  return NextResponse.json({
    success: true,
    id: post.id,
    slug: post.slug,
    pending: postStatus === "pending",
    message: postStatus === "pending"
      ? "Your post is under review and will appear shortly."
      : undefined,
  });
}
