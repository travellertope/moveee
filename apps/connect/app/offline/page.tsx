export default function OfflinePage() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "70vh",
      padding: "32px 24px",
      textAlign: "center",
      gap: 16,
    }}>
      <div style={{ fontSize: 48, lineHeight: 1 }}>📡</div>
      <h1 style={{
        fontFamily: "Georgia, serif",
        fontSize: "1.5rem",
        fontWeight: 700,
        color: "var(--ink)",
        margin: 0,
      }}>
        You&rsquo;re offline
      </h1>
      <p style={{
        fontSize: "0.9rem",
        color: "var(--mute)",
        maxWidth: 320,
        lineHeight: 1.6,
        margin: 0,
      }}>
        No connection right now. Check your signal and try again — your feed will be waiting.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: 8,
          padding: "10px 24px",
          background: "var(--ochre)",
          color: "#fff",
          border: "none",
          borderRadius: "var(--radius-lg)",
          fontSize: "0.875rem",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}
