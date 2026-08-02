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
      {error && <p className="stoop-detail-error">{error}</p>}

      {attendance && (
        <div className="stoop-checkin-stats">
          <div>
            <div className="stoop-stat-num">{attendance.totalCheckins}</div>
            <div className="stoop-stat-label">Check-ins</div>
          </div>
          <div>
            <div className="stoop-stat-num">{attendance.streak}</div>
            <div className="stoop-stat-label">Week streak</div>
          </div>
        </div>
      )}

      {isHost ? (
        <>
          <div className="stoop-qr-card">
            <div className="stoop-qr-copy">
              <p><b>Hosting this week?</b> Bring up your check-in code — refreshes automatically, no need to open it in advance.</p>
            </div>
          </div>
          <div className="stoop-checkin-host-actions">
            <button type="button" className="stoop-btn-secondary" onClick={openHostQr}>
              Show check-in code
            </button>
            <button type="button" className="stoop-btn-secondary stoop-btn-secondary--muted" onClick={openMembers}>
              Manual check-in
            </button>
          </div>
        </>
      ) : (
        <p className="stoop-detail-note">
          Open the Moveee app and scan your host's check-in code to mark yourself present —
          or ask your host to check you in manually.
        </p>
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
            <div className="stoop-detail-sec-title">Check-in code</div>
            {hostQr ? (
              <QRCodeSVG
                value={JSON.stringify({ clusterId, ...hostQr })}
                size={220}
              />
            ) : (
              <p className="stoop-detail-note" style={{ margin: 0 }}>Loading…</p>
            )}
            <p className="stoop-detail-note" style={{ textAlign: "center", maxWidth: 220, margin: 0 }}>
              Members scan this with the Moveee app to check in. Refreshes automatically.
            </p>
            <button type="button" onClick={() => setShowHostQr(false)} className="stoop-detail-link-btn">
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
            <div className="stoop-detail-sec-title" style={{ marginBottom: 12 }}>Manual check-in</div>
            {members.length === 0 ? (
              <p className="stoop-detail-note">No members yet.</p>
            ) : (
              members.map((m) => {
                const checkedIn = checkedInIds.has(m.id);
                return (
                  <div key={m.id} className="stoop-member-row" style={{ justifyContent: "space-between", borderBottom: "1px solid var(--rule)" }}>
                    <span className="stoop-member-name" style={{ flex: "unset" }}>{m.name}</span>
                    <button
                      type="button"
                      onClick={() => manualCheckin(m.id)}
                      disabled={busy || checkedIn}
                      className={`stoop-election-vote-btn${checkedIn ? " stoop-election-vote-btn--voted" : ""}`}
                    >
                      {checkedIn ? "Checked in" : "Check in"}
                    </button>
                  </div>
                );
              })
            )}
            <button type="button" onClick={() => setShowMembers(false)} className="stoop-detail-link-btn" style={{ marginTop: 12 }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
