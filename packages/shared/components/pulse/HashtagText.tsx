"use client";

const MENTION_RE = /@(\w+)/g;

interface HashtagTextProps {
  text: string;
  onMentionClick?: (username: string) => void;
  clamp?: number;
}

function InlineTokens({ text, onMentionClick }: { text: string; onMentionClick?: (u: string) => void }) {
  const parts = text.split(/((@\w+))/g).filter((_, i) => i % 3 !== 2); // drop full-match group
  // Re-split cleanly
  const segments: string[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  const re = /@(\w+)/g;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) segments.push(text.slice(last, match.index));
    segments.push(match[0]); // the @username token
    last = match.index + match[0].length;
  }
  if (last < text.length) segments.push(text.slice(last));

  return (
    <>
      {segments.map((part, i) => {
        if (/^@\w+$/.test(part)) {
          const username = part.slice(1);
          return (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onMentionClick?.(username); }}
              style={{ color: "var(--gold, #b38238)", background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit", lineHeight: "inherit", fontWeight: 600 }}
            >
              {part}
            </button>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export default function HashtagText({ text, onMentionClick, clamp }: HashtagTextProps) {
  const paragraphs = text.split(/\n\n+/);
  const hasMultipleParagraphs = paragraphs.length > 1;

  if (hasMultipleParagraphs) {
    return (
      <div style={clamp ? { display: "-webkit-box", WebkitLineClamp: clamp, WebkitBoxOrient: "vertical", overflow: "hidden" } : undefined}>
        {paragraphs.map((para, i) => (
          <p key={i} style={{ margin: i === 0 ? 0 : "0.65em 0 0" }}>
            <InlineTokens text={para.replace(/\n/g, " ")} onMentionClick={onMentionClick} />
          </p>
        ))}
      </div>
    );
  }

  return (
    <span
      style={
        clamp
          ? { display: "-webkit-box", WebkitLineClamp: clamp, WebkitBoxOrient: "vertical", overflow: "hidden" }
          : undefined
      }
    >
      <InlineTokens text={text.replace(/\n/g, " ")} onMentionClick={onMentionClick} />
    </span>
  );
}
