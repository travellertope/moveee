"use client";

interface SourcePreviewCardProps {
  goUrl: string;
  sourceName: string;
  sourceUrl: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

function domain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function SourcePreviewCard({
  goUrl,
  sourceName,
  sourceUrl,
  ogTitle,
  ogDescription,
  ogImage,
}: SourcePreviewCardProps) {
  return (
    <a
      href={goUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      style={{
        display: "flex",
        alignItems: "stretch",
        textDecoration: "none",
        border: "1px solid var(--rule, #e8e2d8)",
        borderRadius: "8px",
        overflow: "hidden",
        marginTop: "0.65rem",
        background: "var(--paper-warm, #faf8f4)",
        transition: "border-color 0.15s",
        minHeight: "72px",
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--rule-dark, #c5b89a)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--rule, #e8e2d8)")}
    >
      {ogImage && (
        <div style={{ width: "110px", flexShrink: 0, overflow: "hidden" }}>
          <img
            src={ogImage}
            alt={ogTitle || sourceName}
            style={{ width: "110px", height: "100%", minHeight: "72px", objectFit: "cover", display: "block" }}
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).parentElement!.style.display = "none"; }}
          />
        </div>
      )}
      <div style={{ padding: "0.55rem 0.75rem", flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontSize: "0.6rem", color: "var(--gold, #b38238)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.2rem" }}>
          {sourceName || domain(sourceUrl)}
          <span style={{ color: "var(--rule-dark, #c8bfb0)", fontWeight: 400, marginLeft: "0.3rem" }}>· {domain(sourceUrl)}</span>
        </div>
        <div style={{
          color: "var(--ink, #14110d)",
          fontSize: "0.82rem",
          fontWeight: 600,
          lineHeight: 1.35,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {ogTitle || `Read on ${sourceName || domain(sourceUrl)} →`}
        </div>
        {ogDescription && (
          <div style={{
            color: "var(--mute, #7a6f5c)",
            fontSize: "0.72rem",
            lineHeight: 1.4,
            marginTop: "0.15rem",
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {ogDescription}
          </div>
        )}
      </div>
    </a>
  );
}
