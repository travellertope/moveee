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

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }

  if (!src && !coverUrl) return null;

  const coverRadius = size >= 60 ? "var(--radius-xl)" : "var(--radius-md)";
  const btnSize = Math.round(size * 0.44);
  const iconSize = Math.round(btnSize * 0.42);

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
          aria-label={playing ? "Pause preview" : "Play preview"}
        >
          {playing ? (
            <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="#14110d" aria-hidden="true">
              <rect x="5" y="4" width="4" height="16" rx="1"/>
              <rect x="15" y="4" width="4" height="16" rx="1"/>
            </svg>
          ) : (
            <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="#14110d" style={{ marginLeft: "2px" }} aria-hidden="true">
              <polygon points="6,4 20,12 6,20"/>
            </svg>
          )}
          <audio
            ref={audioRef}
            src={src}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            style={{ display: "none" }}
          />
        </button>
      )}
    </div>
  );
}
