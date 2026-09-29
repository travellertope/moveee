"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { PlaceProximity } from "@/lib/reading-tracker";

// Stoop proximity banner — "N people within 3 miles want to go too. Start a
// Stoop here?" — web mirror of
// apps/mobile/src/components/community/StoopProximityBanner.tsx. Capture is
// a one-time browser Geolocation snapshot (navigator.geolocation, no
// continuous/background tracking, same privacy model as the mobile GPS
// capture) — the server fuzzes it to ~1km before storing regardless of
// source precision (see class-culture-geolocation.php).

const RADIUS_MILES = 3;

export default function StoopProximityBanner({
  directoryId,
  isLoggedIn,
}: {
  directoryId: number;
  isLoggedIn: boolean;
}) {
  const [result, setResult] = useState<PlaceProximity | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [deniedPermission, setDeniedPermission] = useState(false);
  const [unsupported, setUnsupported] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/reading/place-proximity?directory_id=${directoryId}`, { cache: "no-store" });
      if (res.ok) setResult(await res.json());
    } catch {}
  }, [directoryId]);

  useEffect(() => {
    if (!isLoggedIn) return;
    load();
  }, [isLoggedIn, load]);

  function handleEnable() {
    if (!("geolocation" in navigator)) {
      setUnsupported(true);
      return;
    }
    setRequesting(true);
    setDeniedPermission(false);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await fetch("/api/me/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: position.coords.latitude, lng: position.coords.longitude }),
          });
          await load();
        } catch {}
        setRequesting(false);
      },
      () => {
        setDeniedPermission(true);
        setRequesting(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  async function handleTurnOff() {
    try {
      await fetch("/api/me/location", { method: "DELETE" });
      setResult({ hasLocation: false, count: 0, examples: [] });
    } catch {}
  }

  if (!isLoggedIn || result === null) return null;

  if (!result.hasLocation) {
    return (
      <div className="dir-proximity">
        <p className="dir-proximity-prompt">
          Turn on location to see who&rsquo;s nearby for places you&rsquo;re interested in.
        </p>
        <button type="button" className="dir-proximity-enable" onClick={handleEnable} disabled={requesting}>
          {requesting ? "Getting your location…" : "Turn on"}
        </button>
        {deniedPermission && (
          <p className="dir-proximity-note">
            Location permission was denied — you can allow it from your browser&rsquo;s site settings.
          </p>
        )}
        {unsupported && (
          <p className="dir-proximity-note">Your browser doesn&rsquo;t support location sharing.</p>
        )}
      </div>
    );
  }

  if (result.count === 0) return null;

  return (
    <div className="dir-proximity">
      <p className="dir-proximity-text">
        <strong>{result.count}</strong> {result.count === 1 ? "person" : "people"} within{" "}
        {RADIUS_MILES} miles want to go too.
      </p>
      <Link href="/cluster/create" className="dir-proximity-cta">
        Start a Stoop here →
      </Link>
      <button type="button" className="dir-proximity-turn-off" onClick={handleTurnOff}>
        Using your location for this · Turn off
      </button>
    </div>
  );
}
