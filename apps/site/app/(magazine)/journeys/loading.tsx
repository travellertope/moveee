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
      <div style={{ height: "60vh", ...shimmer, borderRadius: 0 }} />
      <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "3rem 2rem", display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "2rem" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div style={{ height: "340px", ...shimmer, marginBottom: "1rem" }} />
            <div style={{ height: "14px", width: "70%", ...shimmer, marginBottom: "0.5rem" }} />
            <div style={{ height: "12px", width: "45%", ...shimmer }} />
          </div>
        ))}
      </div>
    </div>
  );
}
