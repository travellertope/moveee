"use client";
import { useEffect } from "react";

export default function HideSidebar() {
  useEffect(() => {
    document.body.classList.add("hide-sidebar");
    return () => { document.body.classList.remove("hide-sidebar"); };
  }, []);
  return null;
}
