"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import SignInPanel from "./SignInPanel";
import "@/app/auth.css";

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  function finishAndClose() {
    onClose();
    router.refresh();
  }

  const currentUrl = typeof window !== "undefined" ? window.location.href : "/";

  return (
    <div ref={overlayRef} onClick={handleOverlayClick} className="auth-modal-overlay">
      <div className="auth-card auth-modal-card" role="dialog" aria-modal="true">
        <button onClick={onClose} className="auth-modal-close" aria-label="Close">✕</button>
        <SignInPanel
          callbackUrl={currentUrl}
          onAuthenticated={finishAndClose}
          onRegisterLinkClick={onClose}
        />
      </div>
    </div>
  );
}
