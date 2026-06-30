"use client";

import { useEffect, useState } from "react";
import AuthModal from "./AuthModal";

export default function GlobalAuthModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function onOpen() {
      setIsOpen(true);
    }
    window.addEventListener("open-auth-modal", onOpen);
    return () => window.removeEventListener("open-auth-modal", onOpen);
  }, []);

  if (!isOpen) return null;

  return <AuthModal onClose={() => setIsOpen(false)} />;
}
