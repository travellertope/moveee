"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ClusterElectionCandidate {
  id: number;
  name: string;
  voteCount: number;
}

interface ClusterElectionStatus {
  open: boolean;
  openUntil: string | null;
  candidates: ClusterElectionCandidate[];
  myVote: number | null;
  totalVotes: number;
}

export default function ClusterElection({
  clusterId, myUserId, initialElection,
}: { clusterId: number; myUserId: number; initialElection: ClusterElectionStatus | null }) {
  const router = useRouter();
  const [election, setElection] = useState<ClusterElectionStatus | null>(initialElection);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = async () => {
    try {
      const res = await fetch(`/api/cluster/${clusterId}/election`);
      if (res.ok) setElection(await res.json());
    } catch {
      // non-fatal
    }
  };

  const startElection = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/cluster/${clusterId}/election/start`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message || "Could not start an election right now.");
        setBusy(false);
        return;
      }
      await refresh();
      router.refresh();
    } catch {
      setError("Could not start an election right now.");
    }
    setBusy(false);
  };

  const castVote = async (candidateId: number) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/cluster/${clusterId}/election/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: candidateId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message || "Could not cast your vote right now.");
        setBusy(false);
        return;
      }
      await refresh();
      router.refresh();
    } catch {
      setError("Could not cast your vote right now.");
    }
    setBusy(false);
  };

  return (
    <div>
      <div className="mem-card-label">Host Election</div>
      {error && <p style={{ fontSize: "0.78rem", color: "#c0392b", margin: "8px 0 0" }}>{error}</p>}

      {election?.open ? (
        <>
          {election.candidates.length === 0 ? (
            <p className="mem-card-desc" style={{ marginTop: 8 }}>
              No votes yet — be the first to put yourself forward.
            </p>
          ) : (
            <div style={{ marginTop: 8 }}>
              {election.candidates.map((cand) => (
                <div
                  key={cand.id}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 0", borderBottom: "1px solid var(--rule)",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{cand.name}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem", color: "var(--mute)" }}>
                      {cand.voteCount} vote{cand.voteCount === 1 ? "" : "s"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => castVote(cand.id)}
                    disabled={busy}
                    style={{
                      border: "1px solid var(--ochre)", borderRadius: 999, padding: "4px 12px",
                      background: election.myVote === cand.id ? "var(--ochre)" : "transparent",
                      color: election.myVote === cand.id ? "var(--paper)" : "var(--ochre)",
                      fontSize: "0.7rem", fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    {election.myVote === cand.id ? "Voted" : "Vote"}
                  </button>
                </div>
              ))}
            </div>
          )}
          {election.myVote !== myUserId && (
            <button
              type="button"
              onClick={() => castVote(myUserId)}
              disabled={busy}
              className="mem-settings-back-link"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 12, color: "var(--ochre)" }}
            >
              I'll run →
            </button>
          )}
        </>
      ) : (
        <>
          <p className="mem-card-desc" style={{ marginTop: 8 }}>No election in progress.</p>
          <button
            type="button"
            onClick={startElection}
            disabled={busy}
            className="con-btn-primary"
            style={{ border: "none", cursor: "pointer", marginTop: 8 }}
          >
            {busy ? "Starting…" : "Start a host election"}
          </button>
        </>
      )}
    </div>
  );
}
