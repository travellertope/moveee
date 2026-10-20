"use client";
import { useEffect, useState } from "react";

type State = "loading" | "success" | "already" | "error";

export default function EventCheckinClient({
  eventId,
  token,
}: {
  eventId: string;
  token: string;
}) {
  const [state, setState] = useState<State>("loading");
  const [msg, setMsg] = useState("");
  const [rep, setRep] = useState(0);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    fetch("/api/events/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: eventId, token }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.already_checked_in) {
          setState("already");
          setMsg(d.message ?? "You have already checked in.");
        } else if (d.success) {
          setState("success");
          setMsg(d.message ?? "Check-in successful!");
          setRep(d.rep_earned ?? 20);
          setCredits(d.credits_earned ?? 3);
        } else {
          setState("error");
          setMsg(d.message ?? "Check-in failed. Please try again.");
        }
      })
      .catch(() => {
        setState("error");
        setMsg("Network error. Please try again.");
      });
  }, [eventId, token]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--paper)",
        fontFamily: "var(--font-sans, sans-serif)",
      }}
    >
      <div style={{ maxWidth: 400, width: "90%", textAlign: "center", padding: "2rem" }}>
        {state === "loading" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <p style={{ color: "var(--ink-soft)" }}>Checking you in…</p>
          </>
        )}

        {state === "success" && (
          <>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h1 style={{ color: "var(--ink)", fontSize: "1.5rem", margin: "0 0 0.5rem" }}>
              You're checked in!
            </h1>
            <p style={{ color: "var(--ink-soft)", marginBottom: "1.5rem" }}>{msg}</p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <div
                style={{
                  background: "var(--ochre, #b38238)",
                  color: "#fff",
                  borderRadius: 12,
                  padding: "0.75rem 1.25rem",
                  minWidth: 90,
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 700 }}>+{rep}</div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>Points</div>
              </div>
              <div
                style={{
                  background: "#16a34a",
                  color: "#fff",
                  borderRadius: 12,
                  padding: "0.75rem 1.25rem",
                  minWidth: 90,
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 700 }}>+{credits}</div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>Credits</div>
              </div>
            </div>
            <a
              href="/events"
              style={{ display: "block", marginTop: "2rem", color: "var(--ochre, #b38238)", textDecoration: "none" }}
            >
              ← Back to Events
            </a>
          </>
        )}

        {state === "already" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h1 style={{ color: "var(--ink)", fontSize: "1.5rem", margin: "0 0 0.5rem" }}>
              Already checked in
            </h1>
            <p style={{ color: "var(--ink-soft)" }}>{msg}</p>
            <a
              href="/events"
              style={{ display: "block", marginTop: "2rem", color: "var(--ochre, #b38238)", textDecoration: "none" }}
            >
              ← Back to Events
            </a>
          </>
        )}

        {state === "error" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h1 style={{ color: "var(--ink)", fontSize: "1.5rem", margin: "0 0 0.5rem" }}>
              Check-in failed
            </h1>
            <p style={{ color: "var(--ink-soft)" }}>{msg}</p>
            <a
              href="/events"
              style={{ display: "block", marginTop: "2rem", color: "var(--ochre, #b38238)", textDecoration: "none" }}
            >
              ← Back to Events
            </a>
          </>
        )}
      </div>
    </div>
  );
}
