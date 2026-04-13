import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

function wpAuthHeaders() {
  const secret = process.env.CULTURE_API_SECRET ?? "";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${secret}`,
  };
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be signed in to submit a directory entry." },
      { status: 401 }
    );
  }

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { title, excerpt, content, entryType, interests, aiGenerated, improvingSlug } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "title is required." }, { status: 400 });
  }
  if (!excerpt?.trim()) {
    return NextResponse.json({ error: "excerpt is required." }, { status: 400 });
  }
  if (!content?.trim()) {
    return NextResponse.json({ error: "content is required." }, { status: 400 });
  }

  const u = session.user as any;

  // Directory submissions are a Patron-tier privilege.
  if (u.tier !== "patron") {
    return NextResponse.json(
      {
        error:
          "Patron membership required to submit directory entries. Upgrade your membership to contribute.",
      },
      { status: 403 }
    );
  }

  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/directory/submit`, {
      method: "POST",
      headers: wpAuthHeaders(),
      body: JSON.stringify({
        user_id: Number(u.id),
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        entry_type: entryType ?? "concept",
        interests: Array.isArray(interests) ? interests : [],
        ai_generated: aiGenerated === true,
        improving_slug: improvingSlug ?? "",
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.message ?? "Submission failed. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(
      { error: "Service unavailable. Please try again later." },
      { status: 503 }
    );
  }
}
