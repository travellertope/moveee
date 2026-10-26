"use client";
import { useState, useEffect, useCallback } from "react";
import "./PwaInstallPrompt.css";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed (standalone) or dismissed before
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;

    try {
      if (localStorage.getItem("pwa-install-dismissed") === "1") {
        setDismissed(true);
        return;
      }
    } catch {}

    if (isStandalone) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Small delay so the prompt doesn't flash on first paint
      setTimeout(() => setVisible(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setDismissed(true);
    try { localStorage.setItem("pwa-install-dismissed", "1"); } catch {}
  }, []);

  if (!visible || dismissed) return null;

  return (
    <div className="pwa-prompt" role="dialog" aria-label="Install the Moveee app">
      <button
        type="button"
        className="pwa-prompt-close"
        onClick={handleDismiss}
        aria-label="Dismiss"
      >
        ✕
      </button>
      <div className="pwa-prompt-icon" aria-hidden="true">
        <img src="/icons/icon-96x96.png" alt="" width={48} height={48} />
      </div>
      <div className="pwa-prompt-body">
        <p className="pwa-prompt-title">Install the Moveee app</p>
        <p className="pwa-prompt-sub">Discover and Engage with Culture — and Earn Real Rewards.</p>
      </div>
      <button
        type="button"
        className="pwa-prompt-cta"
        onClick={handleInstall}
      >
        Install
      </button>
    </div>
  );
}
