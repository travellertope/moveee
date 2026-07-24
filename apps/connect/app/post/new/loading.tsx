export default function PostNewLoading() {
  return (
    <div className="post-new-wrap">
      <div className="post-new-skeleton">
        <div className="post-new-skeleton-bar" style={{ width: "40%", height: 20 }} />
        <div className="post-new-skeleton-bar" style={{ width: "30%", height: 32, borderRadius: 9999 }} />
        <div className="post-new-skeleton-bar" style={{ width: "100%", height: 90 }} />
        <div className="post-new-skeleton-bar" style={{ width: "100%", height: 90 }} />
      </div>
    </div>
  );
}
