"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";

interface GalleryImage { sourceUrl: string; altText?: string; }
interface Props        { images: GalleryImage[]; productName: string; }

export default function ProductGallery({ images, productName }: Props) {
  const all            = images.slice(0, 8);
  const [active, setActive]   = useState(0);
  const [lbOpen, setLbOpen]   = useState(false);
  const [lbIdx,  setLbIdx]    = useState(0);

  const openLightbox = (idx: number) => { setLbIdx(idx); setLbOpen(true); };
  const closeLightbox = () => setLbOpen(false);
  const lbPrev = useCallback(() => setLbIdx(i => (i - 1 + all.length) % all.length), [all.length]);
  const lbNext = useCallback(() => setLbIdx(i => (i + 1)              % all.length), [all.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lbOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape")      closeLightbox();
      if (e.key === "ArrowLeft")   lbPrev();
      if (e.key === "ArrowRight")  lbNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lbOpen, lbPrev, lbNext]);

  // Prevent body scroll while lightbox is open
  useEffect(() => {
    document.body.style.overflow = lbOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lbOpen]);

  const main = all[active];

  return (
    <>
      <div className="sp-gallery-wrap">
        {/* ── Main image ── */}
        <div
          className="sp-main-image"
          onClick={() => openLightbox(active)}
          role="button"
          tabIndex={0}
          aria-label="View full size"
          onKeyDown={e => e.key === "Enter" && openLightbox(active)}
        >
          {main && (
            <Image
              src={main.sourceUrl}
              alt={main.altText || productName}
              fill
              style={{ objectFit: "cover" }}
              priority
            />
          )}
          <div className="sp-vetted-seal">
            <span className="star">★</span> Vetted Maker
          </div>
          <div className="sp-expand-hint" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M1 1h5M1 1v5M15 1h-5M15 1v5M1 15h5M1 15v-5M15 15h-5M15 15v-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {/* ── Thumbnail strip ── */}
        {all.length > 1 && (
          <div className="sp-thumbnails">
            {all.map((img, i) => (
              <button
                key={i}
                className={`sp-thumb${i === active ? " active" : ""}`}
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1}`}
              >
                <Image
                  src={img.sourceUrl}
                  alt={img.altText || `${productName} ${i + 1}`}
                  fill
                  style={{ objectFit: "cover" }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lbOpen && (
        <div className="sp-lightbox-overlay" onClick={closeLightbox} role="dialog" aria-modal>
          <div className="sp-lightbox" onClick={e => e.stopPropagation()}>
            <button className="sp-lb-close" onClick={closeLightbox} aria-label="Close lightbox">✕</button>

            <div className="sp-lb-stage">
              {all.length > 1 && (
                <button className="sp-lb-arrow sp-lb-prev" onClick={lbPrev} aria-label="Previous image">‹</button>
              )}
              <div className="sp-lb-img-wrap">
                <img
                  src={all[lbIdx].sourceUrl}
                  alt={all[lbIdx].altText || productName}
                  className="sp-lb-img"
                />
              </div>
              {all.length > 1 && (
                <button className="sp-lb-arrow sp-lb-next" onClick={lbNext} aria-label="Next image">›</button>
              )}
            </div>

            <div className="sp-lb-footer">
              <span className="sp-lb-counter">{lbIdx + 1} / {all.length}</span>
              {all.length > 1 && (
                <div className="sp-lb-thumbs">
                  {all.map((img, i) => (
                    <button
                      key={i}
                      className={`sp-lb-thumb${i === lbIdx ? " active" : ""}`}
                      onClick={() => setLbIdx(i)}
                      aria-label={`Go to image ${i + 1}`}
                    >
                      <img src={img.sourceUrl} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
