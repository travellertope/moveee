"use client";

// Splits text on #hashtag tokens and renders them as clickable gold buttons.
const SPLIT_RE = /(#[a-zA-Z][a-zA-Z0-9_]{1,49})/g;

interface HashtagTextProps {
  text: string;
  onHashtagClick?: (hashtag: string) => void;
  clamp?: number; // WebkitLineClamp value
}

export default function HashtagText({ text, onHashtagClick, clamp }: HashtagTextProps) {
  const parts = text.split(SPLIT_RE);

  return (
    <span
      style={
        clamp
          ? {
              display: "-webkit-box",
              WebkitLineClamp: clamp,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }
          : undefined
      }
    >
      {parts.map((part, i) =>
        SPLIT_RE.test(part) ? (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onHashtagClick?.(part);
            }}
            style={{
              color: "#D4A847",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              font: "inherit",
              lineHeight: "inherit",
            }}
          >
            {part}
          </button>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}
