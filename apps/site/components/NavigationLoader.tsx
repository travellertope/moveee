"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function NavigationLoader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Arm on any internal link click — small delay so instant navigations don't flash
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as Element).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      if (/^(https?:|\/\/|mailto:|tel:|#)/.test(href)) return;
      if (anchor.getAttribute("target") === "_blank") return;
      if (href === pathname || href === window.location.pathname) return;

      timerRef.current = setTimeout(() => setVisible(true), 120);
      // safety net: always hide after 8s in case navigation fails silently
      safetyRef.current = setTimeout(() => setVisible(false), 8000);
    }

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [pathname]);

  // Hide as soon as the new pathname renders
  useEffect(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (safetyRef.current) { clearTimeout(safetyRef.current); safetyRef.current = null; }
    setVisible(false);
  }, [pathname]);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes nav-spin { to { transform: rotate(360deg); } }
        @keyframes nav-fade-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
      <div
        aria-live="polite"
        aria-label="Loading…"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          background: "rgba(20,17,13,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "nav-fade-in 0.15s ease",
          WebkitBackdropFilter: "blur(2px)",
          backdropFilter: "blur(2px)",
        }}
      >
        <div style={{
          background: "var(--paper, #f3ece0)",
          borderRadius: "var(--radius-xl, 12px)",
          padding: "18px 24px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 8px 32px rgba(20,17,13,0.25)",
        }}>
          <svg
            width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="var(--ochre, #7a241c)" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ animation: "nav-spin 0.75s linear infinite", flexShrink: 0 }}
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <span style={{
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "var(--ink, #14110d)",
            letterSpacing: "0.01em",
          }}>
            Loading…
          </span>
        </div>
      </div>
    </>
  );
}
