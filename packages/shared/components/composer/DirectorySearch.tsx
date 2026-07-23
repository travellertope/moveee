"use client";

import { useState, useRef, useEffect } from "react";
import AudioPreviewButton from "../pulse/AudioPreviewButton";

interface DirectoryResult {
  id: number;
  title: string;
  slug: string;
  type: string;
  thumbnail: string | null;
  city?: string;
  /** Generic labelled bio field — Author for books, Artist for music,
   * Director for film, … whatever aboutFieldLabel was set to. */
  about?: string;
  /** Spotify 30s track preview (Music Review only). */
  previewUrl?: string | null;
  /** TMDB genres pre-mapped to the composer's own FILM_GENRES vocabulary
   * (Film Review only) — a suggestion to pre-select genre chips with, not a
   * final answer; the reviewer can still add/remove freely. */
  genres?: string[];
}

/** Normalized shape every /api/external/{source}/search proxy returns,
 * regardless of the upstream API's own response shape. */
interface ExternalResult {
  externalId: string;
  title: string;
  about?: string;
  year?: string;
  coverUrl?: string | null;
  genres?: string[];
}

interface Props {
  value: DirectoryResult | null;
  onChange: (entry: DirectoryResult | null) => void;
  typeFilter?: string;
  placeholder?: string;
  /** Show a labelled field ("Author", "Artist", "Director", …) instead of
   * City on the quick-create form. */
  aboutFieldLabel?: string;
  /** When set, also searches this external catalog alongside the local
   * directory and offers each result as a one-tap create (prefilled
   * title/about/cover, deduped server-side by external ID) — no manual
   * quick-create form needed for these. */
  externalSource?: "google_books" | "spotify" | "tmdb";
}

export default function DirectorySearch({ value, onChange, typeFilter, placeholder, aboutFieldLabel, externalSource }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DirectoryResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  // quick-create city/about step
  const [showCityInput, setShowCityInput] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [aboutInput, setAboutInput] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // External catalog search (Google Books/Spotify/TMDB)
  const [externalResults, setExternalResults] = useState<ExternalResult[]>([]);
  const [externalLoading, setExternalLoading] = useState(false);
  const [creatingExternalId, setCreatingExternalId] = useState<string | null>(null);
  const externalTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: query });
        if (typeFilter) params.set("type", typeFilter);
        const res = await fetch(`/api/directory/search?${params}`);
        if (res.ok) setResults(await res.json());
      } catch {}
      setLoading(false);
    }, 300);
  }, [query, typeFilter]);

  useEffect(() => {
    if (!externalSource || query.length < 2) { setExternalResults([]); return; }
    if (externalTimerRef.current) clearTimeout(externalTimerRef.current);
    externalTimerRef.current = setTimeout(async () => {
      setExternalLoading(true);
      try {
        const res = await fetch(`/api/external/${externalSource}/search?q=${encodeURIComponent(query)}`);
        if (res.ok) setExternalResults(await res.json());
      } catch {}
      setExternalLoading(false);
    }, 350);
  }, [query, externalSource]);

  function select(entry: DirectoryResult) {
    onChange(entry);
    setQuery("");
    setResults([]);
    setExternalResults([]);
    setOpen(false);
    setShowCityInput(false);
    setCityInput("");
    setAboutInput("");
  }

  async function quickCreate() {
    if (!query.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/directory/quick-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: query.trim(),
          entry_type: typeFilter || "place",
          city: aboutFieldLabel ? undefined : cityInput.trim() || undefined,
          about_label: aboutFieldLabel || undefined,
          about_value: aboutFieldLabel ? aboutInput.trim() || undefined : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        select({
          id: data.id,
          title: data.title,
          slug: data.slug,
          type: typeFilter || "place",
          thumbnail: null,
          city: aboutFieldLabel ? undefined : cityInput.trim() || undefined,
          about: aboutFieldLabel ? aboutInput.trim() || undefined : undefined,
        });
        // Fire AI enrichment in the background — do not await
        fetch("/api/directory/enrich-stub", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: data.id, title: data.title, entry_type: typeFilter || "place" }),
        }).catch(() => {});
      }
    } catch {}
    setCreating(false);
  }

  async function selectExternal(r: ExternalResult) {
    if (!externalSource) return;
    setCreatingExternalId(r.externalId);
    try {
      // Spotify only — album search results carry no track data, so the
      // 30s preview clip is resolved lazily here, just for the picked
      // album, rather than fanning out one extra call per search result.
      let previewUrl: string | null = null;
      if (externalSource === "spotify") {
        const previewRes = await fetch(`/api/external/spotify/preview?albumId=${encodeURIComponent(r.externalId)}`).catch(() => null);
        if (previewRes?.ok) previewUrl = (await previewRes.json())?.previewUrl ?? null;
      }

      // TMDB only — search results carry no crew data, so the director is
      // resolved lazily here, just for the picked film, same reasoning as
      // Spotify's preview lookup above.
      let about = r.about;
      if (externalSource === "tmdb") {
        const creditsRes = await fetch(`/api/external/tmdb/credits?movieId=${encodeURIComponent(r.externalId)}`).catch(() => null);
        if (creditsRes?.ok) about = (await creditsRes.json())?.director ?? undefined;
      }

      const res = await fetch("/api/directory/quick-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: r.title,
          entry_type: typeFilter || "place",
          about_label: aboutFieldLabel || undefined,
          about_value: about || undefined,
          external_source: externalSource,
          external_id: r.externalId,
          cover_image_url: r.coverUrl || undefined,
          preview_url: previewUrl || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        select({
          id: data.id,
          title: data.title,
          slug: data.slug,
          type: typeFilter || "place",
          thumbnail: r.coverUrl || null,
          about: data.about || r.about || undefined,
          previewUrl: data.previewUrl ?? previewUrl ?? null,
          genres: r.genres,
        });
      }
    } catch {}
    setCreatingExternalId(null);
  }

  if (value) {
    return (
      <div className="composer-dir-selected">
        {value.thumbnail && <img src={value.thumbnail} alt="" className="composer-dir-selected-thumb" />}
        <span className="composer-dir-selected-name">
          {value.title}
          {value.about && <span className="composer-dir-selected-city">, {value.about}</span>}
          {!value.about && value.city && <span className="composer-dir-selected-city">, {value.city}</span>}
        </span>
        {value.previewUrl && <AudioPreviewButton src={value.previewUrl} />}
        <button type="button" className="composer-dir-clear" onClick={() => onChange(null)}>×</button>
      </div>
    );
  }

  const externalSourceLabel = externalSource === "google_books" ? "Google Books" : externalSource === "spotify" ? "Spotify" : "TMDB";

  return (
    <div className="composer-dir-search">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setShowCityInput(false); setCityInput(""); setAboutInput(""); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder ?? "Search the directory..."}
        className="composer-dir-input"
      />
      {open && query.length >= 2 && (
        <div className="composer-dir-dropdown">
          {loading && <div className="composer-dir-loading">Searching...</div>}

          {results.map((r) => (
            <button key={r.id} type="button" className="composer-dir-result" onClick={() => select(r)}>
              {r.thumbnail && <img src={r.thumbnail} alt="" className="composer-dir-thumb" />}
              <span className="composer-dir-result-text">
                <span className="composer-dir-result-title">{r.title}</span>
                {r.about ? <span className="composer-dir-result-city">{r.about}</span> : r.city && <span className="composer-dir-result-city">{r.city}</span>}
              </span>
              {r.type && <span className="composer-dir-result-type">{r.type}</span>}
            </button>
          ))}

          {externalSource && (externalLoading || externalResults.length > 0) && (
            <div className="composer-dir-external-group">
              <div className="composer-dir-external-label">From {externalSourceLabel}</div>
              {externalLoading && <div className="composer-dir-loading">Searching...</div>}
              {externalResults.map((r) => (
                <button
                  key={r.externalId}
                  type="button"
                  className="composer-dir-result"
                  disabled={creatingExternalId === r.externalId}
                  onClick={() => selectExternal(r)}
                >
                  {r.coverUrl && <img src={r.coverUrl} alt="" className="composer-dir-thumb" />}
                  <span className="composer-dir-result-text">
                    <span className="composer-dir-result-title">{r.title}</span>
                    {(r.about || r.year) && (
                      <span className="composer-dir-result-city">
                        {[r.about, r.year].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </span>
                  {creatingExternalId === r.externalId && <span className="composer-dir-result-type">Adding…</span>}
                </button>
              ))}
            </div>
          )}

          {!loading && !externalLoading && (
            <div className="composer-dir-empty">
              {!showCityInput ? (
                <>
                  {results.length === 0 && externalResults.length === 0 && <span>No matches for &ldquo;{query}&rdquo;.</span>}
                  <button
                    type="button"
                    onClick={() => setShowCityInput(true)}
                    className="composer-dir-create-btn"
                  >
                    + Add &ldquo;{query}&rdquo; manually
                  </button>
                </>
              ) : (
                <div className="composer-dir-city-form">
                  {aboutFieldLabel ? (
                    <>
                      <label className="composer-dir-city-label">{aboutFieldLabel} <span>(optional)</span></label>
                      <input
                        type="text"
                        value={aboutInput}
                        onChange={e => setAboutInput(e.target.value)}
                        placeholder={aboutFieldLabel}
                        className="composer-dir-city-input"
                        autoFocus
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); quickCreate(); } }}
                      />
                    </>
                  ) : (
                    <>
                      <label className="composer-dir-city-label">City or neighbourhood <span>(optional)</span></label>
                      <input
                        type="text"
                        value={cityInput}
                        onChange={e => setCityInput(e.target.value)}
                        placeholder="e.g. London, Lagos, Brixton"
                        className="composer-dir-city-input"
                        autoFocus
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); quickCreate(); } }}
                      />
                    </>
                  )}
                  <div className="composer-dir-city-actions">
                    <button
                      type="button"
                      onClick={quickCreate}
                      disabled={creating}
                      className="composer-dir-create-btn"
                    >
                      {creating ? "Creating..." : "Create entry"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowCityInput(false); setCityInput(""); setAboutInput(""); }}
                      className="composer-dir-cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
