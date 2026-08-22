"use client";

import { useState } from "react";
import Link from "next/link";
import type { NlArchiveRow } from "@/components/NlArchiveList";

const PAGE_SIZE = 20;

// Same shape/pagination logic as NlArchiveList.tsx, restyled onto the
// newsletter hub's own minimal nlh-* namespace (see newsletter-hub.css).
// Kept as a separate component rather than restyling NlArchiveList
// directly — that component is also used by EditionNewsletterHub.tsx,
// which keeps the older, fuller design and must not pick up this look.
export default function NlhArchiveList({ rows }: { rows: NlArchiveRow[] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = rows.slice(0, visibleCount);
  const hasMore = visibleCount < rows.length;

  return (
    <>
      {visible.map((row) => (
        <Link key={row.id} href={`/newsletter/${row.slug}`} className="nlh-arow">
          <span className="nlh-arow-num">{row.num}</span>
          <span
            className="nlh-arow-title"
            dangerouslySetInnerHTML={{ __html: row.titleHtml }}
          />
          {row.badgeLabel && (
            <span className={`nl-list-badge nl-list-badge--${row.list}`}>{row.badgeLabel}</span>
          )}
          <span className="nlh-arow-date">{row.date}</span>
        </Link>
      ))}
      {hasMore && (
        <button type="button" className="nlh-load-more" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
          Load more issues
        </button>
      )}
    </>
  );
}
