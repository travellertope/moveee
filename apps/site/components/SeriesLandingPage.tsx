import Image from "next/image";
import Link from "next/link";
import { sanitizeHtml } from "@/lib/sanitize";
import { decodeHtml } from "@/lib/decode-html";
import CultureDropBand from "./CultureDropBand";

interface Story {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  date: string;
  featuredImage?: { node?: { sourceUrl?: string; altText?: string } };
  categories?: { nodes: { name: string; slug: string }[] };
  author?: { node?: { name?: string } };
}

interface SeriesLandingPageProps {
  name: string;
  description?: string;
  stories: Story[];
}

export default function SeriesLandingPage({ name, description, stories }: SeriesLandingPageProps) {
  const hero = stories[0] || null;
  const secondary = stories.slice(1, 4);
  const remainder = stories.slice(4);

  return (
    <>
      {/* ── SERIES HERO HEADER ── */}
      <section className="sr-hero">
        <div className="sr-hero-inner">
          <div className="sr-hero-eyebrow">Series</div>
          <h1 className="sr-hero-title">{name}</h1>
          {description && (
            <div
              className="sr-hero-desc"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }}
            />
          )}
          <div className="sr-hero-meta">
            <Link href="/magazine" className="sr-hero-back">← All Editorials</Link>
          </div>
        </div>
      </section>

      {/* ── LEAD STORY ── */}
      {hero && (
        <section className="sr-lead">
          <div className="sr-lead-inner">
            <Link href={`/magazine/${hero.slug}`} className="sr-lead-card">
              <div className="sr-lead-img">
                {hero.featuredImage?.node?.sourceUrl ? (
                  <Image
                    src={hero.featuredImage.node.sourceUrl}
                    alt={hero.featuredImage.node.altText || hero.title}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="(max-width: 768px) 100vw, 60vw"
                    priority
                  />
                ) : (
                  <div className="sr-lead-img-placeholder" />
                )}
              </div>
              <div className="sr-lead-body">
                <div className="sr-lead-kicker">
                  {decodeHtml(hero.categories?.nodes[0]?.name || "Article")}
                </div>
                <h2
                  className="sr-lead-title"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(hero.title) }}
                />
                {hero.excerpt && (
                  <p
                    className="sr-lead-excerpt"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(hero.excerpt.replace(/<[^>]*>/g, "")),
                    }}
                  />
                )}
                <div className="sr-lead-date">
                  {hero.author?.node?.name && (
                    <span className="sr-lead-author">{hero.author.node.name}</span>
                  )}
                  <span>{new Date(hero.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
              </div>
            </Link>

            {secondary.length > 0 && (
              <div className="sr-secondary">
                {secondary.map((story) => (
                  <Link key={story.id} href={`/magazine/${story.slug}`} className="sr-secondary-card">
                    <div className="sr-secondary-img">
                      {story.featuredImage?.node?.sourceUrl ? (
                        <Image
                          src={story.featuredImage.node.sourceUrl}
                          alt={story.featuredImage.node.altText || story.title}
                          fill
                          style={{ objectFit: "cover" }}
                          sizes="25vw"
                        />
                      ) : (
                        <div className="sr-secondary-img-placeholder" />
                      )}
                    </div>
                    <div className="sr-secondary-body">
                      <div className="sr-secondary-kicker">
                        {decodeHtml(story.categories?.nodes[0]?.name || "Article")}
                      </div>
                      <h3
                        className="sr-secondary-title"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(story.title) }}
                      />
                      <div className="sr-secondary-date">
                        {new Date(story.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── CULTURE DROP BAND ── */}
      <CultureDropBand />

      {/* ── REMAINING STORIES ── */}
      {remainder.length > 0 && (
        <section className="sr-grid-section">
          <div className="sr-grid-inner">
            <div className="sr-grid-header">
              <span className="sr-grid-label">More from {name}</span>
            </div>
            <div className="sr-grid">
              {remainder.map((story) => (
                <Link key={story.id} href={`/magazine/${story.slug}`} className="mg-card">
                  <div className="mg-card-img">
                    {story.featuredImage?.node?.sourceUrl ? (
                      <Image
                        src={story.featuredImage.node.sourceUrl}
                        alt={story.featuredImage.node.altText || story.title}
                        fill
                        style={{ objectFit: "cover" }}
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "var(--ink)" }} />
                    )}
                  </div>
                  <div className="mg-card-kicker">
                    {decodeHtml(story.categories?.nodes[0]?.name || "Article")}
                  </div>
                  <h4
                    className="mg-card-title"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(story.title) }}
                  />
                  <div
                    className="mg-card-desc"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(story.excerpt?.replace(/<[^>]*>/g, "") || ""),
                    }}
                  />
                  <div className="mg-card-date">
                    {new Date(story.date).toLocaleDateString("en-GB")}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
