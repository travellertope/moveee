"use client";

import { useEffect } from "react";

export default function CouponsRedirect() {
  useEffect(() => {
    window.location.replace("/member/wallet#coupons");
  }, []);
  return null;
}
