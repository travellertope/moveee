"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { TEMPLATES, TEMPLATE_REP_GATE, REVIEW_FAMILY, REVIEW_DEFAULT, type TemplateType } from "./SubmitPost";

// Fuller label + one-line description for the picker tile — distinct from
// TEMPLATES' compact chip labels ("Book", "Music", "Film") which stay as-is
// for the in-composer pill row (CategoryPage.tsx's inline usage).
const MODAL_META: Record<TemplateType, { label: string; desc: string }> = {
  post:                { label: "Update",             desc: "Share a thought or moment" },
  "hidden-gem":        { label: "Place",               desc: "Spotlight a place worth knowing" },
  "cultural-take":     { label: "Cultural Take",      desc: "Share a cultural opinion" },
  "food-review":       { label: "Food Review",        desc: "Rate a dish or food item" },
  "book-review":       { label: "Book Review",        desc: "Rate a book you've read" },
  "music-review":      { label: "Music Review",       desc: "Rate an album you've heard" },
  "film-review":       { label: "Film Review",        desc: "Rate a film you've seen" },
  "creative-showcase": { label: "Creative Showcase",  desc: "Share your creative work" },
  quote:               { label: "Quote",              desc: "Share a quote that moved you" },
  poll:                { label: "Poll",               desc: "Ask the community something" },
  itinerary:           { label: "Route",              desc: "Share a travel route" },
  event:               { label: "Event",              desc: "Announce something happening" },
};

// Grid items: REVIEW_FAMILY (Hidden Gem/Food/Music/Book/Film Review) collapse
// into one synthetic "review" tile, inserted at the position of the first
// review-family member so it still lands in a sensible spot in the grid.
// Picking it opens the composer on REVIEW_DEFAULT — the in-form tab row
// (SubmitPost.tsx's composer-review-tabs) is where the user actually picks
// Place/Food/Music/Book/Film.
type GridItem = TemplateType | "review";
const GRID_ITEMS: GridItem[] = (() => {
  const items: GridItem[] = [];
  let reviewInserted = false;
  for (const t of TEMPLATES) {
    if (REVIEW_FAMILY.includes(t.slug)) {
      if (!reviewInserted) { items.push("review"); reviewInserted = true; }
    } else {
      items.push(t.slug);
    }
  }
  return items;
})();

// Same brand colors already used elsewhere for these templates' badges
// (Book Review purple, Music Review teal, Film Review blue, Quote purple).
const MODAL_ACCENT: Partial<Record<TemplateType, string>> = {
  "book-review":  "#6B48A8",
  "music-review": "#0D7377",
  "film-review":  "#2B4C7E",
  quote:          "#7A4DA0",
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (template: TemplateType) => void;
  /** Shown as a leading "Continue Draft" tile when a saved draft exists. */
  hasDraft?: boolean;
  onSelectDraft?: () => void;
}

export default function TypePickerModal({ open, onClose, onSelect, hasDraft, onSelectDraft }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  // Set the instant a tile is tapped and kept true until the page we're
  // navigating to actually mounts (the caller no longer closes the modal
  // itself — see PulseFeed.tsx/PostNewClient.tsx) — without this a template
  // pick looked like a dead click while the route transition was in flight.
  const [selecting, setSelecting] = useState<TemplateType | "draft" | null>(null);

  useEffect(() => {
    if (open) {
      // Warms /post/new's route chunk + RSC payload the moment the modal
      // opens, so the actual pick below has less work left to do.
      router.prefetch("/post/new");
      setSelecting(null);
    }
  }, [open, router]);

  if (!open) return null;

  const user = session?.user as any;
  const isPro = user?.tier === "patron";
  const reputation = Number(user?.reputation ?? 0);

  function meetsGate(t: TemplateType): boolean {
    const gate = TEMPLATE_REP_GATE[t];
    if (!gate) return true;
    return isPro || reputation >= gate.minRep;
  }

  function pick(t: TemplateType) {
    if (selecting) return;
    setSelecting(t);
    onSelect(t);
  }
  function pickDraft() {
    if (selecting || !onSelectDraft) return;
    setSelecting("draft");
    onSelectDraft();
  }

  return (
    <div className="type-picker-modal" role="dialog" aria-modal="true" aria-label="New post">
      <div className="type-picker-scrim" onClick={() => { if (!selecting) onClose(); }} />
      <div className="type-picker-card">
        <div className="type-picker-head">
          <span>New post</span>
          <button type="button" className="type-picker-close" onClick={onClose} aria-label="Close" disabled={!!selecting}>✕</button>
        </div>
        <div className="type-picker-body">
          <p className="composer-field-label" style={{ marginBottom: "10px" }}>What are you posting?</p>
          <div className="type-picker-grid">
            {hasDraft && onSelectDraft && (
              <button
                type="button"
                className={`type-picker-tile type-picker-tile--draft${selecting && selecting !== "draft" ? " type-picker-tile--dimmed" : ""}`}
                onClick={pickDraft}
                disabled={!!selecting}
              >
                {selecting === "draft" ? (
                  <span className="type-picker-tile-spinner" aria-hidden />
                ) : (
                  <span className="type-picker-tile-em" aria-hidden>📄</span>
                )}
                <b>Continue Draft</b>
                <span className="type-picker-tile-desc">Pick up where you left off</span>
              </button>
            )}
            {GRID_ITEMS.map(item => {
              if (item === "review") {
                const isSelecting = selecting != null && REVIEW_FAMILY.includes(selecting as TemplateType);
                return (
                  <button
                    key="review"
                    type="button"
                    className={`type-picker-tile${selecting && !isSelecting ? " type-picker-tile--dimmed" : ""}`}
                    onClick={() => pick(REVIEW_DEFAULT)}
                    disabled={!!selecting}
                  >
                    {isSelecting ? (
                      <span className="type-picker-tile-spinner" aria-hidden />
                    ) : (
                      <span className="type-picker-tile-em" aria-hidden>⭐</span>
                    )}
                    <b>Review</b>
                    <span className="type-picker-tile-desc">Rate a place, dish, album, book, or film</span>
                  </button>
                );
              }
              const t = TEMPLATES.find(x => x.slug === item)!;
              const gate = TEMPLATE_REP_GATE[t.slug];
              const locked = gate ? !meetsGate(t.slug) : false;
              const meta = MODAL_META[t.slug];
              const accent = MODAL_ACCENT[t.slug];
              const isSelecting = selecting === t.slug;
              return (
                <button
                  key={t.slug}
                  type="button"
                  className={`type-picker-tile${locked ? " type-picker-tile--locked" : ""}${selecting && !isSelecting ? " type-picker-tile--dimmed" : ""}`}
                  style={accent ? ({ "--tp-accent": accent } as React.CSSProperties) : undefined}
                  onClick={() => { if (!locked) pick(t.slug); }}
                  disabled={!!selecting}
                  title={locked && gate ? `${gate.tierLabel} or Pro required` : undefined}
                >
                  {isSelecting ? (
                    <span className="type-picker-tile-spinner" aria-hidden />
                  ) : (
                    <span className="type-picker-tile-em" aria-hidden>{t.emoji}</span>
                  )}
                  <b>{meta.label}</b>
                  <span className="type-picker-tile-desc">{meta.desc}</span>
                  {locked && !isSelecting && <span className="type-picker-tile-lock" aria-hidden>🔒</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
