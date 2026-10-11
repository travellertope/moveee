"use client";

import { useState, useRef, useEffect } from "react";

interface PlaceResult {
  placeId: string;
  displayAddress: string;
  street: string;
  city: string;
  country: string;
  lat: number | null;
  lng: number | null;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  onPlaceSelect: (place: PlaceResult) => void;
  onBlur?: () => void;
  className?: string;
  placeholder?: string;
}

export default function StoopPlacesInput({
  value, onChange, onPlaceSelect, onBlur, className, placeholder,
}: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState(false);
  const [selected, setSelected] = useState<PlaceResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (manual || selected || query.length < 2) { setResults([]); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/external/google_places/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          if (data.length > 0) setOpen(true);
        }
      } catch {}
      setLoading(false);
    }, 350);
  }, [query, manual, selected]);

  function pickPlace(r: any) {
    const place: PlaceResult = {
      placeId: r.externalId,
      displayAddress: r.about || r.title,
      street: r.street || r.title,
      city: r.city || "",
      country: r.country || "",
      lat: r.lat ?? null,
      lng: r.lng ?? null,
    };
    setSelected(place);
    setOpen(false);
    setQuery("");
    onPlaceSelect(place);
    onChange(place.street);
  }

  function clear() {
    setSelected(null);
    setManual(false);
    setQuery("");
    setResults([]);
    onChange("");
  }

  function enterManually() {
    setManual(true);
    setOpen(false);
    setQuery(value);
  }

  // Chip — place was selected via autocomplete
  if (selected) {
    return (
      <div className="stoop-places-chip">
        <span className="stoop-places-chip-icon" aria-hidden="true">📍</span>
        <span className="stoop-places-chip-text">{selected.displayAddress}</span>
        <button type="button" className="stoop-places-chip-clear" onClick={clear} aria-label="Clear place">×</button>
      </div>
    );
  }

  // Manual mode — plain text, Nominatim geocodes on blur
  if (manual) {
    return (
      <input
        type="text"
        className={className}
        placeholder={placeholder ?? "e.g. 14 Rye Lane"}
        value={value}
        onChange={(e) => { onChange(e.target.value); setQuery(e.target.value); }}
        onBlur={onBlur}
        autoComplete="off"
      />
    );
  }

  // Search mode — autocomplete
  return (
    <div className="stoop-places-wrap">
      <input
        type="text"
        className={className}
        placeholder={placeholder ?? "Search for a street or venue…"}
        value={query}
        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => { if (results.length > 0) setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
      />
      {open && query.length >= 2 && (
        <div className="stoop-places-dropdown">
          {loading && (
            <div className="stoop-places-row stoop-places-row--muted">Searching…</div>
          )}
          {!loading && results.map((r) => (
            <button
              key={r.externalId}
              type="button"
              className="stoop-places-row"
              onMouseDown={(e) => { e.preventDefault(); pickPlace(r); }}
            >
              <span className="stoop-places-row-icon" aria-hidden="true">📍</span>
              <span className="stoop-places-row-text">
                <span className="stoop-places-row-name">{r.title}</span>
                {r.about && <span className="stoop-places-row-addr">{r.about}</span>}
              </span>
            </button>
          ))}
          {!loading && results.length === 0 && (
            <div className="stoop-places-row stoop-places-row--muted">No results for "{query}"</div>
          )}
          <button
            type="button"
            className="stoop-places-row stoop-places-row--manual"
            onMouseDown={(e) => { e.preventDefault(); enterManually(); }}
          >
            ✏️ Enter address manually
          </button>
        </div>
      )}
    </div>
  );
}
