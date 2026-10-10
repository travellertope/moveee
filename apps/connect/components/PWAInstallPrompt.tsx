"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if already installed (running in standalone)
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Don't show if dismissed within the last 7 days
    try {
      const dismissed = localStorage.getItem("moveee-pwa-dismissed");
      if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return;
    } catch {}

    function handler(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Small delay so it doesn't pop immediately on load
      setTimeout(() => setVisible(true), 3000);
    }

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    setVisible(false);
    try { localStorage.setItem("moveee-pwa-dismissed", String(Date.now())); } catch {}
  }

  if (!visible || !deferredPrompt) return null;

  return (
    <div
      role="dialog"
      aria-label="Install Moveee app"
      style={{
        position: "fixed",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        maxWidth: 420,
        background: "var(--ink)",
        color: "#fff",
        borderRadius: "var(--radius-xl)",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: "0 8px 32px rgba(20,17,13,0.35)",
        zIndex: 9999,
        animation: "pwa-slide-up 0.3s ease",
      }}
    >
      <img
        src="/icons/icon-192.png"
        alt=""
        width={40}
        height={40}
        style={{ borderRadius: "var(--radius-md)", flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: "0.875rem", lineHeight: 1.3 }}>
          Add Moveee to your home screen
        </div>
        <div style={{ fontSize: "0.75rem", opacity: 0.7, marginTop: 2 }}>
          Faster access, works offline
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "none",
            color: "#fff",
            borderRadius: "var(--radius-md)",
            padding: "6px 10px",
            fontSize: "0.75rem",
            cursor: "pointer",
          }}
        >
          Not now
        </button>
        <button
          onClick={handleInstall}
          style={{
            background: "var(--ochre)",
            border: "none",
            color: "#fff",
            borderRadius: "var(--radius-md)",
            padding: "6px 14px",
            fontSize: "0.75rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Install
        </button>
      </div>
      <style>{`
        @keyframes pwa-slide-up {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
