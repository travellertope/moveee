// Gold pill badge for Moveee Pro members — mirrors apps/mobile's
// proBadgePill (FeedItemCard.tsx): solid gold rounded rect with a white
// ribbon icon, not an outline checkmark seal.
export default function ProBadge({ size = 14 }: { size?: number }) {
  return (
    <span
      aria-label="Moveee Pro"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#B38238",
        borderRadius: Math.max(3, size * 0.3),
        padding: Math.max(2, size * 0.16),
        flexShrink: 0,
        lineHeight: 0,
      }}
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8.5" r="6.5" fill="#fff" />
        <path d="M7.5 13.5L5 22l7-3.5L19 22l-2.5-8.5" fill="#fff" />
      </svg>
    </span>
  );
}
