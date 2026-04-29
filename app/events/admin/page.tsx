"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

const ALL_CITIES = [
  "London", "Lagos", "Accra", "New York",
  "Nairobi", "Paris", "Johannesburg", "Toronto",
];

type CityResult = { found: number; submitted: number; skipped: number; errors: string[] };
type RunResult  = { success?: boolean; submitted?: number; cities?: string[]; detail?: Record<string, CityResult>; error?: string };

export default function EventsAdminPage() {
  const { data: session, status } = useSession();
  const [selected, setSelected]   = useState<string[]>(ALL_CITIES);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<RunResult | null>(null);

  const toggle = (city: string) =>
    setSelected((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected.length) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/events/admin-seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cities: selected }),
      });

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        setResult({ error: `Request timed out (HTTP ${res.status}). Try fewer cities at once.` });
        return;
      }
      setResult(await res.json());
    } catch (err: any) {
      setResult({ error: `Network error: ${err?.message ?? "could not reach the endpoint."}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={{ width: "100%", maxWidth: 560 }}>

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={headingStyle}>Events Admin</h1>
          <p style={{ color: "#555", fontSize: "0.82rem" }}>
            Crawl the web for upcoming happenings and seed them into the CMS.
          </p>
        </div>

        {status === "loading" && <p style={{ color: "#555", fontSize: "0.85rem" }}>Checking session…</p>}

        {status === "unauthenticated" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ color: "#888", fontSize: "0.85rem" }}>You must be signed in to use Events Admin.</p>
            <Link href="/login?callbackUrl=/events/admin" style={ctaLinkStyle}>Sign in</Link>
          </div>
        )}

        {status === "authenticated" && (
          <form onSubmit={handleRun} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <p style={{ color: "#444", fontSize: "0.72rem" }}>
              Signed in as <span style={{ color: "#D4A847" }}>{session.user?.email}</span>
            </p>

            {/* City selector */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                <label style={{ color: "#666", fontSize: "0.72rem" }}>Cities to seed</label>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button type="button" onClick={() => setSelected([...ALL_CITIES])} style={ghostBtn}>All</button>
                  <button type="button" onClick={() => setSelected([])} style={ghostBtn}>None</button>
                </div>
              </div>
              <div style={cityGridStyle}>
                {ALL_CITIES.map((city) => (
                  <label key={city} style={cityLabelStyle(selected.includes(city))}>
                    <input
                      type="checkbox"
                      checked={selected.includes(city)}
                      onChange={() => toggle(city)}
                      style={{ display: "none" }}
                    />
                    {city}
                  </label>
                ))}
              </div>
              <p style={{ color: "#444", fontSize: "0.65rem", marginTop: "0.4rem" }}>
                {selected.length} of {ALL_CITIES.length} cities selected · each city runs ~4 searches
              </p>
            </div>

            <button type="submit" disabled={loading || !selected.length} style={btnStyle(loading || !selected.length)}>
              {loading ? "Seeding — this takes a minute…" : `Seed ${selected.length} cit${selected.length === 1 ? "y" : "ies"}`}
            </button>

            {/* Results */}
            {result && (
              <div style={resultBox(!!result.error)}>
                {result.error ? (
                  <p style={{ color: "#e05a4e", margin: 0 }}>Error: {result.error}</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <p style={{ color: result.submitted! > 0 ? "#4caf77" : "#D4A847", margin: 0, fontWeight: 600 }}>
                      {result.submitted! > 0
                        ? `${result.submitted} event${result.submitted === 1 ? "" : "s"} added to CMS`
                        : "Run complete — no new events added"}
                    </p>

                    {/* Per-city breakdown */}
                    {result.detail && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        {Object.entries(result.detail).map(([city, r]) => (
                          <div key={city} style={cityRowStyle}>
                            <span style={{ color: "#aaa", minWidth: 120 }}>{city}</span>
                            <span style={{ color: "#4caf77" }}>{r.submitted} added</span>
                            <span style={{ color: "#555" }}>{r.found} found</span>
                            <span style={{ color: "#555" }}>{r.skipped} skipped</span>
                            {r.errors.length > 0 && (
                              <span style={{ color: "#e05a4e" }}>{r.errors.length} err</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Error detail */}
                    {result.detail && Object.values(result.detail).some((r) => r.errors.length > 0) && (
                      <div style={{ marginTop: "0.25rem", borderTop: "1px solid #222", paddingTop: "0.5rem" }}>
                        <p style={{ color: "#555", fontSize: "0.7rem", marginBottom: "0.3rem" }}>Skipped / errors:</p>
                        {Object.entries(result.detail).flatMap(([, r]) => r.errors).map((msg, i) => (
                          <p key={i} style={{ color: "#666", fontSize: "0.68rem", margin: "0.1rem 0", fontFamily: "monospace" }}>{msg}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  background: "#0d0d0d",
  minHeight: "100vh",
  color: "#e0dcd4",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "2rem 1.5rem",
};

const headingStyle: React.CSSProperties = {
  fontFamily: "var(--font-fraunces), serif",
  fontSize: "1.6rem",
  fontWeight: 700,
  color: "#f0ece4",
  marginBottom: "0.4rem",
};

const ctaLinkStyle: React.CSSProperties = {
  background: "#D4A847",
  color: "#0d0d0d",
  padding: "0.7rem 1.5rem",
  fontSize: "0.75rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  borderRadius: "2px",
  textDecoration: "none",
  display: "inline-block",
  textAlign: "center",
};

const cityGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "0.5rem",
};

const cityLabelStyle = (active: boolean): React.CSSProperties => ({
  padding: "0.45rem 0.6rem",
  fontSize: "0.72rem",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  cursor: "pointer",
  border: `1px solid ${active ? "#D4A847" : "#2a2a2a"}`,
  color: active ? "#D4A847" : "#555",
  background: active ? "rgba(212,168,71,0.08)" : "transparent",
  borderRadius: "2px",
  textAlign: "center",
  userSelect: "none",
  transition: "all 0.15s",
});

const ghostBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#555",
  fontSize: "0.7rem",
  cursor: "pointer",
  textDecoration: "underline",
  padding: 0,
};

const cityRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "1rem",
  fontSize: "0.78rem",
  fontFamily: "monospace",
  alignItems: "center",
};

function btnStyle(disabled: boolean): React.CSSProperties {
  return {
    background: disabled ? "#2a2a2a" : "#D4A847",
    color: disabled ? "#666" : "#0d0d0d",
    border: "none",
    padding: "0.7rem 1.5rem",
    fontSize: "0.75rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    cursor: disabled ? "not-allowed" : "pointer",
    borderRadius: "2px",
    width: "100%",
  };
}

function resultBox(isError: boolean): React.CSSProperties {
  return {
    background: isError ? "#1a0a0a" : "#0a1a0a",
    border: `1px solid ${isError ? "#3a1010" : "#103a10"}`,
    borderRadius: "2px",
    padding: "1rem",
    fontSize: "0.82rem",
  };
}
