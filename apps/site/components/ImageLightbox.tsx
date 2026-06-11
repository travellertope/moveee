"use client";

import { useEffect, useRef, useState } from "react";

export default function ImageLightbox({ children }: { children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [alt, setAlt] = useState("");

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const handler = (e: MouseEvent) => {
      const img = (e.target as HTMLElement).closest(".prose-content img") as HTMLImageElement | null;
      if (!img) return;
      e.preventDefault();
      // Prefer data-src (srcset optimised) or fall back to current src
      setSrc(img.getAttribute("data-src") || img.src);
      setAlt(img.alt || "");
    };

    el.addEventListener("click", handler);
    return () => el.removeEventListener("click", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!src) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setSrc(null); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [src]);

  return (
    <div ref={wrapperRef}>
      {children}

      {src && (
        <div
          role="dialog"
          aria-modal
          aria-label="Image preview"
          onClick={() => setSrc(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(14,11,9,.94)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out",
            padding: "40px 24px",
          }}
        >
          <button
            onClick={() => setSrc(null)}
            aria-label="Close"
            style={{
              position: "absolute",
              top: 20, right: 24,
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,.7)",
              fontSize: 32,
              lineHeight: 1,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >×</button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90vw",
              maxHeight: "85vh",
              objectFit: "contain",
              display: "block",
              cursor: "default",
            }}
          />

          {alt && (
            <p style={{
              marginTop: 16,
              color: "rgba(255,255,255,.5)",
              fontSize: 13,
              fontFamily: "'Fraunces', serif",
              fontStyle: "italic",
              textAlign: "center",
              maxWidth: 600,
            }}>
              {alt}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
