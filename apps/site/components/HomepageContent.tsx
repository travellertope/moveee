import Link from "next/link";
import Image from "next/image";
import MoveeeZone from "@/components/MoveeeZone";
import MagazineSpotlight from "@/components/MagazineSpotlight";
import { decodeHtml } from "@/lib/decode-html";
import { sanitizeHtml } from "@/lib/sanitize";
import type { EditionSlug } from "@/lib/editions";
import "@/app/magazine.css";

interface Props {
  coverStory: any;
  stories: any[];
  products: any[];
  edition: EditionSlug;
  latestIssue?: any;
  latestIssueStories?: any[];
  interviewStories?: any[];
  seriesTheRadar?: any[];
  seriesPortraits?: any[];
  seriesTheLane?: any[];
  seriesThinkCreative?: any[];
}

function StoryCard({ story }: { story: any }) {
  return (
    <Link href={`/magazine/${story.slug}`} className="mg-card">
      <div className="mg-card-img">
        {story.featuredImage?.node?.sourceUrl ? (
          <Image
            src={story.featuredImage.node.sourceUrl}
            alt={story.featuredImage.node.altText || ""}
            fill
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "var(--ink)" }} />
        )}
      </div>
      <div className="mg-card-body">
        <div className="mg-card-kicker">
          {decodeHtml(story.categories?.nodes?.[0]?.name || "Article")}
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
        {story.date && (
          <div className="mg-card-date">{new Date(story.date).toLocaleDateString("en-GB")}</div>
        )}
      </div>
    </Link>
  );
}

const EDITION_BAND_LABEL: Record<EditionSlug, string> = {
  global: "From The Magazine",
  uk: "From The Magazine — Britain",
  us: "From The Magazine — America",
  africa: "From The Magazine — Africa",
};

export default function HomepageContent({ coverStory, stories, edition, latestIssue }: Props) {
  return (
    <>
      {/* ===== MOVEEE ZONE: HERO + WHAT IS MOVEEE + FEATURE GRID + DOWNLOAD ===== */}
      <MoveeeZone />

      {/* ===== FROM THE MAGAZINE — edition-scoped via the country taxonomy =====
          id="magazine" is the anchor target for MoveeeZone.tsx's hero
          "Read the Magazine" CTA. */}
      <div id="magazine">
      {coverStory && (
        <section className="mg-cover-section">
          <div className="mg-cover-grid">
            <Link href={`/magazine/${coverStory.slug}`} className="mg-cover-img">
              {coverStory.featuredImage?.node?.sourceUrl ? (
                <Image
                  src={coverStory.featuredImage.node.sourceUrl}
                  alt={coverStory.featuredImage.node.altText || ""}
                  fill
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <div style={{ width: "100%", height: "100%", background: "var(--ink)" }} />
              )}
            </Link>
            <div>
              <p className="mg-cover-kicker">
                {decodeHtml(coverStory.categories?.nodes?.[0]?.name || "Featured")}
              </p>
              <Link href={`/magazine/${coverStory.slug}`} className="mg-cover-title-link">
                <h2
                  className="mg-cover-title"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(coverStory.title) }}
                />
              </Link>
              {coverStory.excerpt && (
                <p
                  className="mg-cover-dek"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(coverStory.excerpt.replace(/<[^>]*>/g, "")),
                  }}
                />
              )}
              <Link href={`/magazine/${coverStory.slug}`} className="mg-cover-link">
                Read the full story →
              </Link>
            </div>
          </div>
        </section>
      )}

      {stories?.length > 0 && (
        <section className="mg-band">
          <div className="mg-band-inner">
            <div className="mg-band-header">
              <div className="mg-band-heading">
                <p className="mg-band-eyebrow">Editorial</p>
                <h3 className="mg-band-title">{EDITION_BAND_LABEL[edition]}</h3>
              </div>
              <Link href="/magazine" className="mg-band-view-all">See all →</Link>
            </div>
            <div className="mg-filtered-grid">
              {stories.slice(0, 6).map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          </div>
        </section>
      )}
      </div>

      {/* ===== MOVEEE MAGAZINE SPOTLIGHT — last section on the page ===== */}
      <MagazineSpotlight latestIssue={latestIssue} />
    </>
  );
}
