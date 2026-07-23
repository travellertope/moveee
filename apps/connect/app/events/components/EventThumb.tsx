"use client";

import { useState } from "react";
import Image from "next/image";
import { getCategoryGradient } from "../utils/categoryImages";

function initials(title: string): string {
  const words = title
    .replace(/<[^>]+>/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

interface EventThumbProps {
  src?: string | null;
  title: string;
  categorySlug?: string;
  /** Font size for the initials fallback — tune per usage (small row thumb vs large hero). */
  fontSize?: number;
  priority?: boolean;
  sizes?: string;
}

/**
 * Drop-in replacement for a plain `<Image fill>` event thumbnail. Fills its
 * positioned parent either way — the parent just needs `position: relative`
 * (or similar) and its own sizing, same as the raw <Image> it replaces.
 *
 * Handles both event-image failure modes seen in production, especially on
 * AI-populated events: no image URL at all, and a URL that 404s/fails to
 * load (onError). Either way it falls back to the event title's initials
 * over a category-tinted gradient, instead of a broken-image icon or a
 * stock category photo.
 */
export default function EventThumb({ src, title, categorySlug, fontSize = 15, priority, sizes }: EventThumbProps) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <Image
        src={src}
        alt={title}
        fill
        priority={priority}
        sizes={sizes}
        style={{ objectFit: "cover" }}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: getCategoryGradient(categorySlug),
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-fraunces, Georgia), serif",
          fontWeight: 700,
          fontSize,
          letterSpacing: "0.02em",
          color: "rgba(255,255,255,0.92)",
        }}
      >
        {initials(title)}
      </span>
    </div>
  );
}
