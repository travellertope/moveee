"use client";

import { useState } from "react";

interface FaqItem {
  q: string;
  a: string;
}

const FAQ_LEFT: FaqItem[] = [
  {
    q: "Does it cost anything?",
    a: "No. The Stoop is open to all Moveee members, including free membership. There is nothing to pay for.",
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

const FAQ_RIGHT: FaqItem[] = [
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

function FaqColumn({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div>
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.q} className={`stp-faq-item${isOpen ? " open" : ""}`}>
            <button
              className="stp-faq-q"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : i)}
            >
              {item.q}
              <span className="stp-faq-icon" aria-hidden="true" />
            </button>
            <div className="stp-faq-body" role="region">
              <div className="stp-faq-body-inner-wrap">
                <p className="stp-faq-body-inner">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function StoopFaq() {
  return (
    <div className="stp-faq-grid">
      <FaqColumn items={FAQ_LEFT} />
      <FaqColumn items={FAQ_RIGHT} />
    </div>
  );
}
