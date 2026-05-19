import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCommunityPostBySlug, getAllCommunitySlugs, getPostComments } from "@/lib/community-wordpress";
import { parseHashtags } from "@/lib/hashtags";
import CommunityPostClient from "./CommunityPostClient";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://themoveee.com";

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
      title,
      description,
      url,
      siteName: "The Moveee",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.modified,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    alternates: { canonical: url },
    robots: { index: true, follow: true },
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function CommunityPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getCommunityPostBySlug(slug);
  if (!post) notFound();
  const comments = await getPostComments(post.id);

  const rawText  = post.content.rendered.replace(/<[^>]+>/g, "").trim();
  const author   = post.meta.community_author_name ?? "Community Member";
  const tag      = post.meta.community_tag ?? "";
  const image    = post.meta.community_image_url ?? null;
  const hashtags = parseHashtags(rawText);
  const initials = author.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

  const url = `${SITE_URL}/community/${post.slug}`;

  // JSON-LD — SocialMediaPosting schema for maximum Google visibility.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SocialMediaPosting",
    url,
    headline: rawText.slice(0, 110),
    articleBody: rawText,
    datePublished: post.date,
    dateModified: post.modified,
    author: {
      "@type": "Person",
      name: author,
    },
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
    isPartOf: {
      "@type": "WebPage",
      url: `${SITE_URL}/pulse`,
      name: "Moveee Pulse",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div style={{ background: "#f7f5f2", minHeight: "100vh", padding: "2rem 1.5rem 4rem" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          {/* Back link */}
          <Link
            href="/connect"
            style={{
              color: "#7a6f5c",
              fontSize: "0.78rem",
              textDecoration: "none",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              marginBottom: "2rem",
            }}
          >
            ← Pulse
          </Link>

          {/* Author header */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "#edf7ed",
                border: "1px solid #c8e6c9",
                color: "#2e7d32",
                fontSize: "0.8rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                letterSpacing: "0.05em",
              }}
            >
              {initials}
            </div>
            <div>
              <div style={{ color: "#2e7d32", fontSize: "0.9rem", fontWeight: 600 }}>{author}</div>
              <div style={{ color: "#7a6f5c", fontSize: "0.75rem" }}>{formatDate(post.date)}</div>
            </div>
            {tag && (
              <Link
                href={`/pulse?tag=${encodeURIComponent(tag)}`}
                style={{
                  marginLeft: "auto",
                  background: "#edf7ed",
                  color: "#2e7d32",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "2px",
                  textDecoration: "none",
                  border: "1px solid #c8e6c9",
                }}
              >
                {tag}
              </Link>
            )}
          </div>

          {/* Post image */}
          {image && (
            <div style={{ marginBottom: "1.5rem", borderRadius: "2px", overflow: "hidden" }}>
              <img
                src={image}
                alt={author}
                style={{ width: "100%", display: "block", maxHeight: "420px", objectFit: "cover" }}
              />
            </div>
          )}

          {/* Post text — client component handles hashtag links */}
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
          />

          {/* Hashtag list */}
          {hashtags.length > 0 && (
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "2rem" }}>
              {hashtags.map((ht) => (
                <Link
                  key={ht}
                  href={`/pulse?hashtag=${encodeURIComponent(ht)}`}
                  style={{
                    color: "#b38238",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    background: "#fdf5e6",
                    padding: "0.25rem 0.65rem",
                    borderRadius: "2px",
                  }}
                >
                  #{ht}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
