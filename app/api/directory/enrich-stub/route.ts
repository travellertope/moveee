/**
 * POST /api/directory/enrich-stub
 *
 * Called fire-and-forget after a user creates an inline directory stub from
 * the post composer. Uses Gemini to generate content, excerpt, infobox, and
 * an image for the stub, then saves them to the existing WP post.
 *
 * Auth: requires Authorization: Bearer {CULTURE_API_SECRET} header.
 * This endpoint is internal-only — never called directly from the browser.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { generateDirectoryStub, generateDirectoryImage } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 120;

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const WP_API_SECRET = process.env.CULTURE_API_SECRET ?? "";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any);
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured." }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const { id, title, entry_type } = body as { id?: number; title?: string; entry_type?: string };

  if (!id || !title) {
    return NextResponse.json({ error: "id and title are required." }, { status: 400 });
  }

  try {
    const stub = await generateDirectoryStub(title);

    // Update the stub with AI-generated content
    const enrichRes = await fetch(`${WP_URL}/wp-json/culture/v1/directory/${id}/enrich`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WP_API_SECRET}`,
      },
      body: JSON.stringify({
        content:    stub.content,
        excerpt:    stub.excerpt,
        entry_type: stub.entryType || entry_type,
        interests:  stub.interests,
        infobox:    stub.infobox ?? {},
      }),
      cache: "no-store",
    });

    if (!enrichRes.ok) {
      const err = await enrichRes.json().catch(() => ({}));
      return NextResponse.json({ error: (err as any).message ?? "Enrich failed." }, { status: 500 });
    }

    // Generate and attach image (best-effort — never blocks the response)
    try {
      const image = await generateDirectoryImage(stub.title || title, stub.entryType, stub.excerpt);
      const filename = `${(stub.title || title).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}.jpg`;
      await fetch(`${WP_URL}/wp-json/culture/v1/directory/attach-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${WP_API_SECRET}`,
        },
        body: JSON.stringify({
          post_id:           id,
          image_base64:      image.data,
          filename,
          image_title:       image.title,
          image_description: image.description,
          image_alt:         image.altText,
        }),
        cache: "no-store",
      });
    } catch {
      // Image failure is non-fatal
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Enrichment failed." }, { status: 500 });
  }
}
