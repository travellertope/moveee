"use client";

import { useRef, useState } from "react";

/** 30s Spotify preview clip play/pause button — used on Music Review cards.
 * Stops propagation so it doesn't trigger whatever click-to-open-detail
 * handler wraps the card it's rendered inside. */
export default function AudioPreviewButton({ src }: { src: string }) {
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

  return (
    <button
      type="button"
      onClick={toggle}
      style={{
        display: "inline-flex", alignItems: "center", gap: "5px",
        fontSize: "0.68rem", fontWeight: 700, color: "#0D7377",
        background: "rgba(13,115,119,0.1)", border: "none",
        borderRadius: "999px", padding: "3px 10px", cursor: "pointer",
      }}
    >
      {playing ? "⏸" : "▶"} Preview
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        style={{ display: "none" }}
      />
    </button>
  );
}
