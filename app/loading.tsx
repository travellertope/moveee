const S = {
  shimmer: {
    background: "linear-gradient(90deg, #f0ece6 25%, #e8e2da 50%, #f0ece6 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s ease-in-out infinite",
    borderRadius: "2px",
  } as React.CSSProperties,
};

export default function Loading() {
  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      {/* Hero placeholder */}
      <div style={{ height: "70vh", ...S.shimmer, borderRadius: 0 }} />

      {/* Content rows */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "3rem 2rem", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div style={{ height: "220px", ...S.shimmer, marginBottom: "0.75rem" }} />
            <div style={{ height: "14px", width: "60%", ...S.shimmer, marginBottom: "0.4rem" }} />
            <div style={{ height: "12px", width: "40%", ...S.shimmer }} />
          </div>
        ))}
      </div>
    </div>
  );
}
