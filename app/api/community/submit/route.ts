import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { parseHashtags } from "@/lib/hashtags";

export const runtime = "nodejs";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const BASE = `${WP_URL}/wp-json/wp/v2`;
const AUTH = Buffer.from(
  `${process.env.WP_USERNAME ?? ""}:${process.env.WP_APP_PASSWORD ?? ""}`
).toString("base64");

const TAGS = ["Music", "Fashion", "Art", "Film", "Food", "Sport", "Travel", "Ideas", "Literature", "Design", "Tech"] as const;
type Tag = (typeof TAGS)[number];

async function resolveCategoryId(slug: string): Promise<number | null> {
  const findRes = await fetch(`${BASE}/categories?slug=${slug}`, {
    headers: { Authorization: `Basic ${AUTH}` },
    cache: "no-store",
  });
  const found: any[] = await findRes.json().catch(() => []);
  if (Array.isArray(found) && found.length > 0) return found[0].id;

  const createRes = await fetch(`${BASE}/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${AUTH}` },
    body: JSON.stringify({ name: "Community", slug }),
    cache: "no-store",
  });
  if (!createRes.ok) return null;
  const created = await createRes.json();
  return created.id ?? null;
}

async function resolveTagId(name: string): Promise<number | null> {
  const slug = name.toLowerCase();
  const findRes = await fetch(`${BASE}/tags?slug=${slug}`, {
    headers: { Authorization: `Basic ${AUTH}` },
    cache: "no-store",
  });
  const found: any[] = await findRes.json().catch(() => []);
  if (Array.isArray(found) && found.length > 0) return found[0].id;

  const createRes = await fetch(`${BASE}/tags`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${AUTH}` },
    body: JSON.stringify({ name, slug }),
    cache: "no-store",
  });
  if (!createRes.ok) return null;
  const created = await createRes.json();
  return created.id ?? null;
}

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

  const validTag = tag && (TAGS as readonly string[]).includes(tag) ? tag : null;

  const user = session.user as any;
  const authorName: string =
    user?.name ?? user?.displayName ?? user?.username ?? "Community Member";
  const authorId: string = String(user?.id ?? user?.databaseId ?? "");
  const sessionTier: string = user?.tier ?? "";

  // Extract #hashtags from the post text.
  const hashtags = parseHashtags(content);

  // Resolve the community category + structured tag + all inline hashtags in parallel.
  const [categoryId, ...tagIds] = await Promise.all([
    resolveCategoryId("community"),
    validTag ? resolveTagId(validTag) : Promise.resolve(null),
    ...hashtags.map((ht) => resolveTagId(ht)),
  ]);

  const allTagIds = tagIds.filter((id): id is number => id !== null);

  const title = content.slice(0, 80) + (content.length > 80 ? "…" : "");
  const htmlContent = `<p>${content.replace(/\n/g, "</p><p>")}</p>`;

  const postBody: Record<string, any> = {
    title,
    content: htmlContent,
    status: "publish",
    comment_status: "open",
    // Proper meta fields — registered via Culture_Community::register_meta()
    // in culture-community/includes/core/class-culture-community.php.
    // Stored in wp_postmeta, fully backed up by UpdraftPlus.
    meta: {
      community_author_name: authorName,
      community_author_id:   authorId,
      community_image_url:   imageUrl?.trim() || "",
      community_tag:         validTag ?? "",
      community_region:      region?.trim() || "",
      community_author_tier: (authorTier?.trim() || sessionTier) || "",
    },
  };
  if (categoryId) postBody.categories = [categoryId];
  if (allTagIds.length) postBody.tags = allTagIds;

  const createRes = await fetch(`${BASE}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${AUTH}` },
    body: JSON.stringify(postBody),
    cache: "no-store",
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    const message = (err as any).message || `HTTP ${createRes.status}`;
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const post = await createRes.json();
  return NextResponse.json({ success: true, id: post.id, slug: post.slug });
}
