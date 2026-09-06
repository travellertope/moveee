"use client";

import { useState } from "react";
import Link from "next/link";

export interface LiteraryHeroSlide {
  slug: string;
  title: string;
  author: string;
  excerpt: string;
  genreLabel: string;
  imageUrl: string | null;
}

// Real carousel over the N most recent pieces (page.tsx supplies the data
// — this component only owns which slide is showing). Falls back to a
// single, arrow-less slide when there's only one piece to show.
export default function LiteraryHeroCarousel({ slides }: { slides: LiteraryHeroSlide[] }) {
  const [index, setIndex] = useState(0);
  if (slides.length === 0) return null;
  const slide = slides[index];

  function go(delta: number) {
    setIndex((i) => (i + delta + slides.length) % slides.length);
  }

  return (
    <div className="lit-wrap lit-hero">
      <div className="lit-hero-row">
        <div className="lit-hero-frame">
          {slide.imageUrl ? (
            <img className="lit-hero-img" src={slide.imageUrl} alt="" />
          ) : (
            <div className="lit-hero-img lit-hero-img--placeholder" aria-hidden="true" />
          )}
        </div>
        <div className="lit-hero-body">
          <div className="lit-tag">{slide.genreLabel}</div>
          <Link href={`/literary/${slide.slug}`}>
            <h1 className="lit-hero-title" dangerouslySetInnerHTML={{ __html: slide.title }} />
          </Link>
          <div className="lit-hero-byline">By {slide.author}</div>
          {slide.excerpt && <p className="lit-hero-standfirst">{slide.excerpt}</p>}
          {slides.length > 1 && (
            <div className="lit-hero-dots">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Show piece ${i + 1}`}
                  className={i === index ? "is-active" : undefined}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          )}
        </div>
        {slides.length > 1 && (
          <>
            <button type="button" className="lit-hero-arrow lit-hero-arrow--l" aria-label="Previous piece" onClick={() => go(-1)}>
              ‹
            </button>
            <button type="button" className="lit-hero-arrow lit-hero-arrow--r" aria-label="Next piece" onClick={() => go(1)}>
              ›
            </button>
          </>
        )}
      </div>
    </div>
  );
}
