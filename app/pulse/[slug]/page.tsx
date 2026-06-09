import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getPulseStoryBySlug,
  getAllPulseSlugs,
  getPulseComments,
} from "@/lib/pulse-wordpress";
import CommentThread from "@/components/pulse/CommentThread";
import SourcePreviewCard from "@/components/pulse/SourcePreviewCard";
import "@/app/pulse-layout.css";

export const revalidate = 300;
export const dynamicParams = true;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://themoveee.com";

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const story = await getPulseStoryBySlug(slug);
  if (!story) return { title: "Story not found — Moveee" };

  const title = story.title.rendered.replace(/&[^;]+;/g, "");
  const rawDesc = story.excerpt.rendered.replace(/<[^>]+>/g, "").trim();
  const description = rawDesc.slice(0, 155);
  const image =
    story.meta.pulse_og_image ||
    story._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
    story.meta?.pulse_image_url ||
    `${SITE_URL}/og-fallback.png`;
  const url = `${SITE_URL}/pulse/${story.slug}`;

  return {
    title: `${title} — Moveee Pulse`,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "The Moveee",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      type: "article",
      publishedTime: story.date,
      modifiedTime: story.modified,
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    alternates: { canonical: url },
    robots: { index: true, follow: true },
  };
}

function decodeHtml(html: string) {
  return html
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#8217;/g, "’")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&nbsp;/g, " ");
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function PulseStoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [story, session] = await Promise.all([
    getPulseStoryBySlug(slug),
    getServerSession(authOptions),
  ]);
  if (!story) notFound();

  const comments = await getPulseComments(story.id);
  const loggedIn = !!session?.user;

  const title = decodeHtml(story.title.rendered);
  const source = story.meta.pulse_source ?? "";
  const sourceUrl = story.meta.pulse_external_url ?? "";
  const region = story.meta.pulse_region_label ?? "";
  const ogTitle = story.meta.pulse_og_title ?? "";
  const ogDescription = story.meta.pulse_og_description ?? "";
  const ogImage = story.meta.pulse_og_image ?? "";
  const featuredImage =
    story._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? "";
  const categories =
    story._embedded?.["wp:term"]
      ?.flat()
      .filter((t: { taxonomy: string; name: string }) => t.taxonomy === "pulse_category")
      .map((t: { taxonomy: string; name: string }) => t.name) ?? [];

  const url = `${SITE_URL}/pulse/${story.slug}`;
  const goUrl = `/go/${story.id}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    url,
    headline: title,
    description: story.excerpt.rendered.replace(/<[^>]+>/g, "").trim(),
    datePublished: story.date,
    dateModified: story.modified,
    publisher: {
      "@type": "Organization",
      name: "The Moveee",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: "https://mltvzlykp9yb.i.optimole.com/cb:k_0z.862/w:920/h:144/q:mauto/f:best/https://cms.themoveee.com/wp-content/uploads/2024/04/logo-1-e1713978527703.png",
      },
    },
    ...(featuredImage || ogImage
      ? { image: { "@type": "ImageObject", url: featuredImage || ogImage } }
      : {}),
    ...(source ? { sourceOrganization: { "@type": "Organization", name: source } } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <style>{`
        .pulse-story-body p { margin: 0 0 0.85em; }
        .pulse-story-body p:last-child { margin-bottom: 0; }
      `}</style>

      <div style={{ background: "#f3ece0" }}>
        <div className="pulse-layout">

          {/* ── Left sidebar ── */}
          <aside className="pulse-sidebar-left">
            <nav style={{ padding: "1.25rem 0" }}>
              <div style={{
                padding: "0 0.75rem 1rem",
                borderBottom: "1px solid #e8e2d8",
                marginBottom: "1rem",
              }}>
                <Link href="/connect" style={{
                  display: "inline-flex", alignItems: "center", gap: "0.3rem",
                  color: "#7a6f5c", fontSize: "0.75rem", textDecoration: "none",
                  letterSpacing: "0.06em", textTransform: "uppercase",
                }}>
                  ← Connect Feed
                </Link>
              </div>
              <p style={{
                color: "#7a6f5c", fontSize: "0.6rem", fontWeight: 700,
                letterSpacing: "0.15em", textTransform: "uppercase",
                marginBottom: "0.4rem", paddingLeft: "0.75rem",
              }}>
                Pulse
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {["News", "Music", "Film", "Art", "Fashion", "Culture"].map((cat) => (
                  <li key={cat}>
                    <Link href={`/connect?category=${encodeURIComponent(cat.toLowerCase())}`} style={{
                      display: "block",
                      padding: "0.28rem 0.75rem",
                      color: "#3a342b",
                      fontSize: "0.83rem",
                      textDecoration: "none",
                    }}>
                      {cat}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* ── Main content ── */}
          <main className="pulse-timeline">
            <article style={{
              background: "#fff",
              borderLeft: "3px solid #b38238",
            }}>
              {/* Hero image */}
              {(featuredImage || ogImage) && (
                <div style={{ overflow: "hidden", maxHeight: "360px" }}>
                  <img
                    src={featuredImage || ogImage}
                    alt={title}
                    style={{ width: "100%", display: "block", objectFit: "cover", maxHeight: "360px" }}
                  />
                </div>
              )}

              <div style={{ padding: "1.5rem 1.5rem 2rem" }}>
                {/* Badges */}
                <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", marginBottom: "0.85rem", flexWrap: "wrap" }}>
                  <span style={{
                    background: "#fef3e2", color: "#b38238",
                    fontSize: "0.58rem", fontWeight: 700,
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    padding: "0.18rem 0.45rem", borderRadius: "2px",
                  }}>
                    Pulse
                  </span>
                  {region && (
                    <span style={{
                      fontSize: "0.62rem", color: "#7a6f5c",
                      letterSpacing: "0.06em", textTransform: "uppercase",
                    }}>
                      {region}
                    </span>
                  )}
                  {categories.map((cat) => (
                    <Link key={cat} href={`/connect?category=${encodeURIComponent(cat.toLowerCase())}`} style={{
                      background: "#f3ece0", color: "#7a6f5c",
                      fontSize: "0.58rem", fontWeight: 600,
                      letterSpacing: "0.08em", textTransform: "uppercase",
                      padding: "0.15rem 0.4rem", borderRadius: "2px",
                      textDecoration: "none",
                    }}>
                      {cat}
                    </Link>
                  ))}
                </div>

                {/* Title */}
                <h1 style={{
                  fontFamily: "var(--font-fraunces), serif",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  lineHeight: 1.3,
                  color: "#14110d",
                  marginBottom: "0.6rem",
                }}>
                  {title}
                </h1>

                {/* Meta row */}
                <div style={{
                  display: "flex", gap: "0.6rem", alignItems: "center",
                  marginBottom: "1.5rem", flexWrap: "wrap",
                  color: "#999", fontSize: "0.75rem",
                }}>
                  <span>{formatDate(story.date)}</span>
                  {source && (
                    <span>
                      Via{" "}
                      <span style={{ color: "#b38238", fontWeight: 600 }}>{source}</span>
                    </span>
                  )}
                  <span style={{
                    color: "#b38238", fontSize: "0.6rem", fontWeight: 700,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    background: "rgba(179,130,56,.08)", padding: "0.12rem 0.35rem",
                    borderRadius: "2px",
                  }}>
                    Curated with AI
                  </span>
                </div>

                {/* Body */}
                <div
                  className="pulse-story-body"
                  style={{
                    fontFamily: "var(--font-fraunces), serif",
                    fontSize: "1rem",
                    lineHeight: 1.75,
                    color: "#3a342b",
                    marginBottom: "1.5rem",
                  }}
                  dangerouslySetInnerHTML={{ __html: story.content.rendered }}
                />

                {/* Source preview */}
                {sourceUrl && (
                  <div style={{ marginBottom: "1.75rem" }}>
                    <SourcePreviewCard
                      goUrl={goUrl}
                      sourceName={source}
                      sourceUrl={sourceUrl}
                      ogTitle={ogTitle}
                      ogDescription={ogDescription}
                      ogImage={ogImage}
                    />
                  </div>
                )}

                {/* Comments */}
                <CommentThread
                  postId={story.id}
                  initialComments={comments}
                />
              </div>
            </article>
          </main>

          {/* ── Right sidebar ── */}
          <aside className="pulse-sidebar-right">
            <div style={{ padding: "1.25rem 1rem" }}>
              <div style={{ background: "#fff", border: "1px solid #e8e2d8", padding: "0.85rem", marginBottom: "1rem" }}>
                <p style={{
                  color: "#7a6f5c", fontSize: "0.6rem", fontWeight: 700,
                  letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.45rem",
                }}>
                  Share this story
                </p>
                <p style={{ color: "#3a342b", fontSize: "0.78rem", lineHeight: 1.55, margin: "0 0 0.85rem" }}>
                  Share this Pulse story with your network.
                </p>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block", background: "#14110d", color: "#f3ece0",
                    textAlign: "center", padding: "0.45rem 0.75rem",
                    fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em",
                    textTransform: "uppercase", textDecoration: "none", marginBottom: "0.5rem",
                  }}
                >
                  Share on X →
                </a>
              </div>

              <div style={{ background: "#fff", border: "1px solid #e8e2d8", padding: "0.85rem" }}>
                <p style={{
                  color: "#7a6f5c", fontSize: "0.6rem", fontWeight: 700,
                  letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.45rem",
                }}>
                  About Moveee Pulse
                </p>
                <p style={{ color: "#3a342b", fontSize: "0.78rem", lineHeight: 1.55, margin: "0 0 0.85rem" }}>
                  AI-curated culture stories from across the globe — music, film, art, fashion and more.
                </p>
                {loggedIn ? (
                  <Link href="/connect" style={{
                    display: "block", background: "#c93c2a", color: "#fff",
                    textAlign: "center", padding: "0.45rem 0.75rem",
                    fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em",
                    textTransform: "uppercase", textDecoration: "none",
                  }}>
                    Back to Feed →
                  </Link>
                ) : (
                  <Link href="/register" style={{
                    display: "block", background: "#c93c2a", color: "#fff",
                    textAlign: "center", padding: "0.45rem 0.75rem",
                    fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em",
                    textTransform: "uppercase", textDecoration: "none",
                  }}>
                    Join Moveee →
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
