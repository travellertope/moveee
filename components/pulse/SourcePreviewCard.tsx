"use client";

interface SourcePreviewCardProps {
  goUrl: string;      // /go/[id]
  sourceName: string;
  sourceUrl: string;  // original URL for displaying domain
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
  const hasOg = !!(ogTitle || ogImage);

  return (
    <a
      href={goUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      style={{
        display: "block",
        textDecoration: "none",
        border: "1px solid #e8e2d8",
        borderRadius: "8px",
        overflow: "hidden",
        marginTop: "0.65rem",
        background: "#faf8f4",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#c5b89a")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#e8e2d8")}
    >
      {hasOg && ogImage && (
        <div style={{ width: "100%", maxHeight: "160px", overflow: "hidden" }}>
          <img
            src={ogImage}
            alt={ogTitle || sourceName}
            style={{ width: "100%", height: "160px", objectFit: "cover", display: "block" }}
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      )}
      <div style={{ padding: "0.6rem 0.75rem" }}>
        <div style={{ fontSize: "0.62rem", color: "#b38238", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.25rem" }}>
          {sourceName || domain(sourceUrl)}
          <span style={{ color: "#c8bfb0", fontWeight: 400, marginLeft: "0.35rem" }}>· {domain(sourceUrl)}</span>
        </div>
        {(ogTitle || !hasOg) && (
          <div style={{
            color: "#14110d",
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
        )}
        {ogDescription && (
          <div style={{
            color: "#7a6f5c",
            fontSize: "0.74rem",
            lineHeight: 1.45,
            marginTop: "0.2rem",
            display: "-webkit-box",
            WebkitLineClamp: 2,
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
