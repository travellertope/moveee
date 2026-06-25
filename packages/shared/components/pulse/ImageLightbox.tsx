"use client";

import { useEffect, useRef, useState } from "react";

const SWIPE_THRESHOLD = 50;

export default function ImageLightbox({
  images,
  initialIndex = 0,
  alt = "",
  onClose,
}: {
  images: string[];
  initialIndex?: number;
  alt?: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);
  const count = images.length;

  const goPrev = () => setIndex((i) => (i - 1 + count) % count);
  const goNext = () => setIndex((i) => (i + 1) % count);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && count > 1) goPrev();
      else if (e.key === "ArrowRight" && count > 1) goNext();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, count]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || count <= 1) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > SWIPE_THRESHOLD) goPrev();
    else if (delta < -SWIPE_THRESHOLD) goNext();
    touchStartX.current = null;
  }

  return (
    <div
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.88)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
        cursor: "zoom-out",
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          position: "absolute", top: "1rem", right: "1rem",
          background: "rgba(255,255,255,0.12)", border: "none",
          borderRadius: "50%", width: "36px", height: "36px",
          color: "#fff", fontSize: "1rem", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        ✕
      </button>

      {count > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            aria-label="Previous image"
            style={{
              position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)",
              background: "rgba(255,255,255,0.12)", border: "none",
              borderRadius: "50%", width: "44px", height: "44px",
              color: "#fff", fontSize: "1.3rem", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ‹
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            aria-label="Next image"
            style={{
              position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)",
              background: "rgba(255,255,255,0.12)", border: "none",
              borderRadius: "50%", width: "44px", height: "44px",
              color: "#fff", fontSize: "1.3rem", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ›
          </button>
          <div
            style={{
              position: "absolute", bottom: "1rem", left: "50%", transform: "translateX(-50%)",
              color: "rgba(255,255,255,0.8)", fontSize: "0.78rem",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {index + 1} / {count}
          </div>
        </>
      )}

      {/* Image — stop click propagating so clicking image itself doesn't close */}
      <img
        src={images[index]}
        alt={alt}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: "100%",
          maxHeight: "90vh",
          objectFit: "contain",
          borderRadius: "4px",
          cursor: "default",
          boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
        }}
      />
    </div>
  );
}
