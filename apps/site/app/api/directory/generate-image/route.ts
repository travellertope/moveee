/**
 * POST /api/directory/generate-image
 *
 * Generates an AI illustration for an existing Culture Directory entry and
 * attaches it as the post's featured image via WP REST.
 *
 * Called by: WP Admin → Culture Content → Directory Tools → "Generate Image"
 * (class-culture-directory-tools.php ajax_generate_image() AJAX handler).
 *
 * Payload: { postId: number, title: string, entryType: string, excerpt: string }
 * Auth: requires Authorization: Bearer {CRON_SECRET} header.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateDirectoryImage } from "@/lib/gemini";
import { uploadToR2 } from "@/lib/r2";

export const runtime = "nodejs";
export const maxDuration = 120;

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET ?? "";
  return !!cronSecret && req.headers.get("Authorization") === `Bearer ${cronSecret}`;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { postId?: number; title?: string; entryType?: string; excerpt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { postId, title, entryType, excerpt } = body;

  if (!postId || !title) {
    return NextResponse.json({ error: "postId and title are required" }, { status: 400 });
  }

  const image = await generateDirectoryImage(
    title,
    entryType ?? "entry",
    excerpt ?? ""
  );

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60);
  const key = `directory/${slug}-${postId}.jpg`;
  const imageBuffer = Buffer.from(image.data, "base64");
  const imageUrl = await uploadToR2(key, imageBuffer, "image/jpeg");

  const secret = process.env.CRON_SECRET ?? "";
  const attachRes = await fetch(`${WP_URL}/wp-json/culture/v1/directory/attach-image`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      post_id: postId,
      image_url: imageUrl,
      image_title: image.title,
      image_description: image.description,
      image_alt: image.altText,
    }),
    cache: "no-store",
  });

  if (!attachRes.ok) {
    const errText = await attachRes.text().catch(() => "");
    return NextResponse.json(
      { error: `Image uploaded to R2 but failed to attach to post: ${errText}` },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true, imageUrl, postId });
}
