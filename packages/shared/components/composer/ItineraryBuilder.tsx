"use client";

import { useRef, useState } from "react";

export interface ItineraryStop {
  name: string;
  lat: number;
  lng: number;
  note: string;
  image_url: string;
}

interface Props {
  stops: ItineraryStop[];
  onChange: (stops: ItineraryStop[]) => void;
}

const EMPTY_STOP: ItineraryStop = { name: "", lat: 0, lng: 0, note: "", image_url: "" };

export default function ItineraryBuilder({ stops, onChange }: Props) {
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function update(i: number, field: keyof ItineraryStop, value: string | number) {
    const next = [...stops];
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  }

  function addStop() {
    if (stops.length < 5) onChange([...stops, { ...EMPTY_STOP }]);
  }

  function removeStop(i: number) {
    if (stops.length > 2) onChange(stops.filter((_, j) => j !== i));
  }

  async function handleStopImage(i: number, file: File) {
    setUploadingIdx(i);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/community/upload-image", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) update(i, "image_url", data.url);
    } catch {}
    setUploadingIdx(null);
  }

  return (
    <div className="composer-itinerary">
      {stops.map((stop, i) => (
        <div key={i} className="composer-itinerary-stop">
          <div className="composer-itinerary-num">{i + 1}</div>
          <div className="composer-itinerary-fields">
            <input
              type="text"
              value={stop.name}
              onChange={(e) => update(i, "name", e.target.value)}
              placeholder="Location name"
              className="composer-itinerary-input"
            />
            <textarea
              value={stop.note}
              onChange={(e) => update(i, "note", e.target.value)}
              placeholder="Quick note (optional)"
              className="composer-itinerary-note"
              maxLength={300}
              rows={2}
            />
            {/* Per-stop photo */}
            <input
              ref={el => { fileInputRefs.current[i] = el; }}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={e => { if (e.target.files?.[0]) handleStopImage(i, e.target.files[0]); e.target.value = ""; }}
            />
            {stop.image_url ? (
              <div className="composer-stop-photo-preview">
                <img src={stop.image_url} alt="Stop photo" />
                <button type="button" className="composer-stop-photo-remove" onClick={() => update(i, "image_url", "")} aria-label="Remove photo">✕</button>
              </div>
            ) : (
              <button
                type="button"
                className={`composer-stop-photo-add${uploadingIdx === i ? " composer-stop-photo-add--uploading" : ""}`}
                onClick={() => fileInputRefs.current[i]?.click()}
                disabled={uploadingIdx === i}
              >
                📷 {uploadingIdx === i ? "Uploading…" : "Add photo (optional)"}
              </button>
            )}
          </div>
          {stops.length > 2 && (
            <button type="button" className="composer-itinerary-remove" onClick={() => removeStop(i)}>×</button>
          )}
        </div>
      ))}
      {stops.length < 5 && (
        <button type="button" className="composer-itinerary-add" onClick={addStop}>+ Add stop</button>
      )}
    </div>
  );
}
