"use client";

import { useEffect, useState } from "react";
import type { Section } from "../market-data";

export default function MarketNav({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-15% 0px -75% 0px", threshold: 0 }
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  return (
    <aside className="market-sidenav">
      <div className="sidenav-inner">
        <p className="sidenav-label">Our Services</p>
        <nav>
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`sidenav-link ${active === s.id ? "sidenav-link--active" : ""}`}
            >
              <span className="sidenav-link-name">{s.label}</span>
            </a>
          ))}
        </nav>
        <div className="sidenav-cta">
          <p>Need a bespoke package?</p>
          <a href="mailto:hello@themoveee.com" className="sidenav-cta-link">
            Talk to us →
          </a>
        </div>
      </div>
    </aside>
  );
}
