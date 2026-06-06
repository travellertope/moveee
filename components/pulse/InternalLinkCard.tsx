"use client";

import Link from "next/link";

interface InternalLinkCardProps {
  href: string;
  label: string;         // e.g. "Moveee Magazine" or "Culture Directory"
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
      {image && (
        <div style={{ width: "100%", maxHeight: "160px", overflow: "hidden" }}>
          <img
            src={image}
            alt={title}
            style={{ width: "100%", height: "160px", objectFit: "cover", display: "block" }}
            loading="lazy"
          />
        </div>
      )}
      <div style={{ padding: "0.6rem 0.75rem" }}>
        <div style={{ fontSize: "0.62rem", color: "#b38238", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.25rem" }}>
          {label}
        </div>
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
          {title}
        </div>
        {description && (
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
            {description}
          </div>
        )}
      </div>
    </Link>
  );
}
