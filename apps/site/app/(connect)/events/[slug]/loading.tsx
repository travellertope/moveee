export default function Loading() {
  const shimmer: React.CSSProperties = {
    background: "linear-gradient(90deg,#f0ece6 25%,#e8e2da 50%,#f0ece6 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s ease-in-out infinite",
    borderRadius: "2px",
  };

  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      {/* Hero split */}
      <div style={{ display: "grid", gridTemplateColumns: "55% 45%", height: "85vh" }}>
        <div style={{ padding: "70px 80px", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: "1rem" }}>
          <div style={{ height: "10px", width: "35%", ...shimmer }} />
          <div style={{ height: "52px", width: "85%", ...shimmer }} />
          <div style={{ height: "52px", width: "65%", ...shimmer }} />
          <div style={{ height: "16px", width: "50%", ...shimmer }} />
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <div style={{ height: "48px", width: "130px", ...shimmer }} />
            <div style={{ height: "48px", width: "130px", ...shimmer }} />
          </div>
        </div>
        <div style={{ ...shimmer, borderRadius: 0 }} />
      </div>
    </div>
  );
}
