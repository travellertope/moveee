"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const THRESHOLD = 70;

export default function PullToRefresh() {
  const router = useRouter();
  const touchStartYRef = useRef(0);
  const ptrYRef = useRef(0);
  const phaseRef = useRef<"idle" | "pulling" | "refreshing">("idle");
  const [ptrY, setPtrY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 4) return;
      touchStartYRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (phaseRef.current === "refreshing") return;
      if (window.scrollY > 4) { touchStartYRef.current = 0; return; }
      if (!touchStartYRef.current) return;
      const delta = e.touches[0].clientY - touchStartYRef.current;
      if (delta <= 0) { ptrYRef.current = 0; setPtrY(0); return; }
      e.preventDefault();
      const clamped = Math.min(delta * 0.45, THRESHOLD + 16);
      ptrYRef.current = clamped;
      setPtrY(clamped);
      phaseRef.current = "pulling";
    };

    const handleTouchEnd = () => {
      if (phaseRef.current !== "pulling") {
        touchStartYRef.current = 0;
        return;
      }
      const y = ptrYRef.current;
      touchStartYRef.current = 0;
      ptrYRef.current = 0;
      setPtrY(0);
      if (y >= THRESHOLD * 0.55) {
        phaseRef.current = "refreshing";
        setRefreshing(true);
        router.refresh();
        setTimeout(() => {
          phaseRef.current = "idle";
          setRefreshing(false);
        }, 1600);
      } else {
        phaseRef.current = "idle";
      }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [router]);

  if (ptrY === 0 && !refreshing) return null;

  const progress = Math.min(ptrY / THRESHOLD, 1);

  return (
    <>
      <style>{`@keyframes ptr-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0,
        display: "flex", justifyContent: "center",
        paddingTop: `max(env(safe-area-inset-top, 0px), ${refreshing ? 12 : Math.min(ptrY * 0.6, 18)}px)`,
        zIndex: 9999, pointerEvents: "none",
        transition: refreshing ? "none" : "padding-top 0.05s linear",
      }}>
        <div style={{
          width: "34px", height: "34px", borderRadius: "50%",
          background: "var(--paper, #fff)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transform: refreshing ? "none" : `scale(${progress})`,
          opacity: refreshing ? 1 : Math.min(ptrY / (THRESHOLD * 0.5), 1),
          transition: refreshing ? "none" : "transform 0.05s linear, opacity 0.05s linear",
        }}>
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="var(--ochre, #7a241c)" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            style={{
              animation: refreshing ? "ptr-spin 0.7s linear infinite" : "none",
              transform: refreshing ? "none" : `rotate(${progress * 270}deg)`,
            }}
          >
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </div>
      </div>
    </>
  );
}
