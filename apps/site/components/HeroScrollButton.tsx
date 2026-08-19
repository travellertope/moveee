"use client";

// Scrolls to whatever section follows .hero-full — a plain sibling lookup
// rather than a hardcoded target, so it stays correct if the homepage's
// section order ever changes. Its own click must never trigger the
// surrounding article link's navigation (see FullBleedHero.tsx — the link
// layer uses display:contents so this button can sit as a true DOM sibling
// of it, not nested inside the anchor).
export default function HeroScrollButton() {
  function handleClick() {
    const hero = document.querySelector(".hero-full");
    const next = hero?.nextElementSibling;
    next?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <button type="button" className="hero-full-scroll" onClick={handleClick} aria-label="Scroll to next section">
      <span aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  );
}
