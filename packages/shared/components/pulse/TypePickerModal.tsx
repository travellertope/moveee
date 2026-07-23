"use client";

import { useSession } from "next-auth/react";
import { TEMPLATES, TEMPLATE_REP_GATE, type TemplateType } from "./SubmitPost";

// Fuller label + one-line description for the picker tile — distinct from
// TEMPLATES' compact chip labels ("Book", "Music", "Film") which stay as-is
// for the in-composer pill row (CategoryPage.tsx's inline usage).
const MODAL_META: Record<TemplateType, { label: string; desc: string }> = {
  post:                { label: "Update",             desc: "Share a thought or moment" },
  "hidden-gem":        { label: "Hidden Gem",         desc: "Spotlight a place worth knowing" },
  "cultural-take":     { label: "Cultural Take",      desc: "Share a cultural opinion" },
  "food-review":       { label: "Food Review",        desc: "Rate a dish or restaurant" },
  "book-review":       { label: "Book Review",        desc: "Rate a book you've read" },
  "music-review":      { label: "Music Review",       desc: "Rate an album you've heard" },
  "film-review":       { label: "Film Review",        desc: "Rate a film you've seen" },
  "creative-showcase": { label: "Creative Showcase",  desc: "Share your creative work" },
  quote:               { label: "Quote",              desc: "Share a quote that moved you" },
  poll:                { label: "Poll",               desc: "Ask the community something" },
  itinerary:           { label: "Route",              desc: "Share a travel route" },
  event:               { label: "Event",              desc: "Announce something happening" },
};

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
  if (!open) return null;

  const user = session?.user as any;
  const isPro = user?.tier === "patron";
  const reputation = Number(user?.reputation ?? 0);

  function meetsGate(t: TemplateType): boolean {
    const gate = TEMPLATE_REP_GATE[t];
    if (!gate) return true;
    return isPro || reputation >= gate.minRep;
  }

  return (
    <div className="type-picker-modal" role="dialog" aria-modal="true" aria-label="New post">
      <div className="type-picker-scrim" onClick={onClose} />
      <div className="type-picker-card">
        <div className="type-picker-head">
          <span>New post</span>
          <button type="button" className="type-picker-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="type-picker-body">
          <p className="composer-field-label" style={{ marginBottom: "10px" }}>What are you posting?</p>
          <div className="type-picker-grid">
            {hasDraft && onSelectDraft && (
              <button type="button" className="type-picker-tile type-picker-tile--draft" onClick={onSelectDraft}>
                <span className="type-picker-tile-em" aria-hidden>📄</span>
                <b>Continue Draft</b>
                <span className="type-picker-tile-desc">Pick up where you left off</span>
              </button>
            )}
            {TEMPLATES.map(t => {
              const gate = TEMPLATE_REP_GATE[t.slug];
              const locked = gate ? !meetsGate(t.slug) : false;
              const meta = MODAL_META[t.slug];
              const accent = MODAL_ACCENT[t.slug];
              return (
                <button
                  key={t.slug}
                  type="button"
                  className={`type-picker-tile${locked ? " type-picker-tile--locked" : ""}`}
                  style={accent ? ({ "--tp-accent": accent } as React.CSSProperties) : undefined}
                  onClick={() => { if (!locked) onSelect(t.slug); }}
                  title={locked && gate ? `${gate.tierLabel} or Pro required` : undefined}
                >
                  <span className="type-picker-tile-em" aria-hidden>{t.emoji}</span>
                  <b>{meta.label}</b>
                  <span className="type-picker-tile-desc">{meta.desc}</span>
                  {locked && <span className="type-picker-tile-lock" aria-hidden>🔒</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
