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

      <div style={{ display: "grid", gridTemplateColumns: "190px 1fr 220px", maxWidth: "1440px", margin: "0 auto" }}>
        {/* Left sidebar skeleton */}
        <div style={{ padding: "1.25rem 0.75rem", borderRight: "1px solid #e8e2d8" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ height: "12px", width: `${50 + (i % 3) * 20}%`, ...shimmer, marginBottom: "0.7rem" }} />
          ))}
        </div>

        {/* Timeline skeleton */}
        <div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ background: "#fff", borderBottom: "1px solid #e8e2d8", padding: "0.9rem 1.25rem", display: "flex", gap: "0.9rem" }}>
              <div style={{ flex: 1 }}>
                <div style={{ height: "10px", width: "30%", ...shimmer, marginBottom: "0.5rem" }} />
                <div style={{ height: "14px", width: "90%", ...shimmer, marginBottom: "0.3rem" }} />
                <div style={{ height: "14px", width: "70%", ...shimmer, marginBottom: "0.5rem" }} />
                <div style={{ height: "10px", width: "25%", ...shimmer }} />
              </div>
              {i % 2 === 0 && <div style={{ width: "90px", height: "90px", flexShrink: 0, ...shimmer }} />}
            </div>
          ))}
        </div>

        {/* Right sidebar skeleton */}
        <div style={{ padding: "1.25rem 0.75rem", borderLeft: "1px solid #e8e2d8" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ height: "12px", width: `${40 + (i % 4) * 15}%`, ...shimmer, marginBottom: "0.7rem" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
