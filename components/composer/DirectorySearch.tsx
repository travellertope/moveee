"use client";

import { useState, useRef, useEffect } from "react";

interface DirectoryResult {
  id: number;
  title: string;
  slug: string;
  type: string;
  thumbnail: string | null;
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
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

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
  }

  async function quickCreate() {
    if (!query.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/directory/quick-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: query.trim(), entry_type: typeFilter || "place" }),
      });
      if (res.ok) {
        const data = await res.json();
        select({ id: data.id, title: data.title, slug: data.slug, type: typeFilter || "place", thumbnail: null });
      }
    } catch {}
    setCreating(false);
  }

  if (value) {
    return (
      <div className="composer-dir-selected">
        <span className="composer-dir-selected-name">{value.title}</span>
        <button type="button" className="composer-dir-clear" onClick={() => onChange(null)}>×</button>
      </div>
    );
  }

  return (
    <div className="composer-dir-search">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder ?? "Search the directory..."}
        className="composer-dir-input"
      />
      {open && query.length >= 2 && (
        <div className="composer-dir-dropdown">
          {loading && <div className="composer-dir-loading">Searching...</div>}
          {!loading && results.length === 0 && (
            <div className="composer-dir-empty">
              <span>No matches found.</span>
              <button type="button" onClick={quickCreate} disabled={creating} className="composer-dir-create-btn">
                {creating ? "Creating..." : `+ Add "${query}" to directory`}
              </button>
            </div>
          )}
          {results.map((r) => (
            <button key={r.id} type="button" className="composer-dir-result" onClick={() => select(r)}>
              {r.thumbnail && <img src={r.thumbnail} alt="" className="composer-dir-thumb" />}
              <span className="composer-dir-result-title">{r.title}</span>
              {r.type && <span className="composer-dir-result-type">{r.type}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
