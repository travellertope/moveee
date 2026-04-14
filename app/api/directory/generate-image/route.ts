import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateDirectoryImage } from "@/lib/gemini";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Must be signed in (patron check happens server-side; anyone previewing
  // their own entry can trigger this — WordPress post access is gated).
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Image generation not configured (GEMINI_API_KEY missing)." },
      { status: 503 }
    );
  }

  let body: { postId?: number; title?: string; entryType?: string; excerpt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { postId, title, entryType, excerpt } = body;
  if (!postId || !title) {
    return NextResponse.json(
      { error: "postId and title are required." },
      { status: 400 }
    );
  }

  // Generate the image
  const imageBase64 = await generateDirectoryImage(
    title,
    entryType ?? "entry",
    excerpt ?? ""
  );

  if (!imageBase64) {
    return NextResponse.json(
      { error: "Image generation failed or returned no result." },
      { status: 502 }
    );
  }

  // Attach it to the WordPress post via our plugin endpoint
  const secret = process.env.CULTURE_API_SECRET ?? "";
  const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}.jpg`;

  const attachRes = await fetch(
    `${WP_URL}/wp-json/culture/v1/directory/attach-image`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ post_id: postId, image_base64: imageBase64, filename }),
      cache: "no-store",
    }
  );

  if (!attachRes.ok) {
    const err = await attachRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: err.message ?? "Failed to attach image to WordPress post." },
      { status: 502 }
    );
  }

  const attachData = await attachRes.json();
  return NextResponse.json({
    success: true,
    attachmentId: attachData.attachment_id,
    url: attachData.url,
  });
}
