"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export interface NlhCard {
  id: string;
  slug: string;
  title: string;
  list: string | null;
  badgeLabel: string | null;
  date: string;
  readingTime: number;
  imageUrl?: string;
  imageAlt?: string;
  excerpt: string;
}

const PAGE_SIZE = 9;

export default function NlhCardGrid({
  cards,
  cdCount,
  gmlCount,
}: {
  cards: NlhCard[];
  cdCount: number;
  gmlCount: number;
}) {
  const [filter, setFilter] = useState<"all" | "culture-drop" | "getmelit">("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered =
    filter === "all" ? cards : cards.filter((c) => c.list === filter);
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  function changeFilter(f: typeof filter) {
    setFilter(f);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <>
      {/* Filter tabs */}
      <div className="nlh-cg-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={filter === "all"}
          className={`nlh-cg-tab${filter === "all" ? " nlh-cg-tab--active" : ""}`}
          onClick={() => changeFilter("all")}
        >
          All <span className="nlh-cg-count">{cards.length}</span>
        </button>
        <button
          role="tab"
          aria-selected={filter === "culture-drop"}
          className={`nlh-cg-tab${filter === "culture-drop" ? " nlh-cg-tab--active" : ""}`}
          onClick={() => changeFilter("culture-drop")}
        >
          Culture Drop <span className="nlh-cg-count">{cdCount}</span>
        </button>
        <button
          role="tab"
          aria-selected={filter === "getmelit"}
          className={`nlh-cg-tab${filter === "getmelit" ? " nlh-cg-tab--active" : ""}`}
          onClick={() => changeFilter("getmelit")}
        >
          GetMeLit <span className="nlh-cg-count">{gmlCount}</span>
        </button>
      </div>

      {/* Card grid */}
      <div className="nlh-cg-grid">
        {visible.length === 0 && (
          <p className="nlh-cg-empty">No issues in this category yet.</p>
        )}
        {visible.map((card) => (
          <NlhCardItem key={card.id} card={card} />
        ))}
      </div>

      {hasMore && (
        <div className="nlh-cg-more-wrap">
          <button
            className="nlh-cg-more"
            onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
          >
            Load More Stories
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
          </button>
        </div>
      )}
    </>
  );
}

function NlhCardItem({ card }: { card: NlhCard }) {
  const [bookmarked, setBookmarked] = useState(false);
  const isGml = card.list === "getmelit";

  return (
    <article className={`nlh-card${isGml ? " nlh-card--gml" : ""}`}>
      <Link href={`/newsletter/${card.slug}`} className="nlh-card-img-wrap" tabIndex={-1} aria-hidden="true">
        {card.imageUrl ? (
          <Image
            src={card.imageUrl}
            alt={card.imageAlt || card.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
            className="nlh-card-img"
            unoptimized={card.imageUrl.includes("optimole.com")}
          />
        ) : (
          <div className="nlh-card-img-placeholder" aria-hidden="true" />
        )}
        {card.badgeLabel && (
          <span className={`nlh-card-badge${isGml ? " nlh-card-badge--gml" : ""}`}>
            {card.badgeLabel}
          </span>
        )}
      </Link>

      <div className="nlh-card-body">
        <div className="nlh-card-meta">
          <span>{card.date}</span>
          <span className="nlh-card-dot" aria-hidden="true">·</span>
          <span>{card.readingTime} min read</span>
        </div>

        <h3 className="nlh-card-title">
          <Link href={`/newsletter/${card.slug}`}>{card.title}</Link>
        </h3>

        {card.excerpt && (
          <p className="nlh-card-excerpt">{card.excerpt}</p>
        )}

        <div className="nlh-card-footer">
          <button
            className={`nlh-card-bm${bookmarked ? " nlh-card-bm--on" : ""}`}
            aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
            onClick={() => setBookmarked((b) => !b)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
          </button>
          <Link href={`/newsletter/${card.slug}`} className="nlh-card-read">
            Read Story <span className="nlh-card-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
