"use client";

import { useEffect, useRef, useState } from "react";

export interface TocHeading {
  id: string;
  text: string;
}

/**
 * Floating table-of-contents button + panel for the article page.
 *
 * Replaces the old left-hand `.ar-toc` sidebar column (removed so the prose
 * column can take that width) and mirrors the mobile app's TOC pattern in
 * `apps/mobile/src/screens/magazine/ArticleScreen.tsx` — a small fixed FAB
 * that opens a contents sheet.
 *
 * The scroll-spy that used to live in `TocScrollSpy.tsx` is folded in here:
 * that component tracked the active heading by toggling a class on
 * `.ar-toc a[href^='#']` elements, which no longer works now that the links
 * only exist in the DOM while the panel is open. Active state is React state
 * driven off the `headings` prop instead, so it stays correct across
 * open/close cycles.
 */
export default function ArticleToc({ headings }: { headings: TocHeading[] }) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  const headingKey = headings.map((h) => h.id).join("|");

  useEffect(() => {
    const els = headings
      .map((h) => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Topmost currently-intersecting heading wins
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId((visible[0].target as HTMLElement).id);
          return;
        }
        // Nothing intersecting — fall back to the last heading above the viewport
        const above = els.filter((h) => h.getBoundingClientRect().top < 0).at(-1);
        if (above) setActiveId(above.id);
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 }
    );

    els.forEach((el) => observer.observe(el));

    const firstBelow = els.find((h) => h.getBoundingClientRect().top > 0);
    const initial = firstBelow
      ? els[els.indexOf(firstBelow) - 1]
      : els[els.length - 1];
    if (initial) setActiveId(initial.id);

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headingKey]);

  // Escape + outside-click close. The scrim only captures taps on mobile
  // (it's display:none at desktop widths), so desktop needs this listener.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (fabRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  if (headings.length === 0) return null;

  return (
    <>
      {open && (
        <div className="ar-toc-scrim" onClick={() => setOpen(false)} aria-hidden />
      )}

      {open && (
        <div
          className="ar-toc-panel"
          ref={panelRef}
          role="dialog"
          aria-label="Table of contents"
        >
          <div className="ar-toc-panel-head">
            <span className="ar-toc-panel-label">Contents</span>
            <button
              type="button"
              className="ar-toc-panel-close"
              onClick={() => setOpen(false)}
              aria-label="Close contents"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M6 18L18 6M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          <ol className="ar-toc-list">
            {headings.map((h, i) => (
              <li key={h.id}>
                <a
                  href={`#${h.id}`}
                  className={h.id === activeId ? "active" : undefined}
                  onClick={() => setOpen(false)}
                >
                  <span className="ar-toc-num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="ar-toc-text">{h.text}</span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}

      <button
        type="button"
        ref={fabRef}
        className={`ar-toc-fab${open ? " ar-toc-fab--open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Table of contents"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </>
  );
}
