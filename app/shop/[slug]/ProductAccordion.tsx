"use client"

import { useState } from "react";
import type { ReactNode } from "react";

interface AccordionItem {
  title: string;
  content: ReactNode;
}

interface ProductAccordionProps {
  items: AccordionItem[];
}

export default function ProductAccordion({ items }: ProductAccordionProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="sp-accordions">
      {items.map((item, i) => {
        const isOpen = openIdx === i;
        return (
          <div key={i} className={`sp-acc${isOpen ? " open" : ""}`}>
            <button
              className="sp-acc-header"
              onClick={() => setOpenIdx(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              {item.title}
              <span className="plus">+</span>
            </button>
            <div className="sp-acc-body">
              <div className="sp-acc-body-inner">{item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
