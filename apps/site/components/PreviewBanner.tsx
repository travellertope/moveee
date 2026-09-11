/**
 * Shown at the top of any page rendered while Next.js Draft Mode is on
 * (see app/api/preview/route.ts) — makes it unmistakable that what's on
 * screen is unpublished, and gives a one-click way back to the live site.
 */
export default function PreviewBanner({ redirectTo }: { redirectTo: string }) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 200,
        background: "var(--ochre, #7a241c)",
        color: "#fff",
        padding: "10px 16px",
        fontFamily: "var(--font-mono, monospace)",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: ".04em",
        textTransform: "uppercase",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
      }}
    >
      <span>Preview mode — this is a draft, not the live page</span>
      <a
        href={`/api/preview/disable?redirect=${encodeURIComponent(redirectTo)}`}
        style={{ color: "#fff", textDecoration: "underline" }}
      >
        Exit preview
      </a>
    </div>
  );
}
