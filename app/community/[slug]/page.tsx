import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCommunityPostBySlug, getAllCommunitySlugs, getPostComments } from "@/lib/community-wordpress";
import { parseHashtags } from "@/lib/hashtags";
import CommunityPostClient from "./CommunityPostClient";
import "@/app/pulse-layout.css";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://themoveee.com";

const NAV_LINKS = [
  { label: "All",       href: "/connect" },
  { label: "Pulse",     href: "/connect" },
  { label: "News",      href: "/connect" },
  { label: "Editorial", href: "/connect" },
  { label: "Event",     href: "/connect" },
  { label: "Directory", href: "/connect" },
];

export async function generateStaticParams() {
  try {
    const slugs = await getAllCommunitySlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getCommunityPostBySlug(slug);
  if (!post) return { title: "Post not found — Moveee" };

  const rawText = post.content.rendered.replace(/<[^>]+>/g, "").trim();
  const title   = rawText.slice(0, 80) + (rawText.length > 80 ? "…" : "");
  const description = rawText.slice(0, 155);
  const author  = post.meta.community_author_name ?? "Community Member";
  const tag     = post.meta.community_tag ?? "";
  const image   = post.meta.community_image_url || `${SITE_URL}/og-fallback.png`;
  const url     = `${SITE_URL}/community/${post.slug}`;
  const hashtags = parseHashtags(rawText);

  return {
    title: `${title} — Moveee Community`,
    description,
    authors: [{ name: author }],
    keywords: [tag, ...hashtags].filter(Boolean),
    openGraph: {
      title, description, url, siteName: "The Moveee",
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
    getServerSession(authOptions),
  ]);
  if (!post) notFound();
  const comments = await getPostComments(post.id);
  const loggedIn = !!session?.user;

  const rawText  = post.content.rendered.replace(/<[^>]+>/g, "").trim();
  const author   = post.meta.community_author_name ?? "Community Member";
  const tag      = post.meta.community_tag ?? "";
  const image    = post.meta.community_image_url ?? null;
  const hashtags = parseHashtags(rawText);
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
      name: "The Moveee",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: "https://mltvzlykp9yb.i.optimole.com/cb:k_0z.862/w:920/h:144/q:mauto/f:best/https://cms.themoveee.com/wp-content/uploads/2024/04/logo-1-e1713978527703.png",
      },
    },
    ...(image ? { image: { "@type": "ImageObject", url: image } } : {}),
    keywords: [tag, ...hashtags].filter(Boolean).join(", "),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div style={{ background: "#ffffff" }}>
        <div className="pulse-layout">

          {/* ── Left sidebar ── */}
          <aside className="pulse-sidebar-left">
            <nav style={{ padding: "1.25rem 0" }}>
              <div style={{ padding: "0 0.75rem 1rem", borderBottom: "1px solid #e8e2d8", marginBottom: "1rem" }}>
                <Link href="/connect" style={{
                  display: "inline-flex", alignItems: "center", gap: "0.3rem",
                  color: "#7a6f5c", fontSize: "0.75rem", textDecoration: "none",
                  letterSpacing: "0.06em", textTransform: "uppercase",
                }}>
                  ← Pulse Feed
                </Link>
              </div>

              <p style={{
                color: "#7a6f5c", fontSize: "0.6rem", fontWeight: 700,
                letterSpacing: "0.15em", textTransform: "uppercase",
                marginBottom: "0.4rem", paddingLeft: "0.75rem",
              }}>
                Content
              </p>
              <ul style={{ margin: 0, padding: 0 }}>
                {NAV_LINKS.map(({ label, href }) => (
                  <li key={label} style={{ listStyle: "none" }}>
                    <Link href={href} style={{
                      display: "block",
                      borderLeft: label === "Pulse" ? "2px solid #c5491f" : "2px solid transparent",
                      padding: "0.28rem 0.75rem",
                      color: label === "Pulse" ? "#c5491f" : "#3a342b",
                      fontSize: "0.83rem",
                      fontWeight: label === "Pulse" ? 600 : 400,
                      textDecoration: "none",
                    }}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* ── Main post ── */}
          <main className="pulse-timeline">
            {/* Post card — matches community card style from the feed */}
            <article style={{
              background: "#fff",
              borderBottom: "1px solid #e8e2d8",
              borderLeft: "3px solid #81c784",
              padding: "1rem 1.25rem",
              display: "flex",
              gap: "0.75rem",
            }}>
              {/* Avatar */}
              <div style={{
                width: "34px", height: "34px", borderRadius: "50%",
                background: "#edf7ed", border: "1px solid #c8e6c9",
                color: "#2e7d32", fontSize: "0.62rem", fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {initials}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                  <span style={{ color: "#14110d", fontSize: "0.82rem", fontWeight: 600 }}>{author}</span>
                  <span style={{ color: "#c8bfb0", fontSize: "0.7rem" }}>·</span>
                  <span style={{ color: "#7a6f5c", fontSize: "0.7rem" }}>{formatDate(post.date)}</span>
                  {tag && (
                    <Link
                      href={`/connect?tag=${encodeURIComponent(tag)}`}
                      style={{
                        marginLeft: "auto",
                        background: "#edf7ed", color: "#2e7d32",
                        fontSize: "0.58rem", fontWeight: 700,
                        letterSpacing: "0.1em", textTransform: "uppercase",
                        padding: "0.15rem 0.4rem", border: "none",
                        textDecoration: "none",
                      }}
                    >
                      {tag}
                    </Link>
                  )}
                </div>

                {/* Gallery (template-specific) */}
                {galleryImages && galleryImages.length >= 1 && (
                  <div style={{ display: "flex", gap: "4px", overflowX: "auto", marginBottom: "0.65rem", borderRadius: "6px", border: "1px solid #e8e2d8" }}>
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
                  hashtags={hashtags}
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

                {/* Hashtags */}
                {hashtags.length > 0 && (
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
                    {hashtags.map((ht) => (
                      <Link
                        key={ht}
                        href={`/connect?hashtag=${encodeURIComponent(ht)}`}
                        style={{
                          color: "#b38238", fontSize: "0.78rem", fontWeight: 600,
                          textDecoration: "none", background: "#fdf5e6",
                          padding: "0.2rem 0.55rem",
                        }}
                      >
                        #{ht}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </article>
          </main>

          {/* ── Right sidebar ── */}
          <aside className="pulse-sidebar-right">
            <div style={{ padding: "1.25rem 1rem" }}>
              <div style={{ background: "#fff", border: "1px solid #e8e2d8", padding: "0.85rem" }}>
                <p style={{
                  color: "#7a6f5c", fontSize: "0.6rem", fontWeight: 700,
                  letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.45rem",
                }}>
                  About Moveee Connect
                </p>
                <p style={{ color: "#3a342b", fontSize: "0.78rem", lineHeight: 1.55, margin: "0 0 0.85rem" }}>
                  Village square for culture loving creatives, entrepreneurs, professionals.
                </p>
                {loggedIn ? (
                  <Link href="/member" style={{
                    display: "block", background: "#c93c2a", color: "#fff",
                    textAlign: "center", padding: "0.45rem 0.75rem",
                    fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em",
                    textTransform: "uppercase", textDecoration: "none",
                  }}>
                    Member Dashboard →
                  </Link>
                ) : (
                  <Link href="/register" style={{
                    display: "block", background: "#c93c2a", color: "#fff",
                    textAlign: "center", padding: "0.45rem 0.75rem",
                    fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em",
                    textTransform: "uppercase", textDecoration: "none",
                  }}>
                    Join Moveee Connect →
                  </Link>
                )}
              </div>
            </div>
          </aside>

        </div>
      </div>
    </>
  );
}
