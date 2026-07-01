"use client";

import { useEffect } from "react";

export default function TocScrollSpy() {
  useEffect(() => {
    const tocLinks = Array.from(
      document.querySelectorAll<HTMLAnchorElement>(".ar-toc a[href^='#']")
    );
    if (tocLinks.length === 0) return;

    const headingIds = tocLinks.map((a) => a.getAttribute("href")!.slice(1));
    const headings = headingIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (headings.length === 0) return;

    let activeId = "";

    function setActive(id: string) {
      if (id === activeId) return;
      activeId = id;
      tocLinks.forEach((a) => {
        const href = a.getAttribute("href")!.slice(1);
        a.classList.toggle("active", href === id);
      });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost heading that is currently intersecting
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActive((visible[0].target as HTMLElement).id);
          return;
        }

        // If nothing intersecting, find the last heading above the viewport
        const above = headings
          .filter((h) => h.getBoundingClientRect().top < 0)
          .at(-1);
        if (above) setActive(above.id);
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 }
    );

    headings.forEach((h) => observer.observe(h));

    // Set initial active on mount
    const firstBelow = headings.find((h) => h.getBoundingClientRect().top > 0);
    const initial = firstBelow
      ? headings[headings.indexOf(firstBelow) - 1]
      : headings[headings.length - 1];
    if (initial) setActive(initial.id);

    return () => observer.disconnect();
  }, []);

  return null;
}
