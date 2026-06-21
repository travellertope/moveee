"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

interface ClusterMember {
  id: number;
  name: string;
  avatarUrl: string;
  role: string;
  joinedAt: string;
}

interface ClusterHostQr {
  token: string;
  meetingDate: string;
  expiresAt: number;
}

interface ClusterAttendance {
  totalCheckins: number;
  streak: number;
  lastCheckedIn: string | null;
}

const QR_REFRESH_MS = 13 * 60 * 1000; // host QR expires server-side after 900s

export default function ClusterCheckin({
  clusterId, isHost,
}: { clusterId: number; isHost: boolean }) {
  const [attendance, setAttendance] = useState<ClusterAttendance | null>(null);
  const [hostQr, setHostQr] = useState<ClusterHostQr | null>(null);
  const [showHostQr, setShowHostQr] = useState(false);
  const [members, setMembers] = useState<ClusterMember[]>([]);
  const [checkedInIds, setCheckedInIds] = useState<Set<number>>(new Set());
  const [showMembers, setShowMembers] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const qrTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/cluster/${clusterId}/attendance`);
        if (res.ok) setAttendance(await res.json());
      } catch {
        // non-fatal
      }
    })();
  }, [clusterId]);

  const fetchHostQr = async () => {
    try {
      const res = await fetch(`/api/cluster/${clusterId}/host-qr`);
      if (res.ok) setHostQr(await res.json());
    } catch {
      setHostQr(null);
    }
  };

  const openHostQr = async () => {
    await fetchHostQr();
    setShowHostQr(true);
  };

  useEffect(() => {
    if (showHostQr) {
      qrTimerRef.current = setInterval(fetchHostQr, QR_REFRESH_MS);
    } else if (qrTimerRef.current) {
      clearInterval(qrTimerRef.current);
      qrTimerRef.current = null;
    }
    return () => {
      if (qrTimerRef.current) {
        clearInterval(qrTimerRef.current);
        qrTimerRef.current = null;
      }
    };
  }, [showHostQr]);

  const openMembers = async () => {
    setError("");
    try {
      const res = await fetch(`/api/cluster/${clusterId}/members`);
      if (!res.ok) {
        setError("Could not load members right now.");
        return;
      }
      const data = await res.json();
      setMembers(data?.members ?? []);
      setShowMembers(true);
    } catch {
      setError("Could not load members right now.");
    }
  };

  const manualCheckin = async (memberUserId: number) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/cluster/${clusterId}/checkin-manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_user_id: memberUserId }),
      });
      if (res.ok) {
        setCheckedInIds((prev) => new Set(prev).add(memberUserId));
      }
    } catch {
      // non-fatal, button stays available to retry
    }
    setBusy(false);
  };

  return (
    <div>
      <div className="mem-card-label">Check-in</div>
      {error && <p style={{ fontSize: "0.78rem", color: "#c0392b", margin: "8px 0 0" }}>{error}</p>}

      {isHost ? (
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={openHostQr}
            className="con-btn-primary"
            style={{ border: "none", cursor: "pointer" }}
          >
            Show check-in code
          </button>
          <button
            type="button"
            onClick={openMembers}
            className="mem-settings-back-link"
            style={{
              background: "none", border: "1px solid var(--ochre)", borderRadius: 999,
              padding: "8px 16px", cursor: "pointer", color: "var(--ochre)", fontSize: "0.78rem",
            }}
          >
            Manual check-in
          </button>
        </div>
      ) : (
        <p className="mem-card-desc" style={{ marginTop: 8 }}>
          Open the Moveee app and scan your host's check-in code to mark yourself present —
          or ask your host to check you in manually.
        </p>
      )}

      {attendance && (
        <div style={{ display: "flex", gap: 24, marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--rule)" }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.2rem", fontWeight: 700 }}>
              {attendance.totalCheckins}
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--mute)", textTransform: "uppercase" }}>
              Check-ins
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.2rem", fontWeight: 700 }}>
              {attendance.streak}
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--mute)", textTransform: "uppercase" }}>
              Week streak
            </div>
          </div>
        </div>
      )}

      {showHostQr && (
        <div
          onClick={() => setShowHostQr(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 8000,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--paper)", borderRadius: 12, padding: 32,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
            }}
          >
            <div className="mem-card-label">Check-in code</div>
            {hostQr ? (
              <QRCodeSVG
                value={JSON.stringify({ clusterId, ...hostQr })}
                size={220}
              />
            ) : (
              <p className="mem-card-desc">Loading…</p>
            )}
            <p className="mem-card-desc" style={{ textAlign: "center", maxWidth: 220 }}>
              Members scan this with the Moveee app to check in. Refreshes automatically.
            </p>
            <button
              type="button"
              onClick={() => setShowHostQr(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ochre)", fontSize: "0.85rem" }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showMembers && (
        <div
          onClick={() => setShowMembers(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 8000,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--paper)", borderRadius: 12, padding: 24, width: "min(420px, 90vw)",
              maxHeight: "70vh", overflowY: "auto",
            }}
          >
            <div className="mem-card-label" style={{ marginBottom: 12 }}>Manual check-in</div>
            {members.length === 0 ? (
              <p className="mem-card-desc">No members yet.</p>
            ) : (
              members.map((m) => {
                const checkedIn = checkedInIds.has(m.id);
                return (
                  <div
                    key={m.id}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 0", borderBottom: "1px solid var(--rule)",
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{m.name}</div>
                    <button
                      type="button"
                      onClick={() => manualCheckin(m.id)}
                      disabled={busy || checkedIn}
                      style={{
                        border: "1px solid var(--ochre)", borderRadius: 999, padding: "4px 12px",
                        background: checkedIn ? "var(--ochre)" : "transparent",
                        color: checkedIn ? "var(--paper)" : "var(--ochre)",
                        fontSize: "0.7rem", fontWeight: 600, cursor: checkedIn ? "default" : "pointer",
                      }}
                    >
                      {checkedIn ? "Checked in" : "Check in"}
                    </button>
                  </div>
                );
              })
            )}
            <button
              type="button"
              onClick={() => setShowMembers(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ochre)", fontSize: "0.85rem", marginTop: 12 }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
