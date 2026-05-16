import Link from "next/link";
import type { FeedItem } from "@/lib/unified-feed";

const TYPE_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  pulse:     { label: "Pulse",      bg: "#2a2000",  color: "#D4A847" },
  editorial: { label: "Editorial",  bg: "#1a1a0a",  color: "#C8A84B" },
  happening: { label: "Happening",  bg: "#EEEDFE",  color: "#3C3489" },
  directory: { label: "Directory",  bg: "#E1F5EE",  color: "#085041" },
  quote:     { label: "Quote",      bg: "#1a1520",  color: "#b58dd4" },
};

const ARM_STYLES: Record<string, { bg: string; color: string }> = {
  lifestyle:  { bg: "#E1F5EE", color: "#085041" },
  origins:    { bg: "#FAEEDA", color: "#633806" },
  happenings: { bg: "#EEEDFE", color: "#3C3489" },
  magazine:   { bg: "#FAECE7", color: "#712B13" },
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function FeedCard({ item }: { item: FeedItem }) {
  const typeMeta = TYPE_BADGE[item.type] ?? TYPE_BADGE.pulse;
  const armStyle = item.arm ? (ARM_STYLES[item.arm.toLowerCase()] ?? null) : null;

  if (item.type === "quote") {
    return (
      <article
        style={{
          background: "#161116",
          border: "1px solid #2a2a2a",
          borderRadius: "2px",
          display: "flex",
          flexDirection: "column",
          padding: "1.5rem",
          position: "relative",
        }}
        className="pulse-card"
      >
        {/* Type badge */}
        <span
          style={{
            display: "inline-block",
            background: typeMeta.bg,
            color: typeMeta.color,
            fontSize: "0.6rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "0.2rem 0.5rem",
            borderRadius: "2px",
            marginBottom: "1rem",
            alignSelf: "flex-start",
          }}
        >
          {typeMeta.label}
        </span>

        <p
          style={{
            color: "#e0dbd5",
            fontFamily: "var(--font-fraunces), serif",
            fontSize: "1rem",
            lineHeight: 1.55,
            fontStyle: "italic",
            flex: 1,
            marginBottom: "1rem",
            display: "-webkit-box",
            WebkitLineClamp: 5,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          &ldquo;{item.title}&rdquo;
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#888", fontSize: "0.72rem" }}>
            {item.quoteAuthor && <span style={{ color: "#D4A847" }}>{item.quoteAuthor}</span>}
            {item.quoteSource && item.quoteAuthor && <span style={{ color: "#555" }}> · </span>}
            {item.quoteSource && <span style={{ color: "#666" }}>{item.quoteSource}</span>}
          </span>
          <span style={{ color: "#444", fontSize: "0.7rem" }}>{formatDate(item.date)}</span>
        </div>
      </article>
    );
  }

  return (
    <article
      style={{
        background: "#1a1a1a",
        border: "1px solid #2a2a2a",
        borderRadius: "2px",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        transition: "border-color 0.2s",
      }}
      className="pulse-card"
    >
      <Link
        href={item.href}
        style={{ display: "flex", flexDirection: "column", flex: 1, textDecoration: "none" }}
        aria-label={item.title}
      >
        {/* Image */}
        {item.image && (
          <div
            style={{
              width: "100%",
              aspectRatio: "16/9",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <img
              src={item.image}
              alt={item.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              loading="lazy"
            />
          </div>
        )}

        <div style={{ padding: "1.1rem", display: "flex", flexDirection: "column", flex: 1 }}>
          {/* Badges row */}
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.65rem" }}>
            {/* Type badge */}
            <span
              style={{
                background: typeMeta.bg,
                color: typeMeta.color,
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "0.2rem 0.5rem",
                borderRadius: "2px",
              }}
            >
              {typeMeta.label}
            </span>

            {/* Arm badge (pulse only) */}
            {item.arm && armStyle && (
              <span
                style={{
                  background: armStyle.bg,
                  color: armStyle.color,
                  fontSize: "0.6rem",
                  fontWeight: 600,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "2px",
                }}
              >
                {item.arm}
              </span>
            )}

            {/* Category (editorial) or entryType (directory) or location (happening) */}
            {item.category && (
              <span
                style={{
                  background: "transparent",
                  color: "#888",
                  fontSize: "0.6rem",
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "0.2rem 0.5rem",
                  border: "1px solid #2a2a2a",
                  borderRadius: "2px",
                }}
              >
                {item.category}
              </span>
            )}
            {item.entryType && (
              <span
                style={{
                  background: "transparent",
                  color: "#888",
                  fontSize: "0.6rem",
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "0.2rem 0.5rem",
                  border: "1px solid #2a2a2a",
                  borderRadius: "2px",
                }}
              >
                {item.entryType}
              </span>
            )}
            {item.region && (
              <span
                style={{
                  background: "transparent",
                  color: "#888",
                  fontSize: "0.6rem",
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "0.2rem 0.5rem",
                  border: "1px solid #2a2a2a",
                  borderRadius: "2px",
                }}
              >
                {item.region}
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            style={{
              color: "#f0ece4",
              fontFamily: "var(--font-fraunces), serif",
              fontSize: "1rem",
              fontWeight: 600,
              lineHeight: 1.35,
              marginBottom: "0.55rem",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {item.title}
          </h3>

          {/* Excerpt */}
          {item.excerpt && (
            <p
              style={{
                color: "#999",
                fontSize: "0.8rem",
                lineHeight: 1.5,
                flex: 1,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                marginBottom: "0.85rem",
              }}
            >
              {item.excerpt}
            </p>
          )}

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "auto",
            }}
          >
            <span style={{ color: "#D4A847", fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.04em" }}>
              {item.source || item.location || ""}
            </span>
            <span style={{ color: "#555", fontSize: "0.68rem" }}>{formatDate(item.date)}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
