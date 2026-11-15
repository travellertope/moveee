"use client";

import { useEffect, useRef } from "react";
import "./HomepageHero.css";

export interface HeroSlide {
  image: string;
  alt: string;
}

interface Props {
  slides: HeroSlide[];
}

export default function HomepageHero({ slides }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const slideEls = Array.from(container.querySelectorAll<HTMLElement>(".hphero-slide"));
    const dotEls = Array.from(container.querySelectorAll<HTMLElement>(".hphero-dot"));
    if (slideEls.length < 2) return;

    let currentIdx = 0;

    const goTo = (nextIdx: number) => {
      slideEls[currentIdx].classList.remove("active");
      dotEls[currentIdx]?.classList.remove("active");
      currentIdx = nextIdx;
      // Replace img node so the CSS animation restarts
      const nextSlide = slideEls[currentIdx];
      const img = nextSlide.querySelector("img");
      if (img) {
        const clone = img.cloneNode(true) as HTMLImageElement;
        img.replaceWith(clone);
      }
      slideEls[currentIdx].classList.add("active");
      dotEls[currentIdx]?.classList.add("active");
    };

    const timer = setInterval(() => {
      goTo((currentIdx + 1) % slideEls.length);
    }, 7000);

    // Dot click handlers
    dotEls.forEach((dot, i) => {
      dot.addEventListener("click", () => {
        clearInterval(timer);
        goTo(i);
      });
    });

    return () => clearInterval(timer);
  }, []);

  if (slides.length === 0) return null;

  return (
    <section className="hphero" ref={containerRef}>
      <div className="hphero-slides">
        {slides.map((slide, i) => (
          <div key={i} className={`hphero-slide${i === 0 ? " active" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={slide.image} alt={slide.alt} />
          </div>
        ))}
      </div>

      <div className="hphero-overlay" />

      <div className="hphero-body">
        <h1>Your social culture discovery and diary</h1>
        <p className="hphero-sub">
          The Moveee is your social culture discovery and diary. Earn redeemable rewards for
          engaging in the film, music, experiences, and books you enjoy.
        </p>
        <div className="hphero-ctas">
          <a href="/connect/register" className="hphero-cta hphero-cta--primary">Join free</a>
          <a href="/discover" className="hphero-cta hphero-cta--ghost">Explore culture</a>
        </div>
      </div>

      {slides.length > 1 && (
        <div className="hphero-dots" role="tablist" aria-label="Hero slides">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              className={`hphero-dot${i === 0 ? " active" : ""}`}
              aria-label={`Slide ${i + 1}`}
              aria-selected={i === 0}
            />
          ))}
        </div>
      )}
    </section>
  );
}
