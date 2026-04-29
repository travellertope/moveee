"use client";

import { useState, useEffect } from "react";

const SESSION_KEY = "pulse_admin_secret";

export default function PulseAdminPage() {
  const [secret, setSecret] = useState("");
  const [topic, setTopic] = useState("African and Black diaspora culture news");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    saved?: number;
    duplicates?: number;
    errors?: number;
    errorSample?: string[];
    total?: number;
    error?: string;
  } | null>(null);
  const [authed, setAuthed] = useState(false);

  // Restore secret from sessionStorage on mount (survives page reloads).
  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      setSecret(stored);
      setAuthed(true);
    }
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = secret.trim();
    if (!trimmed) return;
    sessionStorage.setItem(SESSION_KEY, trimmed);
    setSecret(trimmed);
    setAuthed(true);
  };

  const handleLock = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
    setSecret("");
    setResult(null);
  };

  const handleRefresh = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`/api/pulse/refresh?secret=${encodeURIComponent(secret.trim())}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });
      const data = await res.json();

      // If we get 401, clear the stored secret so the user must re-enter.
      if (res.status === 401) {
        sessionStorage.removeItem(SESSION_KEY);
        setAuthed(false);
        setSecret("");
      }

      setResult(data);
    } catch {
      setResult({ error: "Network error — could not reach the refresh endpoint." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "#0d0d0d",
        minHeight: "100vh",
        color: "#e0dcd4",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "480px" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontFamily: "var(--font-fraunces), serif",
              fontSize: "1.6rem",
              fontWeight: 700,
              color: "#f0ece4",
              marginBottom: "0.4rem",
            }}
          >
            Pulse Admin
          </h1>
          <p style={{ color: "#555", fontSize: "0.82rem" }}>
            Manually trigger a Moveee Pulse content refresh.
          </p>
        </div>

        {!authed ? (
          <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label
                htmlFor="admin-secret"
                style={{ display: "block", color: "#666", fontSize: "0.72rem", marginBottom: "0.35rem" }}
              >
                Refresh secret
              </label>
              <input
                id="admin-secret"
                type="password"
                required
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                style={inputStyle}
                placeholder="Enter your PULSE_REFRESH_SECRET"
                autoFocus
              />
            </div>
            <button type="submit" style={btnStyle(false)}>
              Unlock
            </button>
          </form>
        ) : (
          <form onSubmit={handleRefresh} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Keep secret editable so it can be corrected without locking out */}
            <div>
              <label
                htmlFor="admin-secret-edit"
                style={{ display: "block", color: "#666", fontSize: "0.72rem", marginBottom: "0.35rem" }}
              >
                Refresh secret
              </label>
              <input
                id="admin-secret-edit"
                type="password"
                required
                value={secret}
                onChange={(e) => {
                  setSecret(e.target.value);
                  sessionStorage.setItem(SESSION_KEY, e.target.value);
                }}
                style={inputStyle}
                placeholder="PULSE_REFRESH_SECRET"
              />
            </div>

            <div>
              <label
                htmlFor="admin-topic"
                style={{ display: "block", color: "#666", fontSize: "0.72rem", marginBottom: "0.35rem" }}
              >
                Topic (optional)
              </label>
              <input
                id="admin-topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                style={inputStyle}
                placeholder="e.g. Afrobeats music news"
              />
              <p style={{ color: "#444", fontSize: "0.65rem", marginTop: "0.3rem" }}>
                Leave as default to pull stories across all arms and regions.
              </p>
            </div>

            <button type="submit" disabled={loading} style={btnStyle(loading)}>
              {loading ? "Refreshing…" : "Trigger refresh"}
            </button>

            {result && (
              <div
                style={{
                  background: result.error ? "#1a0a0a" : "#0a1a0a",
                  border: `1px solid ${result.error ? "#3a1010" : "#103a10"}`,
                  borderRadius: "2px",
                  padding: "1rem",
                  fontSize: "0.82rem",
                }}
              >
                {result.error ? (
                  <p style={{ color: "#e05a4e", margin: 0 }}>Error: {result.error}</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <p style={{ color: result.saved! > 0 ? "#4caf77" : "#D4A847", margin: 0, fontWeight: 600 }}>
                      {result.saved! > 0 ? "Refresh complete" : "Refresh ran — no new stories saved"}
                    </p>
                    <p style={{ color: "#888", margin: 0 }}>
                      {result.saved} saved · {result.duplicates} duplicates · {result.errors} errors · {result.total} from Gemini
                    </p>
                    {result.errors! > 0 && result.errorSample && (
                      <div style={{ marginTop: "0.25rem" }}>
                        {result.errorSample.map((msg, i) => (
                          <p key={i} style={{ color: "#e05a4e", fontSize: "0.75rem", margin: "0.15rem 0", fontFamily: "monospace" }}>
                            {msg}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleLock}
              style={{
                background: "transparent",
                border: "none",
                color: "#444",
                fontSize: "0.72rem",
                cursor: "pointer",
                textDecoration: "underline",
                padding: 0,
                textAlign: "left",
              }}
            >
              Lock
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#141414",
  border: "1px solid #2a2a2a",
  borderRadius: "2px",
  color: "#e0dcd4",
  fontSize: "0.85rem",
  padding: "0.6rem 0.8rem",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
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
