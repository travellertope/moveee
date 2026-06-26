"use client";

import Link from "next/link";

interface InternalLinkCardProps {
  href: string;
  label: string;
  title: string;
  description?: string;
  image?: string;
}

export default function InternalLinkCard({
  href,
  label,
  title,
  description,
  image,
}: InternalLinkCardProps) {
  return (
    <Link
      href={href}
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
      {image && (
        <div style={{ width: "110px", flexShrink: 0, overflow: "hidden" }}>
          <img
            src={image}
            alt={title}
            style={{ width: "110px", height: "100%", minHeight: "72px", objectFit: "cover", display: "block" }}
            loading="lazy"
          />
        </div>
      )}
      <div style={{ padding: "0.55rem 0.75rem", flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontSize: "0.6rem", color: "var(--gold, #b38238)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.2rem" }}>
          {label}
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
          {title}
        </div>
        {description && (
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
            {description}
          </div>
        )}
      </div>
    </Link>
  );
}
