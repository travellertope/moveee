import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const SITE_URL = "https://themoveee.com";
const AUTH = Buffer.from(
  `${process.env.WP_USERNAME ?? ""}:${process.env.WP_APP_PASSWORD ?? ""}`
).toString("base64");

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
  // Event-only facets (only ever sent when type=event) — same approximation
  // as category below, folded into the query text rather than a true facet,
  // since wp/v2/search has no structured filtering for any of these.
  const city = searchParams.get("city")?.trim() ?? "";
  const price = searchParams.get("price")?.trim() ?? "";
  const format = searchParams.get("format")?.trim() ?? "";

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  // WP's native search has no taxonomy-aware filtering across mixed post
  // types, so a selected Category/City/Price/Format is folded into the
  // query as extra terms rather than a real facet — an approximation, not
  // a true filter.
  const extraTerms = [category, city, price, format]
    .filter((t) => t && t.toLowerCase() !== "all")
    .join(" ");
  const search = extraTerms ? `${q} ${extraTerms}` : q;

  // Basic auth lets WP return protected/private content and ensures
  // culture_post CPT results aren't filtered by the anonymous-user caps.
  const authHeaders = { Authorization: `Basic ${AUTH}` };

  const params = new URLSearchParams({ search, per_page: "20" });
  const subtype = CONTENT_TYPE_SUBTYPE[type];
  if (subtype) params.set("subtype", subtype);

  // For community posts (any "all" or "pulse" search), run a second direct
  // community-posts query in parallel. wp/v2/search searches post_title and
  // post_content; the direct endpoint also picks up posts the WP search
  // index may have missed, and with the plugin's posts_search filter it
  // additionally matches community_author_username / community_author_name.
  const runCommunitySearch = !type || type === "all" || type === "pulse";

  try {
    const fetches: Promise<Response>[] = [
      fetch(`${WP_URL}/wp-json/wp/v2/search?${params.toString()}`, {
        headers: authHeaders,
        next: { revalidate: 30 },
      }),
    ];

    if (runCommunitySearch) {
      const cpParams = new URLSearchParams({
        search: q,
        per_page: "10",
        _fields: "id,slug,title",
        status: "publish",
      });
      fetches.push(
        fetch(`${WP_URL}/wp-json/wp/v2/community-posts?${cpParams.toString()}`, {
          headers: authHeaders,
          next: { revalidate: 30 },
        })
      );
    }

    const responses = await Promise.allSettled(fetches);
    const seen = new Set<number>();
    const results: { id: number; title: string; subtype: string; href: string }[] = [];

    // wp/v2/search results
    const wpRes = responses[0];
    if (wpRes.status === "fulfilled" && wpRes.value.ok) {
      const data: unknown = await wpRes.value.json().catch(() => []);
      if (Array.isArray(data)) {
        for (const r of data as any[]) {
          const id = Number(r.id);
          if (seen.has(id)) continue;
          seen.add(id);
          const slug = slugFromUrl(String(r.url ?? ""));
          results.push({
            id,
            title: decodeEntities(String(r.title ?? "")),
            subtype: r.subtype as string,
            href: toHref(r.subtype, id, slug),
          });
        }
      }
    }

    // Direct community-posts search results (deduplicated against above)
    if (runCommunitySearch && responses[1]?.status === "fulfilled") {
      const cpRes = (responses[1] as PromiseFulfilledResult<Response>).value;
      if (cpRes.ok) {
        const cpData: unknown = await cpRes.json().catch(() => []);
        if (Array.isArray(cpData)) {
          for (const r of cpData as any[]) {
            const id = Number(r.id);
            if (seen.has(id)) continue;
            seen.add(id);
            results.push({
              id,
              title: decodeEntities(String(r.title?.rendered ?? r.title ?? "")),
              subtype: "culture_post",
              href: `/community/${r.slug}`,
            });
          }
        }
      }
    }

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
