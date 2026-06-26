import Link from "next/link";
import type { WpPulseStory } from "@/lib/pulse-wordpress";
import { decodeHtml } from "@/lib/decode-html";

const ARM_STYLES: Record<string, { bg: string; color: string }> = {
  lifestyle:  { bg: "#E1F5EE", color: "#085041" },
  origins:    { bg: "#FAEEDA", color: "#633806" },
  happenings: { bg: "#EEEDFE", color: "#3C3489" },
  magazine:   { bg: "#FAECE7", color: "#712B13" },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface PulseCardProps {
  story: WpPulseStory;
}

export default function PulseCard({ story }: PulseCardProps) {
  const arm = story.meta?.pulse_arm_label?.toLowerCase() ?? "";
  const region = story.meta?.pulse_region_label ?? "";
  const source = story.meta?.pulse_source ?? "";
  const armStyle = ARM_STYLES[arm] ?? { bg: "#F0F0F0", color: "#333" };

  const title = decodeHtml(story.title?.rendered ?? "");
  const excerpt = decodeHtml(story.excerpt?.rendered ?? "");

  const commentCount =
    Number(story._embedded?.replies?.[0]?.[0]?.count ?? story.comment_count ?? 0);

  return (
    <article
      style={{
        background: "var(--paper, #fff)",
        border: "1px solid var(--rule, #e0dbd1)",
        borderRadius: "2px",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
      className="pulse-card group"
    >
      <Link
        href={`/pulse/${story.slug}`}
        style={{ display: "flex", flexDirection: "column", flex: 1, padding: "1.25rem", textDecoration: "none" }}
        aria-label={title}
      >
        {/* Badges */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          {arm && (
            <span
              style={{
                background: armStyle.bg,
                color: armStyle.color,
                fontSize: "0.65rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "0.2rem 0.5rem",
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
                color: "var(--mute, #6b6157)",
                fontSize: "0.65rem",
                fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "0.2rem 0.5rem",
                border: "1px solid var(--rule, #d4cfc6)",
                borderRadius: "2px",
              }}
            >
              {region}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          style={{
            color: "var(--ink)",
            fontFamily: "var(--font-fraunces), serif",
            fontSize: "1.05rem",
            fontWeight: 600,
            lineHeight: 1.35,
            marginBottom: "0.6rem",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {title}
        </h3>

        {/* Excerpt */}
        <p
          style={{
            color: "var(--mute, #6b6157)",
            fontSize: "0.82rem",
            lineHeight: 1.55,
            flex: 1,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            marginBottom: "1rem",
          }}
        >
          {excerpt}
        </p>

        {/* Footer: source + date */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "auto",
          }}
        >
          {source && (
            <span style={{ color: "var(--ochre)", fontSize: "0.7rem", fontWeight: 500, letterSpacing: "0.04em" }}>
              {source}
            </span>
          )}
          <span style={{ color: "var(--mute, #999)", fontSize: "0.7rem" }}>{formatDate(story.date)}</span>
        </div>
      </Link>

      {/* Comment icon */}
      <Link
        href={`/pulse/${story.slug}#comments`}
        style={{
          position: "absolute",
          bottom: "1rem",
          right: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.3rem",
          color: "var(--mute, #aaa)",
          textDecoration: "none",
          fontSize: "0.72rem",
          zIndex: 1,
        }}
        aria-label={`${commentCount} comment${commentCount !== 1 ? "s" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span>{commentCount}</span>
      </Link>
    </article>
  );
}
