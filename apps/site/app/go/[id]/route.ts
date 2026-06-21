import { NextRequest, NextResponse } from "next/server";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const postId = parseInt(id, 10);

  if (!postId || isNaN(postId)) {
    return NextResponse.redirect(new URL("/feed", _req.url));
  }

  try {
    // Record click and get destination URL in one call.
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/pulse-click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId }),
      cache: "no-store",
    });

    if (res.ok) {
      const { url } = await res.json();
      if (url) {
        return NextResponse.redirect(url, { status: 302 });
      }
    }

    // Fallback: fetch story directly to get external URL without incrementing.
    const storyRes = await fetch(
      `${WP_URL}/wp-json/wp/v2/pulse-stories/${postId}?_fields=meta`,
      { cache: "no-store" }
    );
    if (storyRes.ok) {
      const story = await storyRes.json();
      const url = story?.meta?.pulse_external_url;
      if (url) return NextResponse.redirect(url, { status: 302 });
    }
  } catch {
    // fall through
  }

  return NextResponse.redirect(new URL("/feed", _req.url));
}
