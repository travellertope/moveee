"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClusterActions({ clusterId }: { clusterId: number }) {
  const router = useRouter();
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
      router.refresh();
    } catch {
      setError("Could not join right now.");
      setBusy(false);
    }
  };

  return (
    <div>
      {error && <p className="stoop-detail-error">{error}</p>}
      <button type="button" className="stoop-detail-primary-cta" onClick={join} disabled={busy}>
        {busy ? "Joining…" : "Join this Stoop →"}
      </button>
    </div>
  );
}
