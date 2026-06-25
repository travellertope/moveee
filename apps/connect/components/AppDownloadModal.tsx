"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const SHOWN_KEY = "moveee_app_modal_shown";
const VIEW_COUNT_KEY = "moveee_app_modal_views";
const PAGE_VIEW_THRESHOLD = 3;
const APP_LINK = "https://themoveee.com/#download";
export const OPEN_APP_MODAL_EVENT = "moveee-open-app-modal";

export default function AppDownloadModal() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SHOWN_KEY) === "1") return;

    const views = Number(sessionStorage.getItem(VIEW_COUNT_KEY) ?? "0") + 1;
    sessionStorage.setItem(VIEW_COUNT_KEY, String(views));

    if (views >= PAGE_VIEW_THRESHOLD) {
      sessionStorage.setItem(SHOWN_KEY, "1");
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Lets other components (e.g. the persistent banner's CTA) open this
  // modal directly instead of linking out, without prop-drilling state
  // through layout.tsx.
  useEffect(() => {
    function handleOpen() {
      setOpen(true);
    }
    window.addEventListener(OPEN_APP_MODAL_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_APP_MODAL_EVENT, handleOpen);
  }, []);

  if (!open) return null;

  return (
    <div className="adm-overlay" onClick={() => setOpen(false)}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="adm-close" aria-label="Close" onClick={() => setOpen(false)}>
          ✕
        </button>
        <p className="adm-eyebrow">★ Moveee</p>
        <h3 className="adm-heading">
          The full experience to <em>connect to culture</em> is on the app.
        </h3>
        <p className="adm-body">
          Real-time notifications, the complete Pulse Feed, your wallet, perks, and the people
          near you — all of it lives natively in the Moveee app. The web is the preview; the app
          is Moveee.
        </p>
        <div className="adm-actions">
          <a href={APP_LINK} className="adm-btn-primary">Get the app →</a>
          <button type="button" className="adm-btn-ghost" onClick={() => setOpen(false)}>
            Continue in browser
          </button>
        </div>
      </div>
    </div>
  );
}
