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
    if (slideEls.length < 2) return;

    let currentIdx = 0;

    const goTo = (nextIdx: number) => {
      slideEls[currentIdx].classList.remove("active");
      currentIdx = nextIdx;
      // Replace img node so the CSS animation restarts cleanly
      const nextSlide = slideEls[currentIdx];
      const img = nextSlide.querySelector("img");
      if (img) {
        const clone = img.cloneNode(true) as HTMLImageElement;
        img.replaceWith(clone);
      }
      slideEls[currentIdx].classList.add("active");
    };

    const timer = setInterval(() => {
      goTo((currentIdx + 1) % slideEls.length);
    }, 7000);

    return () => clearInterval(timer);
  }, []);

  if (slides.length === 0) return null;

  return (
    <section className="hphero" ref={containerRef} data-header-zone="dark">
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
        <h1>
          Discover, review &amp; earn{" "}
          <em className="hphero-h1-reward">rewards</em>
          {" "}for the culture you live
        </h1>
        <p className="hphero-sub">
          The Moveee is your social culture discovery and diary. Earn redeemable rewards for
          engaging in the film, music, experiences, and books you enjoy.
        </p>
        <div className="hphero-ctas">
          <a href="/connect/register" className="hphero-cta hphero-cta--primary">Start your diary — it&apos;s free</a>
          <a href="/#mainMasthead" className="hphero-cta hphero-cta--ghost">Explore the magazine</a>
        </div>
      </div>

    </section>
  );
}
