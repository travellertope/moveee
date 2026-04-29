"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function PulseAdminPage() {
  const { data: session, status } = useSession();
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

  const handleRefresh = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/pulse/admin-refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        // Vercel killed the function (504 timeout) — body is HTML, not JSON.
        setResult({
          error: `Request timed out (HTTP ${res.status}). Gemini took too long — try again or use a more specific topic.`,
        });
        return;
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({ error: `Network error: ${err?.message ?? "could not reach the refresh endpoint."}` });
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

        {/* Loading auth state */}
        {status === "loading" && (
          <p style={{ color: "#555", fontSize: "0.85rem" }}>Checking session…</p>
        )}

        {/* Not signed in */}
        {status === "unauthenticated" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ color: "#888", fontSize: "0.85rem" }}>
              You must be signed in to access Pulse Admin.
            </p>
            <Link
              href="/login?callbackUrl=/pulse/admin"
              style={{
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
              }}
            >
              Sign in
            </Link>
          </div>
        )}

        {/* Signed in */}
        {status === "authenticated" && (
          <form onSubmit={handleRefresh} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <p style={{ color: "#444", fontSize: "0.72rem" }}>
              Signed in as <span style={{ color: "#D4A847" }}>{session.user?.email}</span>
            </p>

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
