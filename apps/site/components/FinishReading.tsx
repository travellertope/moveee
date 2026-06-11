"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Award, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

interface FinishReadingProps {
  postId: number;
}

export default function FinishReading({ postId }: FinishReadingProps) {
  const { data: session } = useSession();
  const [status, setStatus] = useState<"idle" | "loading" | "completed" | "error">("idle");
  const [awardedPoints, setAwardedPoints] = useState(0);

  // Check if already awarded locally or via session (optional)
  useEffect(() => {
    const isCompleted = localStorage.getItem(`read_complete_${postId}`);
    if (isCompleted) {
      setStatus("completed");
    }
  }, [postId]);

  const handleFinish = async () => {
    if (!session || status === "completed" || status === "loading") return;

    setStatus("loading");
    try {
      const res = await fetch("/api/points/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "magazine_read",
          post_id: postId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("completed");
        setAwardedPoints(data.awarded || 5);
        localStorage.setItem(`read_complete_${postId}`, "true");
      } else {
        // If already awarded, treat as completed
        if (data.message === "Already awarded.") {
          setStatus("completed");
          localStorage.setItem(`read_complete_${postId}`, "true");
        } else {
          setStatus("error");
        }
      }
    } catch (err) {
      console.error("Failed to award points:", err);
      setStatus("error");
    }
  };

  if (!session) return null;

  return (
    <div className="finish-reading-wrap" style={{ 
      margin: '60px 0', 
      padding: '40px', 
      background: 'rgba(189, 163, 121, 0.05)', 
      border: '1px solid rgba(189, 163, 121, 0.1)',
      textAlign: 'center',
      borderRadius: '4px'
    }}>
      {status === "completed" ? (
        <div className="completed-state" style={{ color: 'var(--ochre)' }}>
          <CheckCircle2 size={40} style={{ marginBottom: '15px' }} />
          <h4 style={{ margin: '0 0 5px 0', fontFamily: 'var(--font-newsreader)', fontSize: '24px', fontStyle: 'italic' }}>Article Completed</h4>
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>You've earned {awardedPoints || 5} XT points for your Cultural Passport.</p>
        </div>
      ) : (
        <>
          <h4 style={{ margin: '0 0 10px 0', fontFamily: 'var(--font-newsreader)', fontSize: '24px', fontStyle: 'italic' }}>Finished reading?</h4>
          <p style={{ margin: '0 0 25px 0', fontSize: '14px', opacity: 0.7 }}>Mark this article as complete to earn your culture points.</p>
          <button 
            onClick={handleFinish}
            disabled={status === "loading"}
            className="submit-comment-btn"
            style={{ margin: '0 auto', display: 'flex', minWidth: '220px' }}
          >
            {status === "loading" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Award size={16} />
            )}
            {status === "loading" ? "Processing..." : "Finish Article +5 XT"}
          </button>
          {status === "error" && (
            <p style={{ color: '#c5491f', fontSize: '12px', marginTop: '10px' }}>Something went wrong. Please try again.</p>
          )}
        </>
      )}
    </div>
  );
}
