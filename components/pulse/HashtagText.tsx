"use client";

const SPLIT_RE = /(#[a-zA-Z][a-zA-Z0-9_]{1,49})/g;

interface HashtagTextProps {
  text: string;
  onHashtagClick?: (hashtag: string) => void;
  clamp?: number;
}

function InlineTokens({ text, onHashtagClick }: { text: string; onHashtagClick?: (h: string) => void }) {
  const parts = text.split(SPLIT_RE);
  return (
    <>
      {parts.map((part, i) =>
        SPLIT_RE.test(part) ? (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onHashtagClick?.(part); }}
            style={{ color: "#D4A847", background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit", lineHeight: "inherit" }}
          >
            {part}
          </button>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default function HashtagText({ text, onHashtagClick, clamp }: HashtagTextProps) {
  const paragraphs = text.split(/\n\n+/);
  const hasMultipleParagraphs = paragraphs.length > 1;

  if (hasMultipleParagraphs) {
    return (
      <div style={clamp ? { display: "-webkit-box", WebkitLineClamp: clamp, WebkitBoxOrient: "vertical", overflow: "hidden" } : undefined}>
        {paragraphs.map((para, i) => (
          <p key={i} style={{ margin: i === 0 ? 0 : "0.65em 0 0" }}>
            <InlineTokens text={para.replace(/\n/g, " ")} onHashtagClick={onHashtagClick} />
          </p>
        ))}
      </div>
    );
  }

  // Single paragraph
  return (
    <span
      style={
        clamp
          ? { display: "-webkit-box", WebkitLineClamp: clamp, WebkitBoxOrient: "vertical", overflow: "hidden" }
          : undefined
      }
    >
      <InlineTokens text={text.replace(/\n/g, " ")} onHashtagClick={onHashtagClick} />
    </span>
  );
}
