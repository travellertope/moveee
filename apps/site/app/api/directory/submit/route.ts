import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadToR2 } from "@/lib/r2";

export const runtime = "nodejs";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? "";

async function fetchAndUploadPlacesPhoto(
  photoRef: string,
  title: string
): Promise<string | null> {
  if (!GOOGLE_PLACES_API_KEY) return null;
  try {
    const params = new URLSearchParams({
      photoreference: photoRef,
      maxwidth: "640",
      key: GOOGLE_PLACES_API_KEY,
    });
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/photo?${params}`
    );
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60);
    return await uploadToR2(`directory/${slug}-${Date.now()}.jpg`, buffer, "image/jpeg");
  } catch {
    return null;
  }
}

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
    photoRef,
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

  // Attach cover image if available.
  // For place/food entries, photoRef (a Google Places photo_reference) is
  // uploaded to R2 first so the stored URL is permanent. For book/film/album
  // entries, coverUrl is already a stable CDN link (Google Books / iTunes)
  // that can be attached directly.
  const imageTitle = title.trim();
  const attachImage = async (imageUrl: string) => {
    const imagePayload: Record<string, any> = {
      post_id: postId,
      image_url: imageUrl,
      image_title: imageTitle,
      image_alt: imageTitle,
    };
    if (externalId) imagePayload.external_id = externalId;
    await fetch(`${WP_URL}/wp-json/culture/v1/directory/attach-image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(imagePayload),
    }).catch(() => {});
  };

  if (postId) {
    if (photoRef && typeof photoRef === "string") {
      // Upload Places photo to R2, then attach — do this async
      fetchAndUploadPlacesPhoto(photoRef, title.trim()).then((r2Url) => {
        if (r2Url) attachImage(r2Url);
        else if (coverUrl && typeof coverUrl === "string") attachImage(coverUrl);
      });
    } else if (coverUrl && typeof coverUrl === "string") {
      // Fire-and-forget for stable catalog URLs (books, films, albums)
      attachImage(coverUrl);
    }
  }

  return NextResponse.json({
    success: true,
    post_id: postId,
    slug: submitData.slug,
    points_awarded: submitData.points_awarded ?? 25,
  });
}
