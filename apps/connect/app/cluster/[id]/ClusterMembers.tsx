interface ClusterMember {
  id: number;
  name: string;
  avatarUrl: string;
  role: string;
  joinedAt: string;
}

// Mirrors StoopBrowser.tsx's avatarColor() — no shared source of truth for
// this small per-component color helper, same caveat as elsewhere.
const AVATAR_COLORS = [
  "#c5491f", "#1976d2", "#2e7d32", "#b38238", "#6b48a8", "#8d6e63",
  "#7b1fa2", "#c2185b", "#00695c", "#37474f", "#283593", "#5d4037",
];
function avatarColor(id: number): string {
  const s = String(id);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function formatJoined(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export default function ClusterMembers({
  members, totalCount,
}: { members: ClusterMember[]; totalCount: number; clusterId: number }) {
  if (members.length === 0) {
    return <p className="stoop-detail-sec-sub" style={{ marginBottom: 0 }}>No members yet.</p>;
  }

  return (
    <div>
      <div className="stoop-member-list">
        {members.map((m) => (
          <div key={m.id} className="stoop-member-row">
            <span className="stoop-member-av" style={{ background: avatarColor(m.id) }} aria-hidden="true">
              {m.avatarUrl ? <img src={m.avatarUrl} alt="" /> : m.name.charAt(0).toUpperCase()}
            </span>
            <span className="stoop-member-name">
              {m.name}
              {m.role === "host" && <span className="stoop-member-role">Host</span>}
            </span>
            <span className="stoop-member-joined">Joined {formatJoined(m.joinedAt)}</span>
          </div>
        ))}
      </div>
      {totalCount > members.length && (
        <p className="stoop-member-more">+ {totalCount - members.length} more member{totalCount - members.length === 1 ? "" : "s"}</p>
      )}
    </div>
  );
}
