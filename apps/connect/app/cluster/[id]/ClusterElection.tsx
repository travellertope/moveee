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

  const maxVotes = Math.max(1, ...(election?.candidates.map((c) => c.voteCount) ?? [1]));

  return (
    <div>
      {error && <p className="stoop-detail-error">{error}</p>}

      {election?.open ? (
        <>
          {election.candidates.length === 0 ? (
            <p className="stoop-detail-sec-sub" style={{ marginBottom: 0 }}>
              No votes yet — be the first to put yourself forward.
            </p>
          ) : (
            <div>
              {election.candidates.map((cand) => (
                <div key={cand.id} className="stoop-election-row">
                  <span className="stoop-election-name">{cand.name}</span>
                  <div className="stoop-election-bar-track">
                    <div className="stoop-election-bar-fill" style={{ width: `${(cand.voteCount / maxVotes) * 100}%` }} />
                    <span className="stoop-election-votes">{cand.voteCount} vote{cand.voteCount === 1 ? "" : "s"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => castVote(cand.id)}
                    disabled={busy}
                    className={`stoop-election-vote-btn${election.myVote === cand.id ? " stoop-election-vote-btn--voted" : ""}`}
                  >
                    {election.myVote === cand.id ? "Voted" : "Vote"}
                  </button>
                </div>
              ))}
            </div>
          )}
          {election.myVote !== myUserId && (
            <button type="button" onClick={() => castVote(myUserId)} disabled={busy} className="stoop-election-run-btn">
              I'll run →
            </button>
          )}
        </>
      ) : (
        <>
          <p className="stoop-detail-sec-sub">No election open right now.</p>
          <button type="button" onClick={startElection} disabled={busy} className="stoop-detail-link-btn">
            {busy ? "Starting…" : "Start a new election"}
          </button>
        </>
      )}
    </div>
  );
}
