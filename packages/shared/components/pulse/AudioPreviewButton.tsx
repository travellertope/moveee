"use client";

import { useRef, useState } from "react";

interface Props {
  /** iTunes 30s preview URL — if omitted the cover is shown without a button. */
  src?: string;
  /** Album cover image URL — if omitted just the button circle is shown. */
  coverUrl?: string;
  /** Square size in px for the cover / button area (default 64). */
  size?: number;
}

/** Album cover with an overlay play/pause button for iTunes 30s preview clips.
 * Stops propagation so it doesn't trigger the card's click-to-open handler. */
export default function AudioPreviewButton({ src, coverUrl, size = 64 }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      setBuffering(false);
    } else {
      setUnavailable(false);
      setBuffering(true);
      // Only reload if the element is in an error state; otherwise the browser
      // may have already buffered some data and load() would throw it away.
      if (audio.error) audio.load();
      audio.play().catch((err) => {
        console.warn("[AudioPreviewButton] play() rejected:", err);
        setPlaying(false);
        setBuffering(false);
        setUnavailable(true);
        setTimeout(() => setUnavailable(false), 2500);
      });
    }
  }

  if (!src && !coverUrl) return null;

  const coverRadius = size >= 60 ? "var(--radius-xl)" : "var(--radius-md)";
  const btnSize = Math.round(size * 0.44);
  const iconSize = Math.round(btnSize * 0.42);
  const spinnerSize = Math.round(btnSize * 0.55);

  return (
    <div
      style={{
        position: "relative",
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: coverRadius,
        overflow: "hidden",
        background: coverUrl ? "transparent" : "rgba(20,17,13,0.08)",
      }}
    >
      {coverUrl && (
        <img
          src={coverUrl}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      )}
      {src && (
        <>
          <audio
            ref={audioRef}
            src={src}
            preload="metadata"
            onPlay={() => { setPlaying(true); setBuffering(false); }}
            onPause={() => { setPlaying(false); setBuffering(false); }}
            onEnded={() => { setPlaying(false); setBuffering(false); }}
            onCanPlay={() => setBuffering(false)}
            onError={() => {
              setPlaying(false);
              setBuffering(false);
              setUnavailable(true);
              setTimeout(() => setUnavailable(false), 2500);
            }}
            style={{ display: "none" }}
          />
          {unavailable ? (
            <div style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.55)",
              borderRadius: coverRadius,
            }}>
              <span style={{ fontSize: Math.max(8, Math.round(size * 0.12)), color: "#fff", fontWeight: 700, textAlign: "center", padding: "0 4px", lineHeight: 1.2 }}>
                No preview
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={toggle}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: btnSize,
                height: btnSize,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.92)",
                border: "none",
                boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.75)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.92)")}
              aria-label={playing ? "Pause preview" : buffering ? "Loading…" : "Play preview"}
            >
              {buffering ? (
                <svg
                  width={spinnerSize}
                  height={spinnerSize}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#14110d"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  aria-hidden="true"
                  style={{ animation: "apb-spin 0.8s linear infinite" }}
                >
                  <circle cx="12" cy="12" r="9" strokeOpacity="0.2" />
                  <path d="M12 3 A9 9 0 0 1 21 12" />
                  <style>{`@keyframes apb-spin { to { transform: rotate(360deg) } }`}</style>
                </svg>
              ) : playing ? (
                <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="#14110d" aria-hidden="true">
                  <rect x="5" y="4" width="4" height="16" rx="1"/>
                  <rect x="15" y="4" width="4" height="16" rx="1"/>
                </svg>
              ) : (
                <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="#14110d" style={{ marginLeft: "2px" }} aria-hidden="true">
                  <polygon points="6,4 20,12 6,20"/>
                </svg>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
