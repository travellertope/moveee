import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateDirectoryImage } from "@/lib/gemini";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Accept either a valid Next.js session (user-facing) or the CRON_SECRET
  // (server-to-server calls from the WordPress admin tools panel).
  const cronSecret = process.env.CRON_SECRET ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";
  const hasCronAuth = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!hasCronAuth) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
    }
  }

  if (!process.env.VERTEX_PROJECT || !process.env.VERTEX_CLIENT_EMAIL || !process.env.VERTEX_PRIVATE_KEY) {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Image generation not configured — set VERTEX_* credentials or GEMINI_API_KEY." },
        { status: 503 }
      );
    }
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

  let image: Awaited<ReturnType<typeof generateDirectoryImage>>;
  try {
    image = await generateDirectoryImage(
      title,
      entryType ?? "entry",
      excerpt ?? ""
    );
  } catch (err: any) {
    const msg: string = err?.message ?? "unknown error";
    const isBilling =
      msg.includes("limit: 0") ||
      msg.includes("RESOURCE_EXHAUSTED") ||
      msg.includes("BILLING_DISABLED");
    return NextResponse.json(
      {
        error: isBilling
          ? "Image generation requires paid API billing. Enable billing at console.cloud.google.com/billing/enable?project=next-161114 or uncheck 'Generate an AI image' in the seeder."
          : `Image generation failed: ${msg}`,
      },
      { status: isBilling ? 503 : 502 }
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
      body: JSON.stringify({
        post_id: postId,
        image_base64: image.data,
        filename,
        image_title: image.title,
        image_description: image.description,
        image_alt: image.altText,
      }),
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
