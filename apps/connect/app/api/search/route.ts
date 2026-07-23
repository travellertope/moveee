import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const SITE_URL = "https://themoveee.com";

// Maps the search modal's Content Type chips onto WordPress's native
// wp/v2/search "subtype" param — a real, working cross-post-type search
// WP core already exposes (confirmed to cover culture_post, pulse_story,
// post, culture_event, culture_directory, and culture_quote). "All" omits
// the subtype filter entirely.
const CONTENT_TYPE_SUBTYPE: Record<string, string> = {
  pulse: "culture_post",
  news: "pulse_story",
  editorial: "post",
  event: "culture_event",
  directory: "culture_directory",
  quote: "culture_quote",
};

/** Builds the app-internal link for a result, mirroring the href shapes in
 * packages/shared/lib/unified-feed.ts — wp/v2/search only gives us a raw WP
 * permalink (cms.themoveee.com/...), which isn't a real user-facing route
 * in this headless setup, so we derive our own from subtype + slug. */
function toHref(subtype: string, id: number, slug: string): string {
  switch (subtype) {
    case "culture_post":      return `/community/${slug}`;
    case "pulse_story":       return `/pulse/${slug}`;
    case "post":               return `${SITE_URL}/magazine/${slug}`;
    case "culture_event":      return `/events/${slug}`;
    case "culture_directory":  return `/directory/${slug}`;
    case "culture_quote":      return `/quotes/${id}-${slug}`;
    default:                   return "#";
  }
}

function slugFromUrl(url: string): string {
  const path = url.replace(/^https?:\/\/[^/]+/, "").replace(/\/$/, "");
  const segments = path.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? "";
}

function decodeEntities(str: string): string {
  return str
    .replace(/&#8217;/g, "’")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#8211;/g, "–")
    .replace(/&#038;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&hellip;/g, "…");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const type = (searchParams.get("type") ?? "").toLowerCase();
  const category = searchParams.get("category")?.trim() ?? "";

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  // WP's native search has no taxonomy-aware filtering across mixed post
  // types, so a selected Category is folded into the query as an extra
  // term rather than a real facet — an approximation, not a true filter.
  const search = category && category.toLowerCase() !== "all" ? `${q} ${category}` : q;

  const params = new URLSearchParams({ search, per_page: "20" });
  const subtype = CONTENT_TYPE_SUBTYPE[type];
  if (subtype) params.set("subtype", subtype);

  try {
    const res = await fetch(`${WP_URL}/wp-json/wp/v2/search?${params.toString()}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return NextResponse.json({ results: [] }, { status: res.status });

    const data = await res.json();
    const results = Array.isArray(data)
      ? data.map((r: any) => {
          const slug = slugFromUrl(String(r.url ?? ""));
          return {
            id: r.id,
            title: decodeEntities(String(r.title ?? "")),
            subtype: r.subtype as string,
            href: toHref(r.subtype, r.id, slug),
          };
        })
      : [];

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
