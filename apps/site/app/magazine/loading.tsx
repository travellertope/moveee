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

      {/* Hero */}
      <div style={{ height: "55vh", ...shimmer, borderRadius: 0 }} />

      {/* Grid */}
      <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "3rem 2rem", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "2rem" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div style={{ height: "240px", ...shimmer, marginBottom: "1rem" }} />
            <div style={{ height: "10px", width: "35%", ...shimmer, marginBottom: "0.5rem" }} />
            <div style={{ height: "18px", width: "85%", ...shimmer, marginBottom: "0.4rem" }} />
            <div style={{ height: "18px", width: "65%", ...shimmer, marginBottom: "0.6rem" }} />
            <div style={{ height: "10px", width: "40%", ...shimmer }} />
          </div>
        ))}
      </div>
    </div>
  );
}
