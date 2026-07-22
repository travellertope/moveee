"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import type { FeedItem } from "@/lib/unified-feed";
import { decodeHtml } from "@/lib/decode-html";
import { sanitizeHtml } from "@/lib/sanitize";

interface Props {
  item: FeedItem;
  onClose: () => void;
}

function formatLongDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

export default function HappeningDetailModal({ item, onClose }: Props) {
  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [close]);

  const eventDateStr = item.eventDate ? formatLongDate(item.eventDate) : null;
  const endDateStr = item.endDate ? formatLongDate(item.endDate) : null;

  const rawText = item.excerpt ?? "";
  const paragraphs = rawText.split(/\n\n+/).map(p => p.replace(/\n/g, " ").trim()).filter(Boolean);
  const htmlBody = item.body && item.body.trim() !== "" ? item.body : null;

  return (
    <div
      onClick={close}
      style={{
        position: "fixed", inset: 0, zIndex: 8000,
        background: "rgba(20,17,13,0.55)",
        display: "flex", justifyContent: "flex-end", alignItems: "stretch",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(520px, 100vw)",
          background: "var(--paper)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.25rem",
          borderBottom: "1px solid var(--rule)",
          position: "sticky", top: 0,
          background: "var(--paper-header)", zIndex: 1,
        }}>
          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
            <span style={{
              background: "var(--cat-happening-bg)", color: "var(--cat-happening-fg)",
              fontSize: "0.58rem", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "0.18rem 0.45rem", borderRadius: "999px",
            }}>Happening</span>
            {item.isLiterati && (
              <span style={{
                fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.04em",
                textTransform: "uppercase", color: "var(--gold)", background: "var(--paper-deep, #f2f2f2)",
                border: "1px solid var(--gold)", borderRadius: "999px", padding: "0.18rem 0.45rem",
              }}>
                🪶 Literati Connect
              </span>
            )}
            {item.eventCategory && (
              <span style={{ fontSize: "0.62rem", color: "var(--gold)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {item.eventCategory}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <Link
              href={item.href}
              style={{
                color: "var(--ochre)", fontSize: "0.8rem", fontWeight: 400,
                textDecoration: "underline", textUnderlineOffset: "2px",
              }}
            >
              Full page →
            </Link>
            <button onClick={close} aria-label="Close" style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--ink)", lineHeight: 1, padding: "0.25rem", display: "flex",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "1.25rem", flex: 1 }}>
          {/* Featured image — preserved aspect ratio */}
          {item.image && (
            <div style={{ marginBottom: "1rem", borderRadius: "6px", overflow: "hidden", border: "1px solid var(--rule)" }}>
              <img src={item.image} alt={item.title} style={{ width: "100%", maxHeight: "360px", display: "block", objectFit: "contain", background: "var(--paper-deep)" }} loading="lazy" />
            </div>
          )}

          {/* Title */}
          <h2 style={{
            fontFamily: "var(--font-fraunces), serif",
            fontSize: "1.375rem", fontWeight: 700, lineHeight: 1.3,
            color: "var(--ink)", marginBottom: "0.75rem",
          }}>
            {decodeHtml(item.title)}
          </h2>

          {/* Event details strip */}
          <div style={{
            background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "6px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            padding: "0.85rem 1rem", marginBottom: "1rem",
            display: "flex", flexDirection: "column", gap: "0.5rem",
          }}>
            {eventDateStr && (
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                <span style={{ color: "var(--cat-happening-fg)", fontSize: "0.88rem", flexShrink: 0 }}>📅</span>
                <div style={{ fontSize: "0.85rem", color: "var(--ink)", lineHeight: 1.45 }}>
                  {eventDateStr}
                  {endDateStr && endDateStr !== eventDateStr && (
                    <span style={{ color: "var(--mute)" }}> — {endDateStr}</span>
                  )}
                  {item.openingHours && (
                    <span style={{ color: "var(--mute)" }}> · {item.openingHours}</span>
                  )}
                </div>
              </div>
            )}
            {(item.location || item.city) && (
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                <span style={{ color: "var(--cat-happening-fg)", fontSize: "0.88rem", flexShrink: 0 }}>📍</span>
                <div style={{ fontSize: "0.85rem", color: "var(--ink)", lineHeight: 1.45 }}>
                  {item.location && <div>{item.location}</div>}
                  {item.venueAddress && (
                    <div style={{ color: "var(--mute)", fontSize: "0.8rem" }}>{item.venueAddress}</div>
                  )}
                  {item.city && (
                    <div style={{ color: "var(--mute)", fontSize: "0.8rem" }}>{item.city}</div>
                  )}
                </div>
              </div>
            )}
            {item.admission && (
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span style={{ color: "var(--cat-happening-fg)", fontSize: "0.88rem", flexShrink: 0 }}>🎟</span>
                <span style={{ fontSize: "0.85rem", color: "var(--ink)", fontWeight: 600 }}>{item.admission}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {htmlBody ? (
            <>
              <style>{`.happening-body p { margin: 0 0 0.9em; } .happening-body p:last-child { margin-bottom: 0; } .happening-body a { color: var(--cat-happening-fg); }`}</style>
              <div
                className="happening-body"
                style={{
                  fontFamily: "var(--font-fraunces), serif",
                  fontSize: "0.95rem", lineHeight: 1.7, color: "var(--ink-soft)",
                  marginBottom: "1.25rem",
                }}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlBody!) }}
              />
            </>
          ) : paragraphs.length > 0 ? (
            <div style={{
              fontFamily: "var(--font-fraunces), serif",
              fontSize: "0.95rem", lineHeight: 1.7, color: "var(--ink-soft)",
              marginBottom: "1.25rem",
            }}>
              {paragraphs.map((p, i) => (
                <p key={i} style={{ margin: 0, marginTop: i > 0 ? "0.85em" : 0 }}>{p}</p>
              ))}
            </div>
          ) : null}

          {/* Organiser */}
          {item.organiserName && (
            <div style={{ marginBottom: "1.25rem" }}>
              <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--mute)", marginBottom: "0.4rem" }}>Organised by</p>
              {item.organiserSlug ? (
                <Link href={`/directory/${item.organiserSlug}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "4px", padding: "0.45rem 0.75rem", textDecoration: "none", color: "var(--ink)", fontSize: "0.85rem", fontWeight: 600 }}>
                  {item.organiserName}
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="var(--mute)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9L9 3M4 3h5v5"/></svg>
                </Link>
              ) : (
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--ink)" }}>{item.organiserName}</span>
              )}
            </div>
          )}

          {/* CTA */}
          <Link
            href={item.href}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "100%", height: "52px",
              background: "var(--cat-happening-fg)", color: "#fff",
              fontSize: "0.85rem", fontWeight: 700,
              borderRadius: "999px",
              textDecoration: "none",
            }}
          >
            View Event Details →
          </Link>
        </div>
      </div>
    </div>
  );
}
