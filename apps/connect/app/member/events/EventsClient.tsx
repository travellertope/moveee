"use client";

import { useState } from "react";

interface OrganiserEvent {
  postId: number;
  title: string;
  status: string;
  rsvpEnabled: boolean;
  rsvpCapacity: number;
  rsvpCount: number;
  eventDate: string;
}

interface Attendee {
  userId: number;
  displayName: string;
  email: string;
  rsvpAt: string;
}

function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function downloadCsv(event: OrganiserEvent, attendees: Attendee[]) {
  const rows = [
    ["Name", "Email", "RSVP date"],
    ...attendees.map((a) => [a.displayName, a.email, formatDate(a.rsvpAt)]),
  ];
  const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-attendees.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function EventsClient({ events }: { events: OrganiserEvent[] }) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [attendeesByEvent, setAttendeesByEvent] = useState<Record<number, Attendee[]>>({});
  const [loadingId, setLoadingId] = useState<number | null>(null);

  async function toggleEvent(event: OrganiserEvent) {
    if (openId === event.postId) {
      setOpenId(null);
      return;
    }
    setOpenId(event.postId);
    if (attendeesByEvent[event.postId]) return;

    setLoadingId(event.postId);
    try {
      const res = await fetch(`/api/member/events/${event.postId}/attendees`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setAttendeesByEvent((prev) => ({ ...prev, [event.postId]: data.attendees ?? [] }));
      }
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <section className="mem-card">
      <div className="mem-card-label">Your Events</div>
      {events.length === 0 ? (
        <p style={{ fontSize: "0.82rem", color: "var(--mute)", fontStyle: "italic" }}>
          You haven't organised any events yet.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "rgba(42,36,28,.06)", border: "1px solid rgba(42,36,28,.08)" }}>
          {events.map((event) => {
            const isOpen = openId === event.postId;
            const attendees = attendeesByEvent[event.postId] ?? [];
            return (
              <div key={event.postId} style={{ background: "var(--paper)" }}>
                <button
                  type="button"
                  onClick={() => event.rsvpEnabled && toggleEvent(event)}
                  disabled={!event.rsvpEnabled}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    width: "100%", padding: "10px 14px", background: "transparent",
                    border: "none", cursor: event.rsvpEnabled ? "pointer" : "default", textAlign: "left",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.82rem", color: "var(--ink)", fontWeight: 500 }}>
                      {event.title}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--mute)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: ".06em" }}>
                      {formatDate(event.eventDate)} · {event.status}
                      {!event.rsvpEnabled && " · RSVP not enabled"}
                    </div>
                  </div>
                  {event.rsvpEnabled && (
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.82rem", fontWeight: 700, color: "var(--ochre)" }}>
                      {event.rsvpCount}{event.rsvpCapacity > 0 ? ` / ${event.rsvpCapacity}` : ""} going {isOpen ? "▲" : "▼"}
                    </span>
                  )}
                </button>

                {isOpen && (
                  <div style={{ padding: "0 14px 14px" }}>
                    {loadingId === event.postId ? (
                      <p style={{ fontSize: "0.78rem", color: "var(--mute)" }}>Loading attendees…</p>
                    ) : attendees.length === 0 ? (
                      <p style={{ fontSize: "0.78rem", color: "var(--mute)", fontStyle: "italic" }}>No RSVPs yet.</p>
                    ) : (
                      <>
                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                          <button
                            type="button"
                            onClick={() => downloadCsv(event, attendees)}
                            className="mem-settings-back-link"
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                          >
                            Export CSV ↓
                          </button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "rgba(42,36,28,.06)", border: "1px solid rgba(42,36,28,.08)" }}>
                          {attendees.map((a) => (
                            <div key={a.userId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--paper-deep)" }}>
                              <div>
                                <div style={{ fontSize: "0.78rem", color: "var(--ink)" }}>{a.displayName}</div>
                                <div style={{ fontSize: "0.68rem", color: "var(--mute)" }}>{a.email}</div>
                              </div>
                              <span style={{ fontSize: "0.68rem", color: "var(--mute)", fontFamily: "'JetBrains Mono', monospace" }}>
                                {formatDate(a.rsvpAt)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
