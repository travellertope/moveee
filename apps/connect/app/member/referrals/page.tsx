"use client";

import { useEffect } from "react";

export default function ReferralsRedirect() {
  useEffect(() => {
    window.location.replace("/member/analytics#referrals");
  }, []);
  return null;
}
