"use client";

import { useEffect } from "react";

export default function PerksRedirect() {
  useEffect(() => {
    window.location.replace("/member/wallet#perks");
  }, []);
  return null;
}
