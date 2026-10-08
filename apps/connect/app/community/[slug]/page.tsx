import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCommunityPostBySlug, getAllCommunitySlugs, getPostComments } from "@/lib/community-wordpress";
import CommunityPostClient from "./CommunityPostClient";
import "@/app/pulse-layout.css";

// Fully dynamic, not ISR — every fetch this page depends on
// (getCommunityPostBySlug/getPostComments in community-wordpress.ts) uses
// cache: "no-store" so reactions/comments/poll votes are always fresh.
// `export const revalidate` previously coexisted with those no-store
// fetches, which Next.js treats as a genuine conflict ("Page changed from
// static to dynamic at runtime") and throws a hard 500 for instead of
// picking one — see https://nextjs.org/docs/messages/app-static-to-dynamic-error.
export const dynamic = "force-dynamic";
export const dynamicParams = true;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://themoveee.com";

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getCommunityPostBySlug(slug);
  if (!post) return { title: "Post not found" };

  const rawText = post.content.rendered.replace(/<[^>]+>/g, "").trim();
  const title   = rawText.slice(0, 80) + (rawText.length > 80 ? "…" : "");
  const description = rawText.slice(0, 155);
  const author  = post.meta.community_author_name ?? "Community Member";
  const tag     = post.meta.community_tag ?? "";
  const image   = post.meta.community_image_url || `${SITE_URL}/og-fallback.png`;
  const url     = `${SITE_URL}/community/${post.slug}`;
  return {
    title,
    description,
    authors: [{ name: author }],
    keywords: [tag].filter(Boolean),
    openGraph: {
      title, description, url, siteName: "Moveee",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.modified,
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    alternates: { canonical: url },
    robots: { index: true, follow: true },
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

export default async function CommunityPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post, session] = await Promise.all([
    getCommunityPostBySlug(slug),
    getServerSession(authOptions).catch(() => null),
  ]);
  if (!post) notFound();
  const comments = await getPostComments(post.id);
  const loggedIn = !!session?.user;

  const rawText  = post.content.rendered.replace(/<[^>]+>/g, "").trim();
  const author   = post.meta.community_author_name ?? "Community Member";
  const tag      = post.meta.community_tag ?? "";
  const image    = post.meta.community_image_url ?? null;
  const initials = author.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  const url      = `${SITE_URL}/community/${post.slug}`;

  // Template meta
  const m = post.meta;
  const templateType  = m._template_type || "post";
  const starRating    = m._star_rating ? Number(m._star_rating) : undefined;
  const locationName  = m._location_name || undefined;
  const pollOptions   = m._poll_options ? (typeof m._poll_options === "string" ? JSON.parse(m._poll_options) : m._poll_options) : undefined;
  const pollExpiresAt = m._poll_expires_at || undefined;
  const galleryImages = m._gallery_images ? (typeof m._gallery_images === "string" ? JSON.parse(m._gallery_images) : m._gallery_images) : undefined;
  const videoUrl      = m._video_url || undefined;
  const itineraryStops = m._itinerary_stops ? (typeof m._itinerary_stops === "string" ? JSON.parse(m._itinerary_stops) : m._itinerary_stops) : undefined;
  const foodDishName  = m._food_dish_name || undefined;
  const foodRatingTaste = m._food_rating_taste ? Number(m._food_rating_taste) : undefined;
  const foodRatingValue = m._food_rating_value ? Number(m._food_rating_value) : undefined;
  const foodRatingVibe  = m._food_rating_vibe  ? Number(m._food_rating_vibe)  : undefined;
  const sourceUrl    = m.community_link_url || undefined;
  const source       = sourceUrl ? (() => { try { return new URL(sourceUrl).hostname.replace(/^www\./, ""); } catch { return ""; } })() : undefined;
  const ogTitle      = m.community_og_title || undefined;
  const ogDescription = m.community_og_description || undefined;
  const ogImage      = m.community_og_image || undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SocialMediaPosting",
    url,
    headline: rawText.slice(0, 110),
    articleBody: rawText,
    datePublished: post.date,
    dateModified: post.modified,
    author: { "@type": "Person", name: author },
    publisher: {
      "@type": "Organization",
      name: "Moveee",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: "https://mltvzlykp9yb.i.optimole.com/cb:k_0z.862/w:920/h:144/q:mauto/f:best/https://cms.themoveee.com/wp-content/uploads/2024/04/logo-1-e1713978527703.png",
      },
    },
    ...(image ? { image: { "@type": "ImageObject", url: image } } : {}),
    keywords: [tag].filter(Boolean).join(", "),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div style={{ background: "#ffffff" }}>
        {/* Same 2-column track as /feed (.pulse-layout--feed: timeline +
            right rail, no separate content-type sidebar) — this page is an
            extension of the feed, not a distinct section with its own nav. */}
        <div className="pulse-layout pulse-layout--feed">

          {/* ── Main post ── */}
          <main className="pulse-timeline">
          <div className="pulse-timeline-inner">
            {/* Back link */}
            <div style={{ padding: "1rem 1rem 0", display: "flex", alignItems: "center" }}>
              <Link href="/feed" style={{
                color: "#7a6f5c", fontSize: "0.82rem", textDecoration: "none",
                display: "inline-flex", alignItems: "center", gap: "0.35rem",
                fontWeight: 500,
              }}>
                ← Back to Feed
              </Link>
            </div>

            {/* Post card */}
            <article style={{
              background: "#fff",
              border: "1px solid rgba(20,17,13,0.09)",
              borderRadius: "12px",
              boxShadow: "0 1px 4px rgba(20,17,13,0.06)",
              padding: "1.25rem 1.5rem",
              margin: "0.85rem 1rem 1rem",
            }}>
              <div style={{ display: "flex", gap: "0.75rem" }}>
              {/* Avatar */}
              <div style={{
                width: "40px", height: "40px", borderRadius: "50%",
                background: "#edf7ed", border: "1px solid #c8e6c9",
                color: "#2e7d32", fontSize: "0.68rem", fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {initials}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.65rem", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                    <span style={{ color: "#14110d", fontSize: "0.88rem", fontWeight: 700 }}>{author}</span>
                    <span style={{ color: "#7a6f5c", fontSize: "0.72rem" }}>{formatDate(post.date)}</span>
                  </div>
                  {tag && (
                    <Link
                      href={`/feed?tag=${encodeURIComponent(tag)}`}
                      style={{
                        marginLeft: "auto",
                        background: "rgba(46,125,50,0.08)", color: "#2e7d32",
                        fontSize: "0.68rem", fontWeight: 600,
                        padding: "0.2rem 0.6rem",
                        borderRadius: "9999px",
                        border: "1px solid rgba(46,125,50,0.18)",
                        textDecoration: "none",
                      }}
                    >
                      {tag}
                    </Link>
                  )}
                </div>

                {/* Gallery (template-specific) */}
                {galleryImages && galleryImages.length >= 1 && (
                  <div className="hide-scrollbar" style={{ display: "flex", gap: "4px", overflowX: "auto", marginBottom: "0.65rem", borderRadius: "6px", border: "1px solid #e8e2d8" }}>
                    {galleryImages.map((img: string, i: number) => (
                      <img key={i} src={img} alt="" style={{ height: "260px", objectFit: "cover", flexShrink: 0 }} loading="lazy" />
                    ))}
                  </div>
                )}

                {/* Single image (only when no gallery) */}
                {image && !galleryImages?.length && (
                  <div style={{ marginBottom: "0.65rem", overflow: "hidden" }}>
                    <img
                      src={image}
                      alt={author}
                      style={{ width: "100%", display: "block", maxHeight: "420px", objectFit: "cover" }}
                    />
                  </div>
                )}

                {/* Post text + reactions + comments (client) */}
                <CommunityPostClient
                  text={rawText}
                  wpId={String(post.id)}
                  postId={post.id}
                  initialReactions={{
                    love: Number(post.meta.reaction_love ?? 0),
                    fire: Number(post.meta.reaction_fire ?? 0),
                    clap: Number(post.meta.reaction_clap ?? 0),
                  }}
                  shareUrl={url}
                  initialComments={comments}
                  templateType={templateType}
                  starRating={starRating}
                  locationName={locationName}
                  pollOptions={pollOptions}
                  pollExpiresAt={pollExpiresAt}
                  galleryImages={galleryImages}
                  videoUrl={videoUrl}
                  itineraryStops={itineraryStops}
                  foodDishName={foodDishName}
                  foodRatingTaste={foodRatingTaste}
                  foodRatingValue={foodRatingValue}
                  foodRatingVibe={foodRatingVibe}
                  sourceUrl={sourceUrl}
                  source={source}
                  ogTitle={ogTitle}
                  ogDescription={ogDescription}
                  ogImage={ogImage}
                />

              </div>
              </div>
            </article>
          </div>
          </main>

          {/* ── Right sidebar ── */}
          <aside className="pulse-sidebar-right">
            <div style={{ padding: "1.25rem 1rem" }}>
              <div style={{ background: "#fff", border: "1px solid rgba(20,17,13,0.09)", borderRadius: "12px", padding: "0.85rem", boxShadow: "0 1px 3px rgba(20,17,13,0.05)" }}>
                <p style={{
                  color: "#7a6f5c", fontSize: "0.6rem", fontWeight: 700,
                  letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.45rem",
                }}>
                  About Moveee
                </p>
                <p style={{ color: "#3a342b", fontSize: "0.78rem", lineHeight: 1.55, margin: "0 0 0.85rem" }}>
                  Village square for culture loving creatives, entrepreneurs, professionals.
                </p>
                {loggedIn ? (
                  <Link href="/member" style={{
                    display: "block", background: "var(--ochre, #7a241c)", color: "#fff",
                    textAlign: "center", padding: "0.5rem 0.75rem",
                    fontSize: "0.78rem", fontWeight: 600,
                    borderRadius: "8px", textDecoration: "none",
                  }}>
                    Member Dashboard →
                  </Link>
                ) : (
                  <Link href="/register" style={{
                    display: "block", background: "var(--ochre, #7a241c)", color: "#fff",
                    textAlign: "center", padding: "0.5rem 0.75rem",
                    fontSize: "0.78rem", fontWeight: 600,
                    borderRadius: "8px", textDecoration: "none",
                  }}>
                    Join Moveee →
                  </Link>
                )}
              </div>

              {/* apps/connect has no site-wide footer — every page with a
                  right rail carries this copyright block instead. */}
              <p style={{ margin: "1rem 0 0", fontSize: "0.68rem", color: "#7a6f5c", lineHeight: 1.7 }}>
                © {new Date().getFullYear()} The Moveee. All Rights Reserved.
                <br />
                <Link href="/terms" style={{ color: "#7a6f5c" }}>Terms</Link>
                {" · "}
                <Link href="/privacy" style={{ color: "#7a6f5c" }}>Privacy</Link>
                {" · "}
                <Link href="/contact" style={{ color: "#7a6f5c" }}>Contact</Link>
              </p>
            </div>
          </aside>

        </div>
      </div>
    </>
  );
}
