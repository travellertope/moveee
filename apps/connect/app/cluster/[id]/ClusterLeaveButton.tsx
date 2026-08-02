"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClusterLeaveButton({ clusterId }: { clusterId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
      router.push("/connect/stoop");
      router.refresh();
    } catch {
      setError("Could not leave right now.");
      setBusy(false);
    }
  };

  return (
    <>
      {error && <p className="stoop-detail-error">{error}</p>}
      <button type="button" onClick={leave} disabled={busy}>
        {busy ? "Leaving…" : "Leave this Stoop"}
      </button>
    </>
  );
}
