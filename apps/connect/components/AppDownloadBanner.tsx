"use client";

import { useEffect, useState } from "react";
import { OPEN_APP_MODAL_EVENT } from "./AppDownloadModal";

const STORAGE_KEY = "moveee_app_banner_dismissed";

export default function AppDownloadBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(sessionStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  if (dismissed) return null;

  function handleDismiss() {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  }

  function handleGetApp() {
    window.dispatchEvent(new Event(OPEN_APP_MODAL_EVENT));
  }

  return (
    <div className="adb-banner">
      <span className="adb-text">
        <strong>Moveee</strong> is better in the app — Connect to Culture on the go.
      </span>
      <div className="adb-actions">
        <button type="button" className="adb-cta" onClick={handleGetApp}>Get the app →</button>
        <button type="button" className="adb-dismiss" aria-label="Dismiss" onClick={handleDismiss}>
          ✕
        </button>
      </div>
    </div>
  );
}
