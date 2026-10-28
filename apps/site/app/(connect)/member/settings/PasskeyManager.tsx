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
    <div className="sett-section-card">
      <div className="sett-section-card-title">Passkeys</div>
      <p className="sett-section-card-desc" style={{ marginTop: 4 }}>
        Passkeys use your device&apos;s biometrics (fingerprint, Face ID) for fast, secure sign-in.
        Required to redeem credits and cash out.
      </p>

      {loading ? (
        <p className="sett-passkey-empty">Loading…</p>
      ) : (
        <>
          {creds.length === 0 ? (
            <p className="sett-passkey-empty">No passkeys registered. Add one below.</p>
          ) : (
            <div className="sett-passkey-list">
              {creds.map(c => (
                <div key={c.id} className="sett-passkey-row">
                  <div>
                    <div className="sett-passkey-name">{c.device_name}</div>
                    <div className="sett-passkey-meta">
                      Added {timeAgo(c.created_at)}
                      {c.last_used_at !== c.created_at && ` · Used ${timeAgo(c.last_used_at)}`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    disabled={deleting === c.id}
                    className="sett-passkey-remove"
                  >
                    {deleting === c.id ? "Removing…" : "Remove"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {creds.length < 5 && (
            <div>
              <div className="sett-section-card-desc" style={{ marginBottom: 6 }}>Device name</div>
              <div className="sett-passkey-add-row">
                <input
                  type="text"
                  value={deviceName}
                  onChange={e => setDeviceName(e.target.value)}
                  placeholder="e.g. iPhone 15"
                  className="sett-passkey-name-input"
                />
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={adding}
                  className="sett-passkey-add-btn"
                >
                  {adding ? "Working…" : "Add Passkey"}
                </button>
              </div>
            </div>
          )}

          {message && (
            <div className={`sett-passkey-msg sett-passkey-msg--${message.ok ? "ok" : "err"}`}>
              {message.text}
            </div>
          )}
        </>
      )}
    </div>
  );
}
