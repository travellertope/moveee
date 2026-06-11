export default function Loading() {
  const shimmer: React.CSSProperties = {
    background: "linear-gradient(90deg,#f0ece6 25%,#e8e2da 50%,#f0ece6 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s ease-in-out infinite",
    borderRadius: "2px",
  };

  return (
    <div style={{ background: "#ffffff", minHeight: "100vh" }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "2rem 1rem" }}>
        {/* Post */}
        <div style={{ background: "#fff", border: "1px solid #e8e2d8", padding: "1.5rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "50%", ...shimmer, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: "12px", width: "40%", ...shimmer, marginBottom: "0.4rem" }} />
              <div style={{ height: "10px", width: "25%", ...shimmer }} />
            </div>
          </div>
          <div style={{ height: "14px", width: "100%", ...shimmer, marginBottom: "0.4rem" }} />
          <div style={{ height: "14px", width: "85%", ...shimmer, marginBottom: "0.4rem" }} />
          <div style={{ height: "14px", width: "60%", ...shimmer }} />
        </div>
        {/* Comments */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #e8e2d8", padding: "1rem 1.5rem", marginBottom: "2px" }}>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", ...shimmer, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: "10px", width: "30%", ...shimmer, marginBottom: "0.4rem" }} />
                <div style={{ height: "12px", width: "80%", ...shimmer }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
