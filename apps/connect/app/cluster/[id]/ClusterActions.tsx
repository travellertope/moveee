"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClusterActions({
  clusterId, initialIsMember,
}: { clusterId: number; initialIsMember: boolean }) {
  const router = useRouter();
  const [isMember, setIsMember] = useState(initialIsMember);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const join = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/cluster/${clusterId}/join`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message || "Could not join right now.");
        setBusy(false);
        return;
      }
      setIsMember(true);
      router.refresh();
    } catch {
      setError("Could not join right now.");
    }
    setBusy(false);
  };

  const leave = async () => {
    if (!confirm("Leave this Stoop?")) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/cluster/${clusterId}/leave`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message || "Could not leave right now.");
        setBusy(false);
        return;
      }
      setIsMember(false);
      router.refresh();
    } catch {
      setError("Could not leave right now.");
    }
    setBusy(false);
  };

  return (
    <div>
      <div className="mem-card-label">{isMember ? "You're a member" : "Join this Stoop"}</div>
      {error && <p style={{ fontSize: "0.78rem", color: "#c0392b", margin: "0 0 12px" }}>{error}</p>}
      {isMember ? (
        <button
          type="button"
          onClick={leave}
          disabled={busy}
          className="mem-settings-back-link"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#c0392b" }}
        >
          {busy ? "Leaving…" : "Leave Stoop"}
        </button>
      ) : (
        <button
          type="button"
          onClick={join}
          disabled={busy}
          className="con-btn-primary"
          style={{ border: "none", cursor: "pointer" }}
        >
          {busy ? "Joining…" : "Join →"}
        </button>
      )}
    </div>
  );
}
