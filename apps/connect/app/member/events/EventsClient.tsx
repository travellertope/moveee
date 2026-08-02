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
    <section className="acct-card">
      <div className="acct-card-header"><span className="acct-card-title">Your Events</span></div>
      {events.length === 0 ? (
        <p style={{ fontSize: "0.82rem", color: "var(--mute)", fontStyle: "italic" }}>
          You haven't organised any events yet.
        </p>
      ) : (
        events.map((event) => {
          const isOpen = openId === event.postId;
          const attendees = attendeesByEvent[event.postId] ?? [];
          return (
            <div key={event.postId} className="evt-row">
              <button
                type="button"
                onClick={() => event.rsvpEnabled && toggleEvent(event)}
                disabled={!event.rsvpEnabled}
                className="evt-row-head"
              >
                <div>
                  <div className="evt-title">{event.title}</div>
                  <div className="evt-meta">
                    {formatDate(event.eventDate)} · {event.status}
                    {!event.rsvpEnabled && " · RSVP not enabled"}
                  </div>
                </div>
                {event.rsvpEnabled && (
                  <span className="evt-count">
                    {event.rsvpCount}{event.rsvpCapacity > 0 ? ` / ${event.rsvpCapacity}` : ""} going {isOpen ? "▲" : "▼"}
                  </span>
                )}
              </button>

              {isOpen && (
                <div className="evt-attendees">
                  {loadingId === event.postId ? (
                    <p style={{ fontSize: "0.78rem", color: "var(--mute)" }}>Loading attendees…</p>
                  ) : attendees.length === 0 ? (
                    <p style={{ fontSize: "0.78rem", color: "var(--mute)", fontStyle: "italic" }}>No RSVPs yet.</p>
                  ) : (
                    <>
                      <div className="evt-export">
                        <button type="button" onClick={() => downloadCsv(event, attendees)} className="evt-export-btn">
                          Export CSV ↓
                        </button>
                      </div>
                      {attendees.map((a) => (
                        <div key={a.userId} className="evt-attendee-row">
                          <div>
                            <div className="evt-attendee-name">{a.displayName}</div>
                            <div className="evt-attendee-email">{a.email}</div>
                          </div>
                          <span className="evt-attendee-date">{formatDate(a.rsvpAt)}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </section>
  );
}
