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

      {/* Hero image */}
      <div style={{ height: "65vh", ...shimmer, borderRadius: 0 }} />

      {/* Article body */}
      <div style={{ maxWidth: "740px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        <div style={{ height: "12px", width: "30%", ...shimmer, marginBottom: "1.5rem" }} />
        <div style={{ height: "36px", width: "90%", ...shimmer, marginBottom: "0.5rem" }} />
        <div style={{ height: "36px", width: "70%", ...shimmer, marginBottom: "2rem" }} />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ height: "14px", width: `${70 + (i % 4) * 8}%`, ...shimmer, marginBottom: "0.6rem" }} />
        ))}
      </div>
    </div>
  );
}
