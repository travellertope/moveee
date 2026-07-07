"use client";

import { useState } from "react";
import Link from "next/link";

export interface NlArchiveRow {
  id: string;
  slug: string;
  num: string;
  date: string;
  titleHtml: string;
  list: string | null;
  badgeLabel: string | null;
  tagName: string | null;
}

const PAGE_SIZE = 20;

export default function NlArchiveList({ rows }: { rows: NlArchiveRow[] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = rows.slice(0, visibleCount);
  const hasMore = visibleCount < rows.length;

  return (
    <>
      <div className="digest-archive-list">
        {visible.map((row) => (
          <Link
            key={row.id}
            href={`/newsletter/${row.slug}`}
            className={`digest-archive-row${row.list === "getmelit" ? " digest-archive-row--getmelit" : ""}`}
          >
            <span className="digest-archive-num">{row.num}</span>
            <span className="digest-archive-date">{row.date}</span>
            <span
              className="digest-archive-title"
              dangerouslySetInnerHTML={{ __html: row.titleHtml }}
            />
            <div className="digest-archive-tags">
              {row.badgeLabel && (
                <span className={`nl-list-badge nl-list-badge--${row.list}`}>
                  {row.badgeLabel}
                </span>
              )}
              {row.tagName && <span className="digest-tag">{row.tagName}</span>}
            </div>
            <span className="digest-archive-arrow">→</span>
          </Link>
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          className="nl-archive-load-more"
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
        >
          Load more issues
        </button>
      )}
    </>
  );
}
