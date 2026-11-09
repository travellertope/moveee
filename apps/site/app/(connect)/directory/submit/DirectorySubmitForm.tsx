"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import PatronPrice from "@/components/PatronPrice";

// Fallback types used when WordPress taxonomy terms cannot be fetched.
const FALLBACK_ENTRY_TYPES = [
  { slug: "person",   label: "Person" },
  { slug: "place",    label: "Place" },
  { slug: "movement", label: "Movement" },
  { slug: "genre",    label: "Genre" },
  { slug: "concept",  label: "Concept" },
  { slug: "artwork",  label: "Artwork" },
  { slug: "food",     label: "Food & Drink" },
  { slug: "fashion",  label: "Fashion" },
];

// Entry types that have a catalog lookup (book/film/album).
const CATALOG_TYPES = new Set(["book", "film", "album"]);

type Step = "input" | "generating" | "review" | "submitting" | "done" | "loading-entry";

interface EntryTypeOption {
  slug: string;
  label: string;
}

interface CatalogResult {
  externalId: string;
  title: string;
  about?: string;
  year?: string;
  coverUrl?: string | null;
  description?: string;
  infobox?: Record<string, string>;
}

interface Props {
  isLoggedIn: boolean;
  userTier: string | null;
  improvingSlug: string | null;
  /** Entry types fetched from WordPress — any type created in WP Admin appears here automatically. */
  entryTypes?: EntryTypeOption[];
}

export default function DirectorySubmitForm({
  isLoggedIn,
  userTier,
  improvingSlug,
  entryTypes,
}: Props) {
  const isImproveMode = !!improvingSlug;
  const isPatron = userTier === "patron";
  const ENTRY_TYPES = entryTypes?.length ? entryTypes : FALLBACK_ENTRY_TYPES;

  const [step, setStep] = useState<Step>(isImproveMode ? "loading-entry" : "input");
  const [topic, setTopic] = useState("");
  const [error, setError] = useState("");

  // Editable stub fields
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [entryType, setEntryType] = useState<string>("concept");
  const [pointsAwarded, setPointsAwarded] = useState(0);

  // Catalog-prefill state
  const [coverUrl, setCoverUrl] = useState("");
  const [externalId, setExternalId] = useState("");
  const [infobox, setInfobox] = useState<Record<string, string> | null>(null);

  // Catalog search state
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogResults, setCatalogResults] = useState<CatalogResult[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogPicked, setCatalogPicked] = useState(false);
  const catalogRef = useRef<HTMLDivElement>(null);
  const catalogTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isCatalogType = CATALOG_TYPES.has(entryType);

  // Pre-populate form when in improve mode
  useEffect(() => {
    if (!isImproveMode || !isLoggedIn || !isPatron) return;

    fetch(`/api/directory/entry?slug=${encodeURIComponent(improvingSlug!)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setStep("input");
          return;
        }
        setTitle(data.title ?? "");
        setExcerpt(data.excerpt ?? "");
        setContent(data.content ?? "");
        setEntryType(data.entryType ?? "concept");
        setStep("review");
      })
      .catch(() => {
        setError("Could not load entry for improvement. You can still submit a new entry below.");
        setStep("input");
      });
  }, [isImproveMode, improvingSlug, isLoggedIn, isPatron]);

  // Close catalog dropdown when clicking outside
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (catalogRef.current && !catalogRef.current.contains(e.target as Node)) {
        setCatalogOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  // Debounced catalog search
  const searchCatalog = useCallback(
    (q: string, type: string) => {
      if (catalogTimerRef.current) clearTimeout(catalogTimerRef.current);
      if (q.trim().length < 2) {
        setCatalogResults([]);
        setCatalogOpen(false);
        return;
      }
      catalogTimerRef.current = setTimeout(async () => {
        setCatalogLoading(true);
        try {
          const res = await fetch(
            `/api/directory/lookup?type=${encodeURIComponent(type)}&q=${encodeURIComponent(q.trim())}`
          );
          if (res.ok) {
            const results = await res.json();
            setCatalogResults(Array.isArray(results) ? results : []);
            setCatalogOpen(true);
          }
        } catch {}
        setCatalogLoading(false);
      }, 350);
    },
    []
  );

  function handleCatalogQueryChange(val: string) {
    setCatalogQuery(val);
    setCatalogPicked(false);
    searchCatalog(val, entryType);
  }

  function handleCatalogPick(result: CatalogResult) {
    setCatalogOpen(false);
    setCatalogPicked(true);
    setCatalogQuery(result.title);

    // Pre-fill form fields from catalog result
    setTitle(result.title);
    if (result.coverUrl) setCoverUrl(result.coverUrl);
    if (result.externalId) setExternalId(result.externalId);
    if (result.infobox) setInfobox(result.infobox);

    // Build a starter excerpt from description or about
    const starterExcerpt = result.description
      ? result.description.slice(0, 300).replace(/\s+\S+$/, "…")
      : result.about
      ? `${result.title} by ${result.about}${result.year ? ` (${result.year})` : ""}.`
      : "";
    setExcerpt(starterExcerpt);
    setContent("");
  }

  function handleCatalogClear() {
    setCatalogQuery("");
    setCatalogPicked(false);
    setCatalogResults([]);
    setCoverUrl("");
    setExternalId("");
    setInfobox(null);
    setTitle("");
    setExcerpt("");
    setContent("");
  }

  // When entry type changes away from a catalog type, clear catalog state
  function handleEntryTypeChange(val: string) {
    setEntryType(val);
    if (!CATALOG_TYPES.has(val)) {
      handleCatalogClear();
    } else {
      // Re-trigger search if there's already a query
      if (catalogQuery.trim().length >= 2) searchCatalog(catalogQuery, val);
    }
  }

  // ── Auth gate — not logged in ────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="dir-submit-wrap">
        <Link href="/directory" className="dir-back">
          ← Culture Directory
        </Link>
        <div className="dir-submit-auth-gate">
          <div className="dir-eyebrow">Culture Directory</div>
          <h2>Sign in to contribute</h2>
          <p>
            You need a Moveee account to submit directory entries and earn
            culture points.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <Link
              href="/login?callbackUrl=/directory/submit"
              className="dir-submit-btn"
            >
              Sign in →
            </Link>
            <Link href="/register" className="dir-secondary-btn">
              Create free account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Tier gate — logged in but not Patron ─────────────────────────────────
  if (!isPatron) {
    return (
      <div className="dir-submit-wrap">
        <Link href="/directory" className="dir-back">
          ← Culture Directory
        </Link>
        <div className="dir-submit-auth-gate">
          <div className="dir-eyebrow">Moveee Pro</div>
          <h2>Moveee Pro required</h2>
          <p>
            Building the Culture Directory is a Moveee Pro privilege. Upgrade your
            membership to contribute entries, earn points, and shape what goes
            in the archive.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <Link href="/connect/membership" className="dir-submit-btn">
              Upgrade to Moveee Pro →
            </Link>
            <Link href="/directory" className="dir-secondary-btn">
              Browse the directory
            </Link>
          </div>
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: "rgba(20,17,13,.35)",
              marginTop: 18,
            }}
          >
            Patron · <PatronPrice variant="yearly" /> · Cancel anytime
          </p>
        </div>
      </div>
    );
  }

  // ── Loading existing entry for improve mode ──────────────────────────────
  if (step === "loading-entry") {
    return (
      <div className="dir-submit-wrap">
        <div
          style={{
            padding: "64px 0",
            textAlign: "center",
            color: "rgba(20,17,13,.4)",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: ".1em",
          }}
        >
          Loading entry…
        </div>
      </div>
    );
  }

  async function handleGenerate() {
    if (!topic.trim()) return;
    setStep("generating");
    setError("");

    try {
      const res = await fetch("/api/directory/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Generation failed");
      }

      const stub = await res.json();
      setTitle(stub.title ?? topic);
      setExcerpt(stub.excerpt ?? "");
      setContent(stub.content ?? "");
      setEntryType(stub.entryType ?? "concept");
      setStep("review");
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
      setStep("input");
    }
  }

  function handleCatalogContinue() {
    if (!title.trim()) return;
    setStep("review");
  }

  async function handleSubmit() {
    if (!title.trim() || !excerpt.trim() || !content.trim()) return;
    setStep("submitting");
    setError("");

    try {
      const payload: Record<string, any> = {
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        entryType,
        aiGenerated: !isImproveMode && !catalogPicked,
        ...(isImproveMode && { improvingSlug }),
        ...(coverUrl && { coverUrl }),
        ...(externalId && { externalId }),
        ...(infobox && { infobox }),
      };

      const res = await fetch("/api/directory/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Submission failed");
      }

      const data = await res.json();
      setPointsAwarded(data.points_awarded ?? 25);
      setStep("done");
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
      setStep("review");
    }
  }

  function handleReset() {
    setStep("input");
    setTopic("");
    setTitle("");
    setExcerpt("");
    setContent("");
    setEntryType("concept");
    setError("");
    setPointsAwarded(0);
    handleCatalogClear();
  }

  const catalogTypeName = entryType === "book" ? "book" : entryType === "film" ? "film" : "album";

  return (
    <div className="dir-submit-wrap">
      {/* Header */}
      <div className="dir-submit-header">
        <Link href="/directory" className="dir-back">
          ← Culture Directory
        </Link>
        <div className="dir-eyebrow">
          {isImproveMode ? "Improve Entry" : "Community Contribution"}
        </div>
        <h1 className="dir-submit-heading">
          {isImproveMode ? "Improve a Directory Entry" : "Add a Directory Entry"}
        </h1>
        <p className="dir-submit-desc">
          {isImproveMode
            ? "Review and improve the entry below. Your revised version will be sent for editorial review. Approved improvements earn you culture points."
            : "Add a book, film, or album by searching the catalog — details fill in automatically. For everything else, type a name and generate a starter entry with AI."}
        </p>
      </div>

      {/* ── Step: Input (new entry only) ── */}
      {!isImproveMode && (step === "input" || step === "generating") && (
        <div className="dir-generate-section">

          {/* Entry type selector — shown first so the right search/input appears */}
          <div className="dir-field" style={{ marginBottom: 24 }}>
            <label className="dir-field-label" htmlFor="dir-entry-type-input">
              Entry type
            </label>
            <select
              id="dir-entry-type-input"
              className="dir-field-input"
              value={entryType}
              onChange={(e) => handleEntryTypeChange(e.target.value)}
              disabled={step === "generating"}
            >
              {ENTRY_TYPES.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Catalog search path — book, film, album */}
          {isCatalogType ? (
            <div ref={catalogRef} className="dir-catalog-search">
              <label className="dir-field-label" htmlFor="dir-catalog-q">
                Search {catalogTypeName} catalog
              </label>
              <div className="dir-catalog-input-row">
                <input
                  id="dir-catalog-q"
                  type="text"
                  className="dir-topic-input"
                  placeholder={
                    entryType === "book"
                      ? "e.g. Things Fall Apart, Giovanni's Room…"
                      : entryType === "film"
                      ? "e.g. Moonlight, Black Panther…"
                      : "e.g. Homecoming, After Hours…"
                  }
                  value={catalogQuery}
                  onChange={(e) => handleCatalogQueryChange(e.target.value)}
                  autoComplete="off"
                />
                {catalogPicked && (
                  <button
                    type="button"
                    className="dir-catalog-clear"
                    onClick={handleCatalogClear}
                    aria-label="Clear selection"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Dropdown results */}
              {catalogOpen && catalogResults.length > 0 && (
                <ul className="dir-catalog-results" role="listbox">
                  {catalogResults.map((r) => (
                    <li
                      key={r.externalId}
                      className="dir-catalog-result"
                      role="option"
                      onClick={() => handleCatalogPick(r)}
                    >
                      {r.coverUrl && (
                        <img
                          src={r.coverUrl}
                          alt=""
                          className="dir-catalog-result-thumb"
                        />
                      )}
                      <div className="dir-catalog-result-text">
                        <span className="dir-catalog-result-title">{r.title}</span>
                        {(r.about || r.year) && (
                          <span className="dir-catalog-result-meta">
                            {[r.about, r.year].filter(Boolean).join(" · ")}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {catalogLoading && (
                <p className="dir-catalog-searching">Searching…</p>
              )}

              {/* Cover preview after picking */}
              {catalogPicked && coverUrl && (
                <div className="dir-catalog-picked">
                  <img src={coverUrl} alt={title} className="dir-catalog-cover" />
                  <div className="dir-catalog-picked-info">
                    <strong>{title}</strong>
                    {excerpt && <p>{excerpt.slice(0, 120)}{excerpt.length > 120 ? "…" : ""}</p>}
                  </div>
                </div>
              )}

              {error && <p className="dir-error">{error}</p>}

              <div className="dir-generate-row" style={{ marginTop: 16 }}>
                <button
                  className="dir-generate-btn"
                  onClick={handleCatalogContinue}
                  disabled={!catalogPicked || !title.trim()}
                >
                  Continue →
                </button>
              </div>
              <p className="dir-generate-note">
                Earn 25 culture points when your entry is approved
              </p>
            </div>
          ) : (
            /* AI generate path — all other types */
            <>
              <label className="dir-field-label" htmlFor="dir-topic">
                Name or topic
              </label>
              <div className="dir-generate-row">
                <input
                  id="dir-topic"
                  type="text"
                  className="dir-topic-input"
                  placeholder="e.g. Fela Kuti, Highlife music, Lagos Island, Ankara fabric…"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && step === "input" && handleGenerate()
                  }
                  disabled={step === "generating"}
                />
                <button
                  className="dir-generate-btn"
                  onClick={handleGenerate}
                  disabled={step === "generating" || !topic.trim()}
                >
                  {step === "generating" ? "Generating…" : "Generate with AI →"}
                </button>
              </div>
              {error && <p className="dir-error">{error}</p>}
              <p className="dir-generate-note">
                Earn 25 culture points when your entry is approved
              </p>
            </>
          )}
        </div>
      )}

      {/* ── Step: Review & Edit ── */}
      {(step === "review" || step === "submitting") && (
        <div className="dir-review-section">
          {!isImproveMode && catalogPicked && (
            <div className="dir-review-notice">
              Details filled from the catalog — add your own description and content before submitting.
            </div>
          )}
          {!isImproveMode && !catalogPicked && (
            <div className="dir-review-notice">
              AI-generated stub — review and edit before submitting. Your
              corrections and additions are welcome.
            </div>
          )}
          {isImproveMode && (
            <div className="dir-review-notice">
              You are improving an existing entry. Edit any section and submit — your version goes to editorial review.
            </div>
          )}

          {/* Cover preview (catalog picks only) */}
          {coverUrl && (
            <div className="dir-review-cover">
              <img src={coverUrl} alt={title} className="dir-review-cover-img" />
            </div>
          )}

          <div className="dir-field">
            <label className="dir-field-label" htmlFor="dir-title">
              Title
            </label>
            <input
              id="dir-title"
              type="text"
              className="dir-field-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={step === "submitting"}
            />
          </div>

          <div className="dir-field">
            <label className="dir-field-label" htmlFor="dir-entry-type">
              Entry type
            </label>
            <select
              id="dir-entry-type"
              className="dir-field-input"
              value={entryType}
              onChange={(e) => setEntryType(e.target.value)}
              disabled={step === "submitting"}
            >
              {ENTRY_TYPES.map(t => (
                <option key={t.slug} value={t.slug}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="dir-field">
            <label className="dir-field-label" htmlFor="dir-excerpt">
              Summary{" "}
              <span style={{ fontWeight: 400, opacity: 0.6 }}>
                (1–2 sentences, plain text)
              </span>
            </label>
            <textarea
              id="dir-excerpt"
              className="dir-field-textarea"
              rows={3}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              disabled={step === "submitting"}
            />
          </div>

          <div className="dir-field">
            <label className="dir-field-label" htmlFor="dir-content">
              Full entry{" "}
              <span style={{ fontWeight: 400, opacity: 0.6 }}>
                (HTML — uses &lt;p&gt;, &lt;h2&gt;, &lt;ul&gt; tags)
              </span>
            </label>
            <textarea
              id="dir-content"
              className="dir-field-textarea dir-field-textarea--tall"
              rows={14}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={step === "submitting"}
            />
          </div>

          {error && <p className="dir-error">{error}</p>}

          <div className="dir-review-actions">
            <button
              className="dir-submit-btn"
              onClick={handleSubmit}
              disabled={
                step === "submitting" ||
                !title.trim() ||
                !excerpt.trim() ||
                !content.trim()
              }
            >
              {step === "submitting"
                ? "Submitting…"
                : isImproveMode
                ? "Submit Improvement →"
                : "Submit for Review →"}
            </button>
            {!isImproveMode && (
              <button
                className="dir-secondary-btn"
                onClick={handleReset}
                disabled={step === "submitting"}
              >
                ← Start over
              </button>
            )}
            {isImproveMode && (
              <Link href="/directory" className="dir-secondary-btn">
                Cancel
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Step: Done ── */}
      {step === "done" && (
        <div className="dir-success">
          <div className="dir-success-icon">✓</div>
          <h2>
            {isImproveMode ? "Improvement submitted!" : "Entry submitted!"}
          </h2>
          <p>
            {isImproveMode
              ? "Your improved version is pending editorial review. Once accepted, the entry will be updated."
              : "Your entry is pending editorial review. Once approved, it will appear in the Culture Directory."}
          </p>
          <div className="dir-success-points">
            +{pointsAwarded} culture points earned
          </div>
          <div
            className="dir-review-actions"
            style={{ justifyContent: "center" }}
          >
            <Link href="/directory" className="dir-submit-btn">
              Browse the Directory →
            </Link>
            {!isImproveMode && (
              <button className="dir-secondary-btn" onClick={handleReset}>
                Add another entry
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
