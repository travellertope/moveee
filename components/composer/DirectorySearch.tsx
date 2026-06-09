"use client";

import { useState, useRef, useEffect } from "react";

interface DirectoryResult {
  id: number;
  title: string;
  slug: string;
  type: string;
  thumbnail: string | null;
  city?: string;
}

interface Props {
  value: DirectoryResult | null;
  onChange: (entry: DirectoryResult | null) => void;
  typeFilter?: string;
  placeholder?: string;
}

export default function DirectorySearch({ value, onChange, typeFilter, placeholder }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DirectoryResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  // quick-create city step
  const [showCityInput, setShowCityInput] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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

  function select(entry: DirectoryResult) {
    onChange(entry);
    setQuery("");
    setResults([]);
    setOpen(false);
    setShowCityInput(false);
    setCityInput("");
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
          city: cityInput.trim() || undefined,
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
          city: cityInput.trim() || undefined,
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

  if (value) {
    return (
      <div className="composer-dir-selected">
        <span className="composer-dir-selected-name">
          {value.title}
          {value.city && <span className="composer-dir-selected-city">, {value.city}</span>}
        </span>
        <button type="button" className="composer-dir-clear" onClick={() => onChange(null)}>×</button>
      </div>
    );
  }

  return (
    <div className="composer-dir-search">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setShowCityInput(false); setCityInput(""); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder ?? "Search the directory..."}
        className="composer-dir-input"
      />
      {open && query.length >= 2 && (
        <div className="composer-dir-dropdown">
          {loading && <div className="composer-dir-loading">Searching...</div>}
          {!loading && results.length === 0 && (
            <div className="composer-dir-empty">
              {!showCityInput ? (
                <>
                  <span>No matches for &ldquo;{query}&rdquo;.</span>
                  <button
                    type="button"
                    onClick={() => setShowCityInput(true)}
                    className="composer-dir-create-btn"
                  >
                    + Add &ldquo;{query}&rdquo; to directory
                  </button>
                </>
              ) : (
                <div className="composer-dir-city-form">
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
                      onClick={() => { setShowCityInput(false); setCityInput(""); }}
                      className="composer-dir-cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {results.map((r) => (
            <button key={r.id} type="button" className="composer-dir-result" onClick={() => select(r)}>
              {r.thumbnail && <img src={r.thumbnail} alt="" className="composer-dir-thumb" />}
              <span className="composer-dir-result-text">
                <span className="composer-dir-result-title">{r.title}</span>
                {r.city && <span className="composer-dir-result-city">{r.city}</span>}
              </span>
              {r.type && <span className="composer-dir-result-type">{r.type}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
