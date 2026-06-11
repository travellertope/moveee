"use client";

import Link from "next/link";
import type { WpPulseStory, WpComment } from "@/lib/pulse-wordpress";
import { decodeHtml } from "@/lib/decode-html";
import { sanitizeHtml } from "@/lib/sanitize";
import CommentThread from "./CommentThread";

const ARM_STYLES: Record<string, { bg: string; color: string }> = {
  lifestyle:  { bg: "#E1F5EE", color: "#085041" },
  origins:    { bg: "#FAEEDA", color: "#633806" },
  happenings: { bg: "#EEEDFE", color: "#3C3489" },
  magazine:   { bg: "#FAECE7", color: "#712B13" },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface PulseStoryProps {
  story: WpPulseStory;
  initialComments: WpComment[];
  relatedStories?: WpPulseStory[];
}

export default function PulseStory({ story, initialComments, relatedStories = [] }: PulseStoryProps) {
  const arm = story.meta?.pulse_arm_label?.toLowerCase() ?? "";
  const region = story.meta?.pulse_region_label ?? "";
  const source = story.meta?.pulse_source ?? "";
  const sourceUrl = story.meta?.pulse_external_url ?? "";
  const armStyle = ARM_STYLES[arm] ?? { bg: "#F0F0F0", color: "#333" };

  const title = decodeHtml(story.title?.rendered ?? "");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const storyUrl = `${siteUrl}/pulse/${story.slug}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: storyUrl });
      } catch {
        // User cancelled — no-op.
      }
    } else {
      await navigator.clipboard.writeText(storyUrl).catch(() => {});
      alert("Link copied to clipboard");
    }
  };

  return (
    <div style={{ background: "var(--paper)", minHeight: "100vh", color: "var(--ink)" }}>
      {/* Back link */}
      <div style={{ padding: "2rem 3.5rem 1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
        <Link
          href="/connect"
          style={{
            color: "var(--ochre)",
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Moveee Pulse
        </Link>
      </div>

      {/* Two-column layout */}
      <div className="pulse-story-layout">
        {/* Main article */}
        <article className="pulse-story-main">
          {/* Badges */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
            {arm && (
              <span
                style={{
                  background: armStyle.bg,
                  color: armStyle.color,
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "0.25rem 0.6rem",
                  borderRadius: "2px",
                }}
              >
                {arm}
              </span>
            )}
            {region && (
              <span
                style={{
                  background: "transparent",
                  color: "#6b6157",
                  fontSize: "0.65rem",
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "0.25rem 0.6rem",
                  border: "1px solid #d4cfc6",
                  borderRadius: "2px",
                }}
              >
                {region}
              </span>
            )}
          </div>

          {/* Title */}
          <h1
            style={{
              fontFamily: "var(--font-fraunces), serif",
              fontSize: "clamp(1.45rem, 3.5vw, 2.1rem)",
              fontWeight: 700,
              lineHeight: 1.2,
              color: "var(--ink)",
              marginBottom: "1rem",
            }}
          >
            {title}
          </h1>

          {/* Meta: date + source + share */}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              alignItems: "center",
              flexWrap: "wrap",
              marginBottom: "2rem",
              paddingBottom: "1.5rem",
              borderBottom: "1px solid #e0dbd1",
            }}
          >
            <span style={{ color: "#888", fontSize: "0.78rem" }}>
              {formatDate(story.date)}
            </span>
            {source && (
              <span style={{ color: "#6b6157", fontSize: "0.78rem" }}>
                Via{" "}
                {sourceUrl ? (
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--ochre)", textDecoration: "none" }}
                  >
                    {source}
                  </a>
                ) : (
                  <span>{source}</span>
                )}
              </span>
            )}

            <span style={{ 
              color: "var(--ochre)", 
              fontSize: "0.65rem", 
              fontWeight: 700, 
              letterSpacing: "0.08em", 
              textTransform: "uppercase",
              background: "rgba(202, 138, 4, 0.08)",
              padding: "0.15rem 0.4rem",
              borderRadius: "2px",
            }}>
              Curated with AI
            </span>

            {/* Share button */}
            <button
              onClick={handleShare}
              style={{
                marginLeft: "auto",
                background: "transparent",
                border: "1px solid #d4cfc6",
                color: "#6b6157",
                padding: "0.3rem 0.75rem",
                fontSize: "0.68rem",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                cursor: "pointer",
                borderRadius: "2px",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
              aria-label="Share this story"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Share
            </button>

            {/* Twitter/X share */}
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(storyUrl)}&text=${encodeURIComponent(title)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "transparent",
                border: "1px solid #d4cfc6",
                color: "#6b6157",
                padding: "0.3rem 0.75rem",
                fontSize: "0.68rem",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                cursor: "pointer",
                borderRadius: "2px",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                textDecoration: "none",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.26 5.636zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Post
            </a>

            {/* WhatsApp share */}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${title} ${storyUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "transparent",
                border: "1px solid #d4cfc6",
                color: "#6b6157",
                padding: "0.3rem 0.75rem",
                fontSize: "0.68rem",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                cursor: "pointer",
                borderRadius: "2px",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                textDecoration: "none",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
          </div>

          {/* Story body */}
          <div
            className="pulse-story-body"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(story.content?.rendered ?? "") }}
          />

          {/* Comments */}
          <CommentThread postId={story.id} initialComments={initialComments} />
        </article>

        {/* Sidebar */}
        {relatedStories.length > 0 && (
          <aside className="pulse-story-sidebar">
            <p
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#999",
                marginBottom: "1rem",
                paddingBottom: "0.75rem",
                borderBottom: "1px solid #e0dbd1",
              }}
            >
              Related Stories
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {relatedStories.map((related) => {
                const relatedArm = related.meta?.pulse_arm_label?.toLowerCase() ?? "";
                const relatedArmStyle = ARM_STYLES[relatedArm] ?? { bg: "#F0F0F0", color: "#333" };
                return (
                  <Link
                    key={related.id}
                    href={`/pulse/${related.slug}`}
                    style={{ textDecoration: "none", display: "block" }}
                  >
                    <article
                      style={{
                        padding: "0.85rem",
                        border: "1px solid #e0dbd1",
                        borderRadius: "2px",
                        background: "#fff",
                        transition: "border-color 0.15s, box-shadow 0.15s",
                      }}
                      className="related-card"
                    >
                      {relatedArm && (
                        <span
                          style={{
                            background: relatedArmStyle.bg,
                            color: relatedArmStyle.color,
                            fontSize: "0.6rem",
                            fontWeight: 600,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            padding: "0.15rem 0.4rem",
                            borderRadius: "2px",
                            display: "inline-block",
                            marginBottom: "0.5rem",
                          }}
                        >
                          {relatedArm}
                        </span>
                      )}
                      <p
                        style={{
                          fontFamily: "var(--font-fraunces), serif",
                          fontSize: "0.88rem",
                          fontWeight: 600,
                          lineHeight: 1.3,
                          color: "var(--ink)",
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {decodeHtml(related.title?.rendered ?? "")}
                      </p>
                      <p style={{ fontSize: "0.68rem", color: "#999", marginTop: "0.4rem" }}>
                        {new Date(related.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </p>
                    </article>
                  </Link>
                );
              })}
            </div>
          </aside>
        )}
      </div>

      <style>{`
        .pulse-story-layout {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 3.5rem 5rem;
          display: flex;
          gap: 3.5rem;
          align-items: flex-start;
        }
        .pulse-story-main {
          flex: 1;
          min-width: 0;
          max-width: 680px;
        }
        .pulse-story-sidebar {
          width: 260px;
          flex-shrink: 0;
          position: sticky;
          top: 5rem;
        }
        .pulse-story-body {
          font-family: var(--font-fraunces), serif;
          font-size: 1rem;
          line-height: 1.7;
          color: var(--ink-soft, #3a342b);
          margin-bottom: 2.5rem;
        }
        .pulse-story-body p {
          margin-bottom: 1.25em;
        }
        .related-card:hover {
          border-color: #c4bdb3 !important;
          box-shadow: 0 2px 6px rgba(20, 17, 13, 0.06);
        }
        @media (max-width: 1024px) {
          .pulse-story-layout {
            padding: 0 2rem 4rem;
            gap: 2.5rem;
          }
        }
        @media (max-width: 900px) {
          .pulse-story-layout {
            flex-direction: column;
            padding: 0 1.5rem 3rem;
          }
          .pulse-story-sidebar {
            width: 100%;
            position: static;
          }
        }
      `}</style>
    </div>
  );
}
