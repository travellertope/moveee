"use client";
import { useState, useEffect } from "react";
import "./PwaSplash.css";

export default function PwaSplash() {
  const [phase, setPhase] = useState<"hidden" | "show" | "fade">("hidden");

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (!isStandalone) return;

    setPhase("show");
    const fadeTimer = setTimeout(() => setPhase("fade"), 900);
    const hideTimer = setTimeout(() => setPhase("hidden"), 1400);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (phase === "hidden") return null;

  return (
    <div className={`pwa-splash${phase === "fade" ? " pwa-splash--fade" : ""}`}>
      <img
        src="/icons/icon-192x192.png"
        alt="Moveee"
        width={80}
        height={80}
        className="pwa-splash-icon"
      />
    </div>
  );
}
