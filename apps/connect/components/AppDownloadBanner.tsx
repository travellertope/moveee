"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "moveee_app_banner_dismissed";
const APP_LINK = "https://themoveee.com/#download";

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

  return (
    <div className="adb-banner">
      <span className="adb-text">
        <strong>Moveee</strong> is better in the app — Connect to Culture on the go.
      </span>
      <div className="adb-actions">
        <a href={APP_LINK} className="adb-cta">Get the app →</a>
        <button type="button" className="adb-dismiss" aria-label="Dismiss" onClick={handleDismiss}>
          ✕
        </button>
      </div>
    </div>
  );
}
