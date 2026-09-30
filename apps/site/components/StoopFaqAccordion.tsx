"use client";

import { useState } from "react";

interface FaqEntry {
  q: string;
  a: string;
}

const COLUMN_ONE: FaqEntry[] = [
  {
    q: "Does it cost anything?",
    a: "No. Stoop is open to all Moveee members, including free membership. There is nothing to pay for.",
  },
  {
    q: "Do I have to host?",
    a: "No. Most members never host. People host because they offer to, and they can hand it to someone else at any time.",
  },
  {
    q: "Will people see my address?",
    a: "Only if you host, and only if you choose to share it. By default people browsing see the area, not the address.",
  },
];

const COLUMN_TWO: FaqEntry[] = [
  {
    q: "What if there is no group near me?",
    a: "You can create one. It stays closed until four people join. You can also join a group nearby that still has space.",
  },
  {
    q: "Do I have to go every week?",
    a: "No. Go when you can — missing a week changes nothing.",
  },
  {
    q: "What happens between meetings?",
    a: "Each group has its own space in the app, where members post and plan until the next meeting.",
  },
];

/**
 * The FAQ section's expand/collapse — a plain per-column open-index toggle
 * (not a single accordion-wide state), so a question in each column can be
 * open at once, same as the approved mockup. CSS does the actual grid-rows
 * animation (see .stp-faq-body's `grid-template-rows: 0fr → 1fr` in
 * stoop.css) — this component only ever toggles the `open` class.
 */
function FaqColumn({ entries, defaultOpen }: { entries: FaqEntry[]; defaultOpen: number | null }) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpen);

  return (
    <div>
      {entries.map((entry, i) => {
        const isOpen = openIndex === i;
        return (
          <div className={`stp-faq-item${isOpen ? " open" : ""}`} key={entry.q}>
            <button
              type="button"
              className="stp-faq-q"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : i)}
            >
              {entry.q}
              <span className="stp-faq-icon" aria-hidden="true" />
            </button>
            <div className="stp-faq-body" role="region">
              <div className="stp-faq-body-inner-wrap">
                <p className="stp-faq-body-inner">{entry.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function StoopFaqAccordion() {
  return (
    <div className="stp-faq-grid">
      <FaqColumn entries={COLUMN_ONE} defaultOpen={0} />
      <FaqColumn entries={COLUMN_TWO} defaultOpen={null} />
    </div>
  );
}
