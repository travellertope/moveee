"use client";

import { useRef, useState } from "react";

interface Props {
  /** Spotify 30s preview URL — if omitted the cover is shown without a button. */
  src?: string;
  /** Album cover image URL — if omitted just the button circle is shown. */
  coverUrl?: string;
  /** Square size in px for the cover / button area (default 64). */
  size?: number;
}

/** Album cover with an overlay play/pause button for Spotify 30s preview clips.
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

  const btnSize = Math.round(size * 0.44);

  return (
    <div
      style={{
        position: "relative",
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: "var(--radius-md)",
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
            background: "rgba(0,0,0,0.52)",
            border: "2px solid rgba(255,255,255,0.7)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: Math.round(btnSize * 0.38) + "px",
            backdropFilter: "blur(2px)",
            transition: "background 0.15s, transform 0.1s",
            lineHeight: 1,
            paddingLeft: playing ? 0 : "2px",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.72)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.52)")}
          aria-label={playing ? "Pause preview" : "Play preview"}
        >
          {playing ? "⏸" : "▶"}
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
