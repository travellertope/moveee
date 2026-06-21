import React from "react";
import { getWPData, GET_AUTHOR_STORIES, GET_AUTHOR_STORIES_BY_SLUG, GET_AUTHOR_STORIES_BY_LOGIN } from "@/lib/wp";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/app/homepage.css";
import "@/app/magazine.css";
import { sanitizeHtml } from "@/lib/sanitize";

export const revalidate = 300;
export const dynamicParams = true;

async function fetchAuthorData(slug: string, first: number) {
  const isNumeric = /^\d+$/.test(slug);

  // 1. Try DATABASE_ID if param looks numeric
  if (isNumeric) {
    const data = await getWPData(GET_AUTHOR_STORIES, { first, id: slug });
    if (data?.user) return data;
  }

  // 2. Try SLUG (user_nicename)
  const bySlug = await getWPData(GET_AUTHOR_STORIES_BY_SLUG, { first, slug });
  if (bySlug?.user) return bySlug;

  // 3. Try USERNAME (user_login — WordPress author URL uses this)
  const byLogin = await getWPData(GET_AUTHOR_STORIES_BY_LOGIN, { first, login: slug });
  if (byLogin?.user) return byLogin;

  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  let data;
  try {
    data = await fetchAuthorData(resolvedParams.slug, 1);
  } catch {}

  const author = data?.user;
  if (!author) return { title: { absolute: "Author Archive · The Moveee" } };

  return {
    title: { absolute: `${author.name} · The Moveee` },
    description: author.description || `Articles by ${author.name} on The Moveee.`,
  };
}

export default async function AuthorArchivePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  let data;
  try {
    data = await fetchAuthorData(resolvedParams.slug, 50);
  } catch (err: any) {
    console.error("AuthorArchivePage fetchAuthorData error:", err);
  }

  const author = data?.user;
  const stories = author?.posts?.nodes || [];

  if (!author && stories.length === 0) {
    notFound();
  }

  const authorName = author?.name || resolvedParams.slug.replace(/-/g, " ");
  const authorBio = author?.description || "Culture, lifestyle, and heritage — curated from Lagos, London, Accra, and beyond.";
  const authorAvatar = author?.avatar?.url;

  return (
    <>
      {/* ── AUTHOR MASTHEAD ── */}
      <section className="mag-head">
        <div className="mag-head-inner">
          <div className="mag-head-left" style={{ alignItems: 'center', gap: '32px' }}>
            {/* Avatar */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '1px solid rgba(42,36,28,0.2)',
              flexShrink: 0,
              position: 'relative',
              background: 'var(--ink)',
            }}>
              {authorAvatar ? (
                <Image src={authorAvatar} alt={authorName} fill style={{ objectFit: 'cover' }} />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Fraunces', serif",
                  fontSize: '28px',
                  fontStyle: 'italic',
                  color: 'var(--paper)',
                }}>
                  {authorName.charAt(0)}
                </div>
              )}
            </div>

            {/* Name + label */}
            <div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--ochre)',
                marginBottom: '10px',
              }}>
                Writer / Contributor
              </div>
              <h1 className="mag-title-main">
                {authorName.includes(" ") ? (
                  <>
                    {authorName.split(" ").slice(0, -1).join(" ")} <em>{authorName.split(" ").slice(-1)}</em>
                  </>
                ) : (
                  authorName
                )}
              </h1>
            </div>

            {/* Bio divider */}
            <p className="mag-desc">{authorBio}</p>
          </div>
        </div>
      </section>

      {/* ── STORIES GRID ── */}
      <section className="section-band" style={{ paddingTop: '60px', paddingBottom: '120px' }}>
        <div className="sec-label">Archive</div>
        <div className="sec-header">
          <h3>Stories by <em>{authorName.split(" ")[0]}</em></h3>
          <Link href="/magazine">All stories →</Link>
        </div>

        {stories.length > 0 ? (
          <div className="grid-3">
            {stories.map((story: any) => (
              <Link key={story.id} href={`/magazine/${story.slug}`} className="card">
                <div className="img r-port">
                  {story.featuredImage?.node?.sourceUrl ? (
                    <Image
                      src={story.featuredImage.node.sourceUrl}
                      alt={story.featuredImage.node.altText || story.title}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
                      <defs>
                        <linearGradient id={`ag-${story.id}`} x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#3d4a2a" />
                          <stop offset="100%" stopColor="#14110d" />
                        </linearGradient>
                      </defs>
                      <rect width="400" height="500" fill={`url(#ag-${story.id})`} />
                      <circle cx="200" cy="250" r="100" fill="#c5491f" opacity="0.25" />
                      <circle cx="200" cy="250" r="60" fill="#b38238" opacity="0.3" />
                    </svg>
                  )}
                </div>
                <div className="kicker">
                  {story.categories?.nodes?.[0]?.name || "Article"}
                </div>
                <h4 dangerouslySetInnerHTML={{ __html: sanitizeHtml(story.title) }} />
                {story.excerpt && (
                  <div className="dek" dangerouslySetInnerHTML={{ __html: sanitizeHtml(story.excerpt.replace(/<[^>]*>/g, "").slice(0, 100) + "…") }} />
                )}
                <div className="meta">
                  {new Date(story.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p style={{
            fontFamily: "'Fraunces', serif",
            fontStyle: 'italic',
            fontSize: '22px',
            color: 'var(--mute)',
            textAlign: 'center',
            padding: '80px 0',
          }}>
            No stories published yet.
          </p>
        )}
      </section>
    </>
  );
}
