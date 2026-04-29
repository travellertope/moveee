"use client";

import Link from "next/link";
import type { WpPulseStory, WpComment } from "@/lib/pulse-wordpress";
import { decodeHtml } from "@/lib/decode-html";
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
}

export default function PulseStory({ story, initialComments }: PulseStoryProps) {
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
    <div
      style={{
        background: "#0d0d0d",
        minHeight: "100vh",
        color: "#e0dcd4",
        padding: "0 1.5rem 4rem",
      }}
    >
      {/* Back link */}
      <div style={{ paddingTop: "2rem", paddingBottom: "1.5rem" }}>
        <Link
          href="/pulse"
          style={{
            color: "#D4A847",
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

      <article style={{ maxWidth: "680px", margin: "0 auto" }}>
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
                color: "#888",
                fontSize: "0.65rem",
                fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "0.25rem 0.6rem",
                border: "1px solid #2a2a2a",
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
            fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
            fontWeight: 700,
            lineHeight: 1.2,
            color: "#f0ece4",
            marginBottom: "1rem",
          }}
        >
          {title}
        </h1>

        {/* Meta: date + source */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: "2rem",
            paddingBottom: "1.5rem",
            borderBottom: "1px solid #1e1e1e",
          }}
        >
          <span style={{ color: "#555", fontSize: "0.78rem" }}>
            {formatDate(story.date)}
          </span>
          {source && (
            <span style={{ color: "#444", fontSize: "0.78rem" }}>
              Via{" "}
              {sourceUrl ? (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#D4A847", textDecoration: "none" }}
                >
                  {source}
                </a>
              ) : (
                <span style={{ color: "#888" }}>{source}</span>
              )}
            </span>
          )}

          {/* Share button */}
          <button
            onClick={handleShare}
            style={{
              marginLeft: "auto",
              background: "transparent",
              border: "1px solid #2a2a2a",
              color: "#888",
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
              border: "1px solid #2a2a2a",
              color: "#888",
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
              border: "1px solid #2a2a2a",
              color: "#888",
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
          style={{
            fontSize: "1rem",
            lineHeight: 1.75,
            color: "#c8c4bc",
            marginBottom: "2rem",
          }}
          dangerouslySetInnerHTML={{ __html: story.content?.rendered ?? "" }}
        />

        {/* Comments */}
        <CommentThread postId={story.id} initialComments={initialComments} />
      </article>
    </div>
  );
}
