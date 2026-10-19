"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { startRegistration } from "@simplewebauthn/browser";

interface Credential {
  id: string;
  device_name: string;
  created_at: string;
  last_used_at: string;
  aaguid: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (days > 30) return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  if (days > 0)  return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0)  return `${mins}m ago`;
  return "Just now";
}

export default function PasskeyManager() {
  const { update } = useSession();
  const [creds, setCreds]           = useState<Credential[]>([]);
  const [loading, setLoading]       = useState(true);
  const [adding, setAdding]         = useState(false);
  const [deviceName, setDeviceName] = useState("My Device");
  const [message, setMessage]       = useState<{ ok: boolean; text: string } | null>(null);
  const [deleting, setDeleting]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/passkey/list");
      if (res.ok) setCreds(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd() {
    setAdding(true);
    setMessage(null);
    try {
      const optRes = await fetch("/api/auth/passkey/register-options", { method: "POST" });
      if (!optRes.ok) throw new Error((await optRes.json()).error ?? "Failed to get options");
      const options = await optRes.json();

      const attResp = await startRegistration({ optionsJSON: options });
      const verRes = await fetch("/api/auth/passkey/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...attResp,
          device_name: deviceName.trim() || "My Device",
          transports: attResp.response.transports ?? [],
        }),
      });
      const verData = await verRes.json();
      if (!verRes.ok) throw new Error(verData.error ?? "Registration failed");

      setMessage({ ok: true, text: "Passkey added successfully." });
      await update({ hasPasskey: true });
      await load();
    } catch (err: any) {
      if (err?.name === "NotAllowedError") { setAdding(false); return; }
      setMessage({ ok: false, text: err.message ?? "Something went wrong." });
    }
    setAdding(false);
  }

  async function handleDelete(credId: string) {
    if (!confirm("Remove this passkey? You won't be able to use it to sign in.")) return;
    setDeleting(credId);
    try {
      const res = await fetch("/api/auth/passkey/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential_id: credId }),
      });
      if (res.ok) {
        await update({ hasPasskey: creds.length > 1, passkeyCount: creds.length - 1 });
        await load();
      } else {
        setMessage({ ok: false, text: "Failed to remove passkey." });
      }
    } finally {
      setDeleting(null);
    }
  }

  return (
    <section className="mem-card">
      <div className="mem-card-label">Passkeys</div>
      <p style={{ fontSize: "0.78rem", color: "var(--mute)", margin: "0 0 16px", lineHeight: 1.5 }}>
        Passkeys use your device's biometrics (fingerprint, Face ID) for fast, secure sign-in.
        Required to redeem credits and cash out.
      </p>

      {loading ? (
        <p style={{ fontSize: "0.8rem", color: "var(--mute)" }}>Loading…</p>
      ) : (
        <>
          {creds.length === 0 ? (
            <p style={{ fontSize: "0.8rem", color: "var(--mute)", fontStyle: "italic", marginBottom: 16 }}>
              No passkeys registered. Add one below.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "rgba(42,36,28,.06)", marginBottom: 16 }}>
              {creds.map(c => (
                <div key={c.id} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  background: "var(--paper)",
                }}>
                  <div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--ink)" }}>
                      {c.device_name}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--mute)" }}>
                      Added {timeAgo(c.created_at)}
                      {c.last_used_at !== c.created_at && ` · Used ${timeAgo(c.last_used_at)}`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    disabled={deleting === c.id}
                    style={{
                      padding: "4px 10px",
                      background: "transparent",
                      border: "1px solid rgba(198,40,40,.4)",
                      color: "#c62828",
                      borderRadius: 3,
                      fontSize: "0.72rem",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {deleting === c.id ? "Removing…" : "Remove"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {creds.length < 5 && (
            <div>
              <div style={{ fontSize: "0.76rem", color: "var(--mute)", marginBottom: 6 }}>Device name</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input
                  type="text"
                  value={deviceName}
                  onChange={e => setDeviceName(e.target.value)}
                  placeholder="e.g. iPhone 15"
                  style={{
                    flex: 1,
                    minWidth: 140,
                    padding: "8px 12px",
                    border: "1px solid rgba(42,36,28,.15)",
                    borderRadius: 4,
                    fontSize: "0.85rem",
                    fontFamily: "inherit",
                  }}
                />
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={adding}
                  className="perk-card-btn"
                  style={{ whiteSpace: "nowrap" }}
                >
                  {adding ? "Working…" : "Add Passkey"}
                </button>
              </div>
            </div>
          )}

          {message && (
            <div style={{
              marginTop: 12,
              padding: "10px 14px",
              fontSize: "0.8rem",
              borderRadius: 3,
              background: message.ok ? "rgba(46,125,50,.06)" : "rgba(198,40,40,.06)",
              border: `1px solid ${message.ok ? "rgba(46,125,50,.2)" : "rgba(198,40,40,.2)"}`,
              color: message.ok ? "#2e7d32" : "#c62828",
            }}>
              {message.text}
            </div>
          )}
        </>
      )}
    </section>
  );
}
