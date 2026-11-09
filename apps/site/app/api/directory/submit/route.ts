import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions as any)) as any;
  const userId = session?.user?.id ? Number(session.user.id) : null;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    title,
    excerpt,
    content,
    entryType,
    aiGenerated,
    improvingSlug,
    coverUrl,
    externalId,
    infobox,
    interests,
  } = body;

  if (!title?.trim() || !excerpt?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "title, excerpt, and content are required." }, { status: 400 });
  }

  // Submit the entry to WordPress
  const submitPayload: Record<string, any> = {
    user_id: userId,
    title: title.trim(),
    excerpt: excerpt.trim(),
    content: content.trim(),
    entry_type: entryType ?? "concept",
    ai_generated: aiGenerated !== false,
  };
  if (improvingSlug) submitPayload.improving_slug = improvingSlug;
  if (infobox && typeof infobox === "object") submitPayload.infobox = infobox;
  if (Array.isArray(interests) && interests.length) submitPayload.interests = interests;

  const submitRes = await fetch(`${WP_URL}/wp-json/culture/v1/directory/submit`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(submitPayload),
  }).catch(() => null);

  if (!submitRes || !submitRes.ok) {
    const errBody = await submitRes?.json().catch(() => ({}));
    const status = !submitRes ? 502 : submitRes.status === 401 || submitRes.status === 403 ? 502 : submitRes.status;
    return NextResponse.json(
      { error: errBody?.message ?? "Could not submit entry. Please try again." },
      { status }
    );
  }

  const submitData = await submitRes.json();
  const postId: number = submitData.post_id;

  // If a cover image URL was provided, attach it as the featured image
  if (postId && coverUrl && typeof coverUrl === "string") {
    const imageTitle = title.trim();
    const imagePayload: Record<string, any> = {
      post_id: postId,
      image_url: coverUrl,
      image_title: imageTitle,
      image_alt: imageTitle,
    };
    if (externalId) imagePayload.external_id = externalId;

    // Fire-and-forget — don't block the response on image attachment
    fetch(`${WP_URL}/wp-json/culture/v1/directory/attach-image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(imagePayload),
    }).catch(() => {});
  }

  return NextResponse.json({
    success: true,
    post_id: postId,
    slug: submitData.slug,
    points_awarded: submitData.points_awarded ?? 25,
  });
}
