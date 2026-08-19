import React from "react";
import { getWPData, GET_AUTHOR_STORIES, GET_AUTHOR_STORIES_BY_SLUG, GET_AUTHOR_STORIES_BY_LOGIN } from "@/lib/wp";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/app/magazine.css";
import { sanitizeHtml } from "@/lib/sanitize";
import { decodeHtml } from "@/lib/decode-html";
import { tileMasonryShapes } from "@/lib/masonryShapes";
import { colorForCard } from "@/lib/cardColors";

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
  if (!author) return { title: { absolute: "Author Archive | Moveee Magazine" } };

  return {
    title: { absolute: `${author.name} | Moveee Magazine` },
    description: author.description || `Articles by ${author.name} on Moveee Magazine.`,
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
    <div className="mg-page-white">
      {/* ── AUTHOR MASTHEAD ── */}
      <section className="mg-author-head">
        <div className="mg-author-head-inner">
          <div className="mg-author-avatar">
            {authorAvatar ? (
              <Image src={authorAvatar} alt={authorName} fill style={{ objectFit: "cover" }} />
            ) : (
              <span>{authorName.charAt(0)}</span>
            )}
          </div>
          <div className="mg-author-info">
            <div className="mg-sec-label">Writer / Contributor</div>
            <h1 className="mg-author-name">
              {authorName.includes(" ") ? (
                <>
                  {authorName.split(" ").slice(0, -1).join(" ")}{" "}
                  <em>{authorName.split(" ").slice(-1)}</em>
                </>
              ) : (
                authorName
              )}
            </h1>
            <p className="mg-author-bio">{authorBio}</p>
          </div>
        </div>
      </section>

      {/* ── STORIES GRID ── */}
      <section className="mg-filtered">
        <div className="mg-sec-header">
          <h3>
            Stories by <em>{authorName.split(" ")[0]}</em>
          </h3>
          <Link href="/magazine" className="mg-sec-all">All stories →</Link>
        </div>

        {stories.length > 0 ? (
          // Same masonry treatment as the homepage sections and the
          // category/industry/country/tag archives — see
          // MagazineArchiveWrapper.tsx for the full rationale.
          <div className="masonry-rand">
            {tileMasonryShapes(stories).map(({ item: story, shape }: any) => {
              const image = story.featuredImage?.node?.sourceUrl || null;
              const alt = story.featuredImage?.node?.altText || story.title || "";
              return (
                <Link
                  key={story.id}
                  href={`/magazine/${story.slug}`}
                  className={`wcard wcard--${shape}`}
                  style={{ background: colorForCard(story.databaseId ?? story.id) }}
                >
                  <div className="wcard-photo">
                    {image ? (
                      <img src={image} alt={alt} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "var(--ink)" }} />
                    )}
                  </div>
                  <p
                    className="wcard-caption"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(story.title) }}
                  />
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="mg-empty">No stories published yet.</p>
        )}
      </section>
    </div>
  );
}
