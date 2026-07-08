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
  heroPullQuote?: string;
  previewHtml?: string;
  accessLevel: AccessLevel;
  callbackUrl: string;
  contentSlot: React.ReactNode;
}

export default function IssueReaderClient({
  listId,
  issues,
  currentSlug,
  currentIssueNum,
  issueTitle,
  publishedDate,
  readingTime,
  imageUrl,
  heroPullQuote,
  previewHtml,
  accessLevel,
  callbackUrl,
  contentSlot,
}: Props) {
  const meta = NL_META[listId];
  const isGml = listId === "getmelit";
  const paneRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [sortAsc, setSortAsc] = useState(false);
  const [copied, setCopied] = useState(false);

  // Track right-pane element scroll for progress bar
  useEffect(() => {
    const pane = paneRef.current;
    if (!pane) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = pane;
      const pct = Math.min(100, (scrollTop / Math.max(1, scrollHeight - clientHeight)) * 100);
      setProgress(pct);
    };
    pane.addEventListener("scroll", handleScroll, { passive: true });
    return () => pane.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll active row into view when navigating between issues
  useEffect(() => {
    const el = document.getElementById(`rd-row-${currentSlug}`);
    el?.scrollIntoView({ block: "nearest" });
  }, [currentSlug]);

  const handleShare = useCallback(() => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: issueTitle, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [issueTitle]);

  const sortedIssues = sortAsc ? [...issues].reverse() : issues;
  const issueNumStr = String(currentIssueNum).padStart(3, "0");

  return (
    <div className="rd-layout">

      {/* ── LEFT SIDEBAR (desktop only) ── */}
      <div className="rd-sidebar">
        {/* Header */}
        <div className="rd-sidebar-header">
          <Link
            href={`/newsletter/${listId}`}
            className={`rd-sidebar-title${isGml ? " rd-sidebar-title--getmelit" : ""}`}
          >
            {meta.label}
          </Link>
          <p className="rd-sidebar-standfirst">
            Browse all {issues.length} issues of {meta.label} — {meta.tagline.toLowerCase()}
          </p>
          <a href="#rd-subscribe" className="rd-sidebar-subscribe" style={{ textAlign: "center", textDecoration: "none", display: "block" }}>
            Subscribe free →
          </a>
        </div>

        {/* Archive panel */}
        <div className="rd-archive-panel">
          {/* Sticky panel header */}
          <div className="rd-archive-panel-header">
            <span className="rd-archive-panel-label">Browse Archive</span>
            <div className="rd-sort-toggle">
              <button
                className={`rd-sort-btn${!sortAsc ? " rd-sort-btn--active" : ""}`}
                onClick={() => setSortAsc(false)}
                title="Newest first"
              >↓</button>
              <button
                className={`rd-sort-btn${sortAsc ? " rd-sort-btn--active" : ""}`}
                onClick={() => setSortAsc(true)}
                title="Oldest first"
              >↑</button>
            </div>
          </div>

          {/* Scrollable issue list */}
          <div className="rd-archive-list">
            {sortedIssues.map((issue) => {
              const isActive = issue.slug === currentSlug;
              const activeClass = isGml
                ? " rd-archive-row--active--getmelit"
                : " rd-archive-row--active";
              return (
                <Link
                  key={issue.slug}
                  id={`rd-row-${issue.slug}`}
                  href={`/newsletter/${issue.slug}`}
                  className={`rd-archive-row${isActive ? activeClass : ""}`}
                >
                  <span className="rd-archive-num">
                    Issue {String(issue.issueNum).padStart(3, "0")}
                  </span>
                  <span className="rd-archive-title">
                    {issue.title}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="rd-sidebar-footer">
          <button className="rd-sidebar-collapse" title="Scroll to top" onClick={() => paneRef.current?.scrollTo({ top: 0, behavior: "smooth" })}>
            «
          </button>
        </div>
      </div>

      {/* ── MOBILE HEADER + ARCHIVE STRIP (≤1024px only) ── */}
      <div className="rd-mobile-strip" style={{ flexDirection: "column", padding: 0, gap: 0 }}>
        {/* Mobile header row */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          height: 60,
          background: "#fff",
          borderBottom: "1px solid var(--rule)",
          flexShrink: 0,
        }}>
          <Link
            href={`/newsletter/${listId}`}
            style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 700, color: "var(--ink)", textDecoration: "none" }}
          >
            {meta.label}
          </Link>
          <span style={{
            border: "1px solid var(--rule)",
            borderRadius: 999,
            padding: "4px 12px",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            fontWeight: 700,
            color: "var(--ink)",
          }}>
            Issue N°{issueNumStr}
          </span>
        </div>
        {/* Horizontal pill strip */}
        <div style={{ display: "flex", gap: 8, padding: 12, overflowX: "auto", scrollbarWidth: "none", background: "var(--paper-warm)", borderBottom: "1px solid var(--rule)" }}>
          {issues.slice(0, 10).map((issue) => {
            const isActive = issue.slug === currentSlug;
            const activeClass = isGml
              ? " rd-strip-pill--active--getmelit"
              : " rd-strip-pill--active";
            return (
              <Link
                key={issue.slug}
                href={`/newsletter/${issue.slug}`}
                className={`rd-strip-pill${isActive ? activeClass : ""}`}
              >
                Issue {issue.issueNum}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT CONTENT PANE ── */}
      <div className="rd-pane" ref={paneRef}>

        {/* Progress bar — tracks this pane's scroll, not window */}
        <div className="rd-progress">
          <div
            className={`rd-progress-bar${isGml ? " rd-progress-bar--getmelit" : ""}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Floating issue badge */}
        <div className="rd-issue-badge">
          <div className="rd-issue-badge-inner">
            <span className="rd-badge-label">Issue N°{issueNumStr}</span>
            <div className="rd-badge-sep" />
            <button
              className={`rd-badge-share${isGml ? " rd-badge-share--getmelit" : ""}`}
              onClick={handleShare}
              title={copied ? "Copied!" : "Share issue"}
            >
              {copied ? (
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>Copied!</span>
              ) : (
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              )}
            </button>
          </div>
        </div>


        {/* Hero */}
        <div className={`rd-hero${isGml ? " rd-hero--getmelit" : ""}`}>
          <div className="rd-hero-inner">
            {/* Left: pull quote */}
            <div className="rd-pull-quote-col">
              {heroPullQuote ? (
                <>
                  <p className="rd-pull-quote-text">&ldquo;{heroPullQuote}&rdquo;</p>
                  <span className="rd-pull-quote-cite">— {meta.pillars[0]?.name || meta.label}</span>
                </>
              ) : (
                <>
                  <p className="rd-pull-quote-text">&ldquo;{meta.pullQuote}&rdquo;</p>
                  <span className="rd-pull-quote-cite">{meta.pullCite}</span>
                </>
              )}
            </div>
            {/* Right: featured image */}
            <div className="rd-hero-image-col">
              {imageUrl ? (
                <div style={{ width: "100%", maxWidth: 420, aspectRatio: "4/3", position: "relative", borderRadius: "var(--radius-lg, 6px)", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,.15)", marginLeft: "auto" }}>
                  <Image src={imageUrl} alt={issueTitle} fill style={{ objectFit: "cover" }} />
                </div>
              ) : (
                <div className="rd-hero-image" style={{ background: `linear-gradient(135deg, rgba(${isGml ? "179,130,56" : "197,73,31"},.3), rgba(${isGml ? "179,130,56" : "197,73,31"},.8))` }} />
              )}
            </div>
          </div>
        </div>

        {/* Wordmark */}
        <div className="rd-wordmark">
          <h2 className="rd-wordmark-text">{meta.label}</h2>
        </div>

        {/* Article body */}
        <article className={`rd-body${isGml ? " rd-body--getmelit" : ""}`}>
          <ArticleContentGate
            accessLevel={accessLevel}
            callbackUrl={callbackUrl}
            previewHtml={previewHtml}
            fullContent={contentSlot}
          />
        </article>

        {/* Subscribe band */}
        <HideIfSubscribed>
          <div className="rd-subscribe-band" id="rd-subscribe">
            <h2 className="rd-subscribe-title">Never miss an issue.</h2>
            <div className="rd-subscribe-form">
              {isGml ? (
                <NewsletterSubscribeWidget
                  placeholder="your@email.com"
                  buttonLabel="Get it in my inbox →"
                  list="getmelit"
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
    </div>
  );
}
