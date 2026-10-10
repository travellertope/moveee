"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios|edgios/i.test(ua);
  return isIos && isSafari;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS-specific standalone flag
    (navigator as any).standalone === true
  );
}

const DISMISS_KEY = "moveee-pwa-dismissed";
const DISMISS_TTL = 7 * 24 * 60 * 60 * 1000;

function wasDismissedRecently(): boolean {
  try {
    const v = localStorage.getItem(DISMISS_KEY);
    return !!v && Date.now() - parseInt(v) < DISMISS_TTL;
  } catch {
    return false;
  }
}

function saveDismissed() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
}

/* ── iOS tooltip pointing to the Safari share button ───────────────── */
function IOSTooltip({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      role="dialog"
      aria-label="Add Moveee to your home screen"
      style={{
        position: "fixed",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 72px)",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        maxWidth: 360,
        background: "var(--ink)",
        color: "#fff",
        borderRadius: "var(--radius-xl)",
        padding: "16px",
        boxShadow: "0 8px 32px rgba(20,17,13,0.4)",
        zIndex: 9999,
        animation: "pwa-slide-up 0.3s ease",
      }}
    >
      {/* Close */}
      <button
        onClick={onDismiss}
        aria-label="Close"
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.5)",
          fontSize: "1.1rem",
          lineHeight: 1,
          cursor: "pointer",
          padding: "4px 6px",
        }}
      >
        ✕
      </button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <img
          src="/icons/apple-touch-icon.png"
          alt=""
          width={36}
          height={36}
          style={{ borderRadius: 8, flexShrink: 0 }}
        />
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.875rem" }}>Add Moveee to your home screen</div>
          <div style={{ fontSize: "0.72rem", opacity: 0.65, marginTop: 2 }}>Faster access, works offline</div>
        </div>
      </div>

      {/* Steps */}
      <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
        <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.8rem" }}>
          <span style={{
            flexShrink: 0,
            width: 24, height: 24,
            background: "var(--ochre)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: "0.75rem",
          }}>1</span>
          <span>
            Tap the{" "}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, verticalAlign: "middle" }}>
              {/* iOS share icon */}
              <svg width="14" height="16" viewBox="0 0 14 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 1v9M4 4l3-3 3 3" />
                <path d="M1 10v4a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-4" />
              </svg>
              <strong>Share</strong>
            </span>{" "}
            button at the bottom of Safari
          </span>
        </li>
        <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.8rem" }}>
          <span style={{
            flexShrink: 0,
            width: 24, height: 24,
            background: "var(--ochre)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: "0.75rem",
          }}>2</span>
          <span>
            Scroll down and tap{" "}
            <strong>&ldquo;Add to Home Screen&rdquo;</strong>
          </span>
        </li>
      </ol>

      {/* Caret pointing to Safari toolbar */}
      <div style={{
        position: "absolute",
        bottom: -8,
        left: "50%",
        transform: "translateX(-50%)",
        width: 0, height: 0,
        borderLeft: "8px solid transparent",
        borderRight: "8px solid transparent",
        borderTop: "8px solid var(--ink)",
      }} />

      <style>{`
        @keyframes pwa-slide-up {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ── Android / Chrome bottom-sheet ─────────────────────────────────── */
function AndroidPrompt({
  onInstall,
  onDismiss,
}: {
  onInstall: () => void;
  onDismiss: () => void;
}) {
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
          onClick={onDismiss}
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
          onClick={onInstall}
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

/* ── Root component ─────────────────────────────────────────────────── */
export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState<"android" | "ios" | null>(null);

  useEffect(() => {
    if (isStandalone() || wasDismissedRecently()) return;

    if (isIosSafari()) {
      setTimeout(() => setShow("ios"), 3000);
      return;
    }

    function handler(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow("android"), 3000);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    setShow(null);
    saveDismissed();
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(null);
      setDeferredPrompt(null);
    }
  }

  if (show === "ios") return <IOSTooltip onDismiss={dismiss} />;
  if (show === "android") return <AndroidPrompt onInstall={install} onDismiss={dismiss} />;
  return null;
}
