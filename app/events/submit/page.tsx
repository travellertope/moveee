"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function EventSubmitPage() {
  const { data: session, status } = useSession();
  const [form, setForm] = useState({
    title: "",
    event_date: "",
    end_date: "",
    location: "",
    city: "",
    description: "",
    admission: "",
    ticketing_url: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const loggedIn = status === "authenticated";

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.event_date || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/events/member-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed.");
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const input: React.CSSProperties = {
    width: "100%", background: "#fff", border: "1px solid #e0d8ce",
    borderRadius: "3px", color: "#14110d", fontSize: "0.9rem",
    padding: "0.6rem 0.85rem", outline: "none", boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const label: React.CSSProperties = {
    display: "block", fontSize: "0.65rem", fontWeight: 700,
    letterSpacing: "0.12em", textTransform: "uppercase", color: "#7a6f5c",
    marginBottom: "0.35rem",
  };

  return (
    <div style={{ background: "#f7f5f2", minHeight: "100vh", padding: "2.5rem 1.5rem 5rem" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <Link href="/pulse" style={{
          color: "#7a6f5c", fontSize: "0.75rem", textDecoration: "none",
          letterSpacing: "0.06em", textTransform: "uppercase",
          display: "inline-flex", alignItems: "center", gap: "0.3rem", marginBottom: "2rem",
        }}>
          ← Pulse
        </Link>

        <h1 style={{
          fontFamily: "var(--font-fraunces), serif", fontSize: "1.6rem",
          fontWeight: 700, color: "#14110d", marginBottom: "0.4rem",
        }}>
          List an Event
        </h1>
        <p style={{ color: "#7a6f5c", fontSize: "0.88rem", marginBottom: "2rem", lineHeight: 1.6 }}>
          Submit a cultural event to the Moveee Happenings feed. Events go live after a quick review.
        </p>

        {!loggedIn ? (
          <div style={{
            background: "#fff", border: "1px solid #e8e2d8", borderRadius: "6px",
            padding: "1.5rem", textAlign: "center",
          }}>
            <p style={{ color: "#3a342b", fontSize: "0.88rem", marginBottom: "1rem" }}>
              You need to be signed in to submit an event.
            </p>
            <button
              onClick={() => window.dispatchEvent(new Event("open-auth-modal"))}
              style={{
                background: "#c93c2a", color: "#fff", border: "none", borderRadius: "2px",
                padding: "0.5rem 1.25rem", fontSize: "0.78rem", fontWeight: 700,
                letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
              }}
            >
              Sign In
            </button>
          </div>
        ) : success ? (
          <div style={{
            background: "#fff", border: "1px solid #c8e6c9", borderRadius: "6px",
            padding: "2rem", textAlign: "center",
          }}>
            <p style={{
              fontFamily: "var(--font-fraunces), serif", fontSize: "1.2rem",
              fontStyle: "italic", color: "#14110d", marginBottom: "0.5rem",
            }}>
              Event submitted.
            </p>
            <p style={{ color: "#7a6f5c", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              We'll review it and it will appear in Happenings shortly.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/events" style={{
                background: "#14110d", color: "#fff", textDecoration: "none",
                borderRadius: "2px", padding: "0.45rem 1rem",
                fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
              }}>
                View Happenings →
              </Link>
              <button
                onClick={() => { setSuccess(false); setForm({ title: "", event_date: "", end_date: "", location: "", city: "", description: "", admission: "", ticketing_url: "" }); }}
                style={{
                  background: "transparent", color: "#7a6f5c", border: "1px solid #e0d8ce",
                  borderRadius: "2px", padding: "0.45rem 1rem",
                  fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.06em",
                  textTransform: "uppercase", cursor: "pointer",
                }}
              >
                Submit Another
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{
            background: "#fff", border: "1px solid #e8e2d8", borderRadius: "6px",
            padding: "1.75rem",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>

              {/* Title */}
              <div>
                <label style={label}>Event Title *</label>
                <input type="text" required value={form.title} onChange={set("title")} placeholder="Name of the event" style={input} />
              </div>

              {/* Dates */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={label}>Start Date *</label>
                  <input type="date" required value={form.event_date} onChange={set("event_date")} style={input} />
                </div>
                <div>
                  <label style={label}>End Date</label>
                  <input type="date" value={form.end_date} onChange={set("end_date")} style={input} />
                </div>
              </div>

              {/* Location */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={label}>Venue</label>
                  <input type="text" value={form.location} onChange={set("location")} placeholder="Venue name" style={input} />
                </div>
                <div>
                  <label style={label}>City</label>
                  <input type="text" value={form.city} onChange={set("city")} placeholder="e.g. Lagos, London" style={input} />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={label}>Description</label>
                <textarea value={form.description} onChange={set("description")} placeholder="Tell us about the event…" rows={4} style={{ ...input, resize: "vertical", lineHeight: 1.6 }} />
              </div>

              {/* Admission + Ticketing */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={label}>Admission</label>
                  <input type="text" value={form.admission} onChange={set("admission")} placeholder="e.g. Free, ₦5,000" style={input} />
                </div>
                <div>
                  <label style={label}>Ticket Link</label>
                  <input type="url" value={form.ticketing_url} onChange={set("ticketing_url")} placeholder="https://…" style={input} />
                </div>
              </div>

              {error && (
                <p style={{ color: "#c5491f", fontSize: "0.82rem", margin: 0 }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={!form.title.trim() || !form.event_date || loading}
                style={{
                  background: form.title.trim() && form.event_date && !loading ? "#c93c2a" : "#e8e2d8",
                  color: form.title.trim() && form.event_date && !loading ? "#fff" : "#aaa",
                  border: "none", borderRadius: "2px", padding: "0.6rem 1.25rem",
                  fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", cursor: form.title.trim() && form.event_date && !loading ? "pointer" : "default",
                  transition: "all 0.15s", alignSelf: "flex-end",
                }}
              >
                {loading ? "Submitting…" : "Submit Event →"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
