"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import GmlCTAForm from "@/components/GmlCTAForm";
import NewsletterSubscribeWidget from "@/components/NewsletterSubscribeWidget";
import HideIfSubscribed from "@/components/HideIfSubscribed";
import ArticleContentGate from "@/components/ArticleContentGate";
import { NL_META, NewsletterListId } from "@/lib/newsletter-lists";
import type { AccessLevel } from "@/lib/access";

export interface IssueEdition {
  slug: string;
  segment: string;
  label: string;
}

export interface ArchiveIssue {
  slug: string;
  title: string;
  issueNum: number;
  editions?: IssueEdition[];
}

interface Props {
  listId: NewsletterListId;
  issues: ArchiveIssue[];
  currentSlug: string;
  currentIssueNum: number;
  issueTitle: string;
  publishedDate: string;
  readingTime: number;
  imageUrl?: string;
  previewHtml?: string;
  accessLevel: AccessLevel;
  callbackUrl: string;
  contentSlot: React.ReactNode;
}

type ReadingTheme = "white" | "sepia" | "dark";
type FontSize = "sm" | "md" | "lg";

const FONT_SIZE_PX: Record<FontSize, string> = { sm: "15px", md: "17px", lg: "19px" };

export default function IssueReaderClient({
  listId,
  issues,
  currentSlug,
  currentIssueNum,
  issueTitle,
  publishedDate,
  readingTime,
  imageUrl,
  previewHtml,
  accessLevel,
  callbackUrl,
  contentSlot,
}: Props) {
  const meta = NL_META[listId];
  const isGml = listId === "getmelit";
  const articleRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [vaultSearch, setVaultSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [theme, setTheme] = useState<ReadingTheme>("white");
  const [fontSize, setFontSize] = useState<FontSize>("md");
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    try {
      const t = localStorage.getItem("irc-theme") as ReadingTheme | null;
      const f = localStorage.getItem("irc-fontsize") as FontSize | null;
      const b = localStorage.getItem(`irc-bm-${currentSlug}`);
      if (t && (t === "white" || t === "sepia" || t === "dark")) setTheme(t);
      if (f && (f === "sm" || f === "md" || f === "lg")) setFontSize(f);
      if (b === "1") setBookmarked(true);
    } catch {}
  }, [currentSlug]);

  const applyTheme = useCallback((t: ReadingTheme) => {
    setTheme(t);
    try { localStorage.setItem("irc-theme", t); } catch {}
  }, []);

  const applyFontSize = useCallback((f: FontSize) => {
    setFontSize(f);
    try { localStorage.setItem("irc-fontsize", f); } catch {}
  }, []);

  const toggleBookmark = useCallback(() => {
    const next = !bookmarked;
    setBookmarked(next);
    try { localStorage.setItem(`irc-bm-${currentSlug}`, next ? "1" : "0"); } catch {}
  }, [bookmarked, currentSlug]);

  useEffect(() => {
    const handleScroll = () => {
      const art = articleRef.current;
      if (!art) return;
      const top = art.getBoundingClientRect().top + window.scrollY;
      const h = art.offsetHeight;
      const scrolled = window.scrollY - top;
      setProgress(Math.min(100, Math.max(0, (scrolled / Math.max(1, h - window.innerHeight)) * 100)));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!vaultOpen) return;
    const handle = (e: KeyboardEvent) => { if (e.key === "Escape") setVaultOpen(false); };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [vaultOpen]);

  // Reset search when vault closes
  useEffect(() => {
    if (!vaultOpen) setVaultSearch("");
  }, [vaultOpen]);

  const handleShare = useCallback(() => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: issueTitle, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {});
    }
  }, [issueTitle]);

  const sortedIssues = sortAsc ? [...issues].reverse() : issues;
  const filteredIssues = vaultSearch.trim()
    ? sortedIssues.filter(i =>
        i.title.toLowerCase().includes(vaultSearch.toLowerCase()) ||
        String(i.issueNum).includes(vaultSearch)
      )
    : sortedIssues;
  const issueNumStr = String(currentIssueNum).padStart(3, "0");
  const accentMod = isGml ? " irc--getmelit" : "";
  const rawTitle = issueTitle.replace(/<[^>]*>/g, "");
  // WP excerpts arrive with HTML entities (&hellip; etc) — decode for plain-text rendering
  const cleanExcerpt = previewHtml
    ? previewHtml
        .replace(/<[^>]*>/g, "")
        .replace(/&hellip;/g, "…")
        .replace(/&mdash;/g, "—")
        .replace(/&ndash;/g, "–")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)))
        .trim()
    : undefined;

  return (
    <div className={`irc-reader irc-theme-${theme}`}>

      {/* ── READING PROGRESS ── */}
      <div className="irc-progress-rail" aria-hidden="true">
        <div className={`irc-progress-bar${accentMod}`} style={{ width: `${progress}%` }} />
      </div>

      {/* ── STICKY READER HEADER ── */}
      <header className={`irc-header${accentMod}`}>
        <div className="irc-header-inner">

          {/* Left: Moveee logo → home, then newsletter name + issue badge */}
          <div className="irc-header-left">
            <Link href="/" className="irc-brand-logo" aria-label="Moveee Magazine">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={theme === "dark" ? "/logo-white.png" : "/logo-black.png"}
                alt="Moveee"
                className="irc-brand-logo-img"
              />
            </Link>
            <span className="irc-header-divider" aria-hidden="true" />
            <Link href={`/newsletter/${listId}`} className={`irc-wordmark${accentMod}`}>
              {meta.label}
            </Link>
            <span className="irc-header-badge">N°{issueNumStr}</span>
          </div>

          {/* Center: Issue Vault */}
          <button
            className={`irc-vault-trigger${accentMod}`}
            onClick={() => setVaultOpen(true)}
            aria-label="Browse all issues"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
            </svg>
            <span className="irc-vault-trigger-label">Issue Vault</span>
            <span className="irc-vault-trigger-count">{issues.length}</span>
          </button>

          {/* Right: reading controls */}
          <div className="irc-header-right">

            {/* Font size */}
            <div className="irc-font-controls" role="group" aria-label="Font size">
              <button
                className={`irc-font-btn${fontSize === "sm" ? " irc-font-btn--active" : ""}`}
                onClick={() => applyFontSize("sm")}
                title="Small"
                style={{ fontSize: 12 }}
              >A−</button>
              <button
                className={`irc-font-btn${fontSize === "lg" ? " irc-font-btn--active" : ""}`}
                onClick={() => applyFontSize("lg")}
                title="Large"
                style={{ fontSize: 15 }}
              >A+</button>
            </div>

            {/* Reading theme dots */}
            <div className="irc-theme-switcher" role="group" aria-label="Reading theme">
              <button
                className={`irc-theme-dot irc-theme-dot--white${theme === "white" ? " irc-theme-dot--active" : ""}`}
                onClick={() => applyTheme("white")}
                title="White"
                aria-pressed={theme === "white"}
              />
              <button
                className={`irc-theme-dot irc-theme-dot--sepia${theme === "sepia" ? " irc-theme-dot--active" : ""}`}
                onClick={() => applyTheme("sepia")}
                title="Sepia"
                aria-pressed={theme === "sepia"}
              />
              <button
                className={`irc-theme-dot irc-theme-dot--dark${theme === "dark" ? " irc-theme-dot--active" : ""}`}
                onClick={() => applyTheme("dark")}
                title="Dark"
                aria-pressed={theme === "dark"}
              />
            </div>

            {/* Bookmark */}
            <button
              className={`irc-icon-btn${bookmarked ? " irc-icon-btn--active" : ""}`}
              onClick={toggleBookmark}
              title={bookmarked ? "Remove bookmark" : "Bookmark"}
              aria-pressed={bookmarked}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
              </svg>
            </button>

            {/* Share */}
            <button
              className="irc-icon-btn"
              onClick={handleShare}
              title={copied ? "Copied!" : "Share"}
            >
              {copied ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                </svg>
              )}
            </button>

          </div>
        </div>
      </header>

      {/* ── ISSUE VAULT DRAWER ── */}
      {vaultOpen && (
        <div
          className="irc-vault-overlay"
          onClick={() => setVaultOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Issue Vault"
        >
          <div className="irc-vault-drawer" onClick={e => e.stopPropagation()}>

            {/* Drawer header */}
            <div className="irc-vault-header">
              <div>
                <div className="irc-vault-header-title">The Moveee Vault</div>
                <div className="irc-vault-header-sub">Browse all {issues.length} issues of {meta.label}</div>
              </div>
              <button className="irc-vault-close" onClick={() => setVaultOpen(false)} aria-label="Close vault">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Search + sort */}
            <div className="irc-vault-controls">
              <div className="irc-vault-search-wrap">
                <svg className="irc-vault-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  className="irc-vault-search"
                  placeholder="Search issues…"
                  value={vaultSearch}
                  onChange={e => setVaultSearch(e.target.value)}
                  aria-label="Search issues"
                />
              </div>
              <div className="irc-vault-sort">
                <button
                  className={`irc-vault-sort-btn${!sortAsc ? " irc-vault-sort-btn--active" : ""}`}
                  onClick={() => setSortAsc(false)}
                >Newest</button>
                <button
                  className={`irc-vault-sort-btn${sortAsc ? " irc-vault-sort-btn--active" : ""}`}
                  onClick={() => setSortAsc(true)}
                >Oldest</button>
              </div>
            </div>

            {/* Issue list */}
            <div className="irc-vault-list">
              {filteredIssues.length === 0 ? (
                <p className="irc-vault-empty">No issues match "{vaultSearch}"</p>
              ) : filteredIssues.map((issue) => {
                const isActive = issue.slug === currentSlug;
                const activeClass = isActive
                  ? isGml ? " irc-vault-row--active-gml" : " irc-vault-row--active"
                  : "";
                return (
                  <Link
                    key={issue.slug}
                    href={`/newsletter/${issue.slug}`}
                    className={`irc-vault-row${activeClass}`}
                    onClick={() => setVaultOpen(false)}
                  >
                    <div className="irc-vault-row-inner">
                      <div className="irc-vault-row-meta">
                        <span className="irc-vault-row-num">Issue {String(issue.issueNum).padStart(3, "0")}</span>
                        {isActive && <span className="irc-vault-row-current">Current</span>}
                      </div>
                      <span className="irc-vault-row-title">{issue.title}</span>
                    </div>
                    <svg className="irc-vault-row-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </Link>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* ── EDITORIAL INTRO BANNER ── */}
      <div className="irc-intro-banner">
        <span className={`irc-intro-eyebrow${accentMod}`}>{meta.tagline}</span>
        <div className="irc-intro-divider" aria-hidden="true">
          <div className="irc-intro-rule" />
          <span className="irc-intro-ornament">✦</span>
          <div className="irc-intro-rule" />
        </div>
      </div>

      {/* ── EDITORIAL HERO ── */}
      <section className={`irc-hero${accentMod}`}>
        {/* Ambient blurs */}
        <div className="irc-hero-blur irc-hero-blur--top" aria-hidden="true" />
        <div className="irc-hero-blur irc-hero-blur--left" aria-hidden="true" />

        <div className="irc-hero-inner">
          {/* Left: text column */}
          <div className="irc-hero-text">
            <div className="irc-hero-meta-row">
              <span className={`irc-hero-issue-pill${accentMod}`}>Issue N°{issueNumStr}</span>
              <span className="irc-hero-date-chip">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {publishedDate}
              </span>
              <span className="irc-hero-date-chip">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                {readingTime} min read
              </span>
            </div>

            <h1 className="irc-hero-title" dangerouslySetInnerHTML={{ __html: issueTitle }} />

            {cleanExcerpt && (
              <p className="irc-hero-excerpt">{cleanExcerpt}</p>
            )}

            <HideIfSubscribed>
              <a href="#irc-subscribe" className={`irc-hero-subscribe-cta${accentMod}`}>
                Subscribe free →
              </a>
            </HideIfSubscribed>
          </div>

          {/* Right: featured image card */}
          {imageUrl && (
            <div className="irc-hero-img-wrap">
              <div className="irc-hero-img-glow" aria-hidden="true" />
              <div className="irc-hero-img-card">
                <Image
                  src={imageUrl}
                  alt={rawTitle}
                  fill
                  style={{ objectFit: "cover" }}
                  priority
                />
                <div className="irc-hero-img-overlay" aria-hidden="true" />
                <div className="irc-hero-img-caption">
                  <span>{meta.label}</span>
                  <span>Issue N°{issueNumStr}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── ARTICLE + SIDEBAR RAIL ── */}
      <div className="irc-content-grid">

        {/* Left sticky rail (desktop only) */}
        <aside className="irc-rail">
          <div className="irc-rail-inner">
            <button
              className={`irc-rail-bookmark${bookmarked ? " irc-rail-bookmark--active" : ""}`}
              onClick={toggleBookmark}
              title={bookmarked ? "Saved" : "Save story"}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
              </svg>
              <span>{bookmarked ? "Saved" : "Save story"}</span>
            </button>
            <button
              className="irc-rail-top"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              title="Back to top"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
              </svg>
              <span>Top</span>
            </button>
          </div>
        </aside>

        {/* Main article body */}
        <div
          ref={articleRef}
          className={`rd-body${isGml ? " rd-body--getmelit" : ""} irc-article`}
          style={{ fontSize: FONT_SIZE_PX[fontSize] }}
        >
          <ArticleContentGate
            accessLevel={accessLevel}
            callbackUrl={callbackUrl}
            previewHtml={previewHtml}
            fullContent={contentSlot}
          />
        </div>

      </div>

      {/* ── SUBSCRIBE BAND ── */}
      <HideIfSubscribed>
        <div className="rd-subscribe-band" id="irc-subscribe">
          <h2 className="rd-subscribe-title">Never miss an issue.</h2>
          <div className="irc-subscribe-form">
            {isGml ? (
              <NewsletterSubscribeWidget
                placeholder="your@email.com"
                buttonLabel="Get it in my inbox →"
                list="getmelit"
                inputClassName="rd-subscribe-input rd-subscribe-input--getmelit"
                buttonClassName="rd-subscribe-btn rd-subscribe-btn--getmelit"
              />
            ) : (
              <GmlCTAForm
                list="culture-drop"
                buttonLabel="Drop it in my inbox →"
                successLabel="✓ You're in"
              />
            )}
          </div>
          <span className="rd-subscribe-note">
            Free · {isGml ? "Daily" : "Weekly"} · Unsubscribe any time
          </span>
        </div>
      </HideIfSubscribed>

    </div>
  );
}
