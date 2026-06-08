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
  const {
    text, imageUrl, tag, region, authorTier, authorAvatar, linkUrl, ogTitle, ogDescription, ogImage,
    template_type, linked_directory_id, star_rating, location_name, location_lat, location_lng,
    poll_options, poll_expires_at, itinerary_stops, gallery_images, video_url,
    food_dish_name, food_rating_taste, food_rating_value, food_rating_vibe,
  } = body as {
    text?: string;
    imageUrl?: string;
    tag?: string;
    region?: string;
    authorTier?: string;
    authorAvatar?: string;
    linkUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    template_type?: string;
    linked_directory_id?: number;
    star_rating?: number;
    location_name?: string;
    location_lat?: number;
    location_lng?: number;
    poll_options?: { text: string }[];
    poll_expires_at?: string;
    itinerary_stops?: { name: string; lat: number; lng: number; note: string; image_url: string }[];
    gallery_images?: string[];
    video_url?: string;
    food_dish_name?: string;
    food_rating_taste?: number;
    food_rating_value?: number;
    food_rating_vibe?: number;
  };

  const ALLOWED_TEMPLATES = ["post", "hidden-gem", "cultural-take", "food-review", "creative-showcase", "poll", "itinerary"];
  const templateType = ALLOWED_TEMPLATES.includes(template_type ?? "") ? template_type! : "post";

  const content = (text ?? "").trim();
  if (!content || content.length < 3) {
    return NextResponse.json({ error: "Post must be at least 3 characters." }, { status: 400 });
  }

  const MAX_CHARS: Record<string, number> = {
    post: 280 * 5,
    "hidden-gem": 500,
    "cultural-take": 1000,
    "food-review": 500,
    "creative-showcase": 500,
    poll: 280,
    itinerary: 300,
  };
  const maxChars = MAX_CHARS[templateType] ?? 3000;
  if (content.length > maxChars) {
    return NextResponse.json({ error: `Post must be ${maxChars} characters or fewer.` }, { status: 400 });
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
        community_author_name:   authorName,
        community_author_id:     authorId,
        community_author_avatar: authorAvatar?.trim() || "",
        community_image_url:     imageUrl?.trim() || "",
        community_tag:          validTag ?? "",
        community_region:       region?.trim() || "",
        community_author_tier:  (authorTier?.trim() || sessionTier) || "",
        community_link_url:     linkUrl?.trim() || "",
        community_og_title:     ogTitle?.trim() || "",
        community_og_description: ogDescription?.trim() || "",
        community_og_image:     ogImage?.trim() || "",
        _template_type:         templateType,
        _location_name:         location_name?.trim() || "",
        ...(linked_directory_id != null               && { _linked_directory_id: linked_directory_id }),
        _poll_options:          poll_options ? JSON.stringify(poll_options.map(o => ({ text: o.text, votes: 0 }))) : "",
        _poll_expires_at:       poll_expires_at || "",
        _poll_voters:           poll_options ? "[]" : "",
        _itinerary_stops:       itinerary_stops ? JSON.stringify(itinerary_stops) : "",
        _gallery_images:        gallery_images ? JSON.stringify(gallery_images) : "",
        _video_url:             video_url?.trim() || "",
        _food_dish_name:        food_dish_name?.trim() || "",
        ...(star_rating != null && star_rating !== 0  && { _star_rating: star_rating }),
        ...(location_lat != null                      && { _location_lat: location_lat }),
        ...(location_lng != null                      && { _location_lng: location_lng }),
        ...(food_rating_taste != null                 && { _food_rating_taste: food_rating_taste }),
        ...(food_rating_value != null                 && { _food_rating_value: food_rating_value }),
        ...(food_rating_vibe != null                  && { _food_rating_vibe: food_rating_vibe }),
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
