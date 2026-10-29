"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import type { FeedItem } from "@/lib/unified-feed";
import "./HomepageCommunityStream.css";
import "@/app/pulse-layout.css";

const CommunityDetailModal = dynamic(
  () => import("@/components/pulse/CommunityDetailModal"),
  { ssr: false }
);
const ComposerModal = dynamic(
  () => import("@/components/pulse/ComposerModal"),
  { ssr: false }
);

// ---------- helpers ----------

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return `${Math.max(1, Math.round(diff / 60))}m`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h`;
  return `${Math.round(diff / 86400)}d`;
}

function reactionTotal(item: FeedItem): number {
  const r = item.reactions ?? { love: 0, fire: 0, clap: 0 };
  return r.love + r.fire + r.clap;
}

function tagLabel(item: FeedItem): string {
  const t = (item.templateType ?? "post").toLowerCase();
  if (t === "post" || t === "update") return "Update";
  if (t === "event") return "Event";
  if (t === "poll") return "Poll";
  if (t.includes("review") || t.includes("food") || t.includes("music") || t.includes("book") || t.includes("film") || t.includes("place")) return "Review";
  if (t === "quote") return "Quote";
  if (t === "itinerary") return "Itinerary";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function starRow(rating?: number) {
  if (!rating) return null;
  const full = Math.round(rating);
  return (
    <div className="hcs-stars">
      {"★".repeat(full)}{"☆".repeat(Math.max(0, 5 - full))}
    </div>
  );
}

// ---------- card ----------

function StreamCard({ item, onOpen }: { item: FeedItem; onOpen: (item: FeedItem) => void }) {
  const tag = tagLabel(item);
  const hasImage = Boolean(item.image);
  const total = reactionTotal(item);
  const isPoll = (item.templateType ?? "").toLowerCase() === "poll";
  const isQuote = (item.templateType ?? "").toLowerCase() === "quote";
  const isEvent = (item.templateType ?? "post") === "event";
  const isReview = tag === "Review";

  // Truncate body text for card preview
  const bodyPreview = item.title
    ? item.title.length > 160
      ? item.title.slice(0, 160).trimEnd() + "…"
      : item.title
    : "";

  return (
    <div
      className={`hcs-card hcs-card--${tag.toLowerCase()}${hasImage ? " hcs-card--has-image" : ""}`}
      onClick={() => onOpen(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(item); } }}
      aria-label={`Read post by ${item.communityAuthor ?? "member"}`}
    >
      {/* Image (only for posts that have one and aren't quote/poll) */}
      {hasImage && !isQuote && !isPoll && (
        <div className="hcs-card__img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.image} alt={item.communityAuthor ?? ""} loading="lazy" />
        </div>
      )}

      <div className="hcs-card__body">
        {/* Tag + time */}
        <div className="hcs-card__meta">
          <span className="hcs-card__tag">{tag}</span>
          <span className="hcs-card__time">{timeAgo(item.date)}</span>
        </div>

        {/* Star rating for reviews */}
        {isReview && starRow(
          item.starRating ??
          item.bookOverallRating ??
          item.musicOverallRating ??
          item.filmOverallRating
        )}

        {/* Title / review subject */}
        {isReview && (item.bookTitle || item.musicTitle || item.filmTitle || item.foodDishName) && (
          <div className="hcs-card__subject">
            {item.bookTitle ?? item.musicTitle ?? item.filmTitle ?? item.foodDishName}
            {(item.bookAuthor || item.musicArtist || item.filmDirector) && (
              <span className="hcs-card__subject-by">
                {" by "}
                {item.bookAuthor ?? item.musicArtist ?? item.filmDirector}
              </span>
            )}
          </div>
        )}

        {/* Body text */}
        {!isEvent && (
          <p className={`hcs-card__text${isQuote ? " hcs-card__text--quote" : ""}`}>
            {isQuote && <span className="hcs-card__ldquo">&ldquo;</span>}
            {bodyPreview}
            {isQuote && <span className="hcs-card__rdquo">&rdquo;</span>}
          </p>
        )}

        {/* Quote source */}
        {isQuote && item.quoteAuthor && (
          <p className="hcs-card__quote-src">— {item.quoteAuthor}</p>
        )}

        {/* Poll: show first two options */}
        {isPoll && item.pollOptions && item.pollOptions.length > 0 && (
          <ul className="hcs-card__poll">
            {item.pollOptions.slice(0, 2).map((opt, i) => (
              <li key={i}>{opt.text}</li>
            ))}
            {item.pollOptions.length > 2 && (
              <li className="hcs-card__poll-more">+{item.pollOptions.length - 2} more options</li>
            )}
          </ul>
        )}

        {/* Event */}
        {isEvent && (
          <>
            <p className="hcs-card__event-name">{bodyPreview}</p>
            {item.locationName && (
              <p className="hcs-card__event-loc">📍 {item.locationName}</p>
            )}
          </>
        )}

        {/* Footer: author + reactions */}
        <div className="hcs-card__footer">
          <div className="hcs-card__author">
            {item.communityAuthorAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.communityAuthorAvatar}
                alt={item.communityAuthor ?? ""}
                className="hcs-card__avatar"
              />
            ) : (
              <span className="hcs-card__avatar-placeholder">
                {(item.communityAuthor ?? "?").charAt(0).toUpperCase()}
              </span>
            )}
            <span className="hcs-card__author-name">
              {item.communityAuthor ?? "Member"}
            </span>
          </div>
          {total > 0 && (
            <span className="hcs-card__reactions">
              ❤ {total}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- main component ----------

interface Props {
  items: FeedItem[];
}

export default function HomepageCommunityStream({ items }: Props) {
  const { data: session } = useSession();
  const [activeItem, setActiveItem] = useState<FeedItem | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  const openItem = useCallback((item: FeedItem) => setActiveItem(item), []);
  const closeItem = useCallback(() => setActiveItem(null), []);
  const openComposer = useCallback(() => setComposerOpen(true), []);
  const closeComposer = useCallback(() => setComposerOpen(false), []);

  if (items.length === 0) return null;

  return (
    <section className="arc-section hcs-section">
      <div className="wrap">
        <div className="arc-hdr">
          <h2>From The <em>Community</em></h2>
          <button className="hcs-post-btn" onClick={openComposer}>
            Post an update
          </button>
        </div>

        <div className="hcs-masonry">
          {items.map((item) => (
            <StreamCard key={item.id} item={item} onOpen={openItem} />
          ))}
        </div>

        <div className="hcs-viewmore-row">
          <a href="/feed" className="hcs-viewmore-btn">View more</a>
        </div>
      </div>

      {activeItem && (
        <CommunityDetailModal item={activeItem} onClose={closeItem} />
      )}

      {composerOpen && (
        <ComposerModal
          open={composerOpen}
          onClose={closeComposer}
          onSuccess={closeComposer}
        />
      )}
    </section>
  );
}
