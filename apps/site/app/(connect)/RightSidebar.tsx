import Link from "next/link";
import SidebarFollowBtn from "./SidebarFollowBtn";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

interface Hub {
  id: number;
  name: string;
  slug: string;
  memberCount: number;
  postCount: number;
}

interface Member {
  id: number;
  username: string;
  display_name: string;
  avatar_url: string;
  occupation: string;
  city: string;
  tier: string;
}

async function fetchTrendingHubs(): Promise<Hub[]> {
  try {
    const res = await fetch(
      `${WP_URL}/wp-json/culture/v1/hub/discover?sort=popular&per_page=5`,
      { headers: { Authorization: `Bearer ${API_SECRET}` }, next: { revalidate: 900 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.hubs ?? []).slice(0, 5);
  } catch {
    return [];
  }
}

async function fetchSuggestedMembers(): Promise<Member[]> {
  try {
    const res = await fetch(
      `${WP_URL}/wp-json/culture/v1/members?sort=recent&per_page=5&directory=1`,
      { headers: { Authorization: `Bearer ${API_SECRET}` }, next: { revalidate: 900 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.slice(0, 5) : [];
  } catch {
    return [];
  }
}

function MemberAvatar({ member }: { member: Member }) {
  const initials = member.display_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (member.avatar_url) {
    return (
      <img
        src={member.avatar_url}
        alt={member.display_name}
        className="rsb-avatar"
        width={36}
        height={36}
      />
    );
  }
  return <span className="rsb-avatar rsb-avatar--initials">{initials}</span>;
}

export default async function RightSidebar() {
  const [hubs, members] = await Promise.all([
    fetchTrendingHubs(),
    fetchSuggestedMembers(),
  ]);

  if (hubs.length === 0 && members.length === 0) return null;

  return (
    <aside className="cw-shell-aside">
      {hubs.length > 0 && (
        <div className="rsb-card">
          <div className="rsb-card-title">Trending on Moveee</div>
          <ul className="rsb-hub-list">
            {hubs.map((hub) => (
              <li key={hub.id} className="rsb-hub-item">
                <Link href={`/hub/${hub.slug}`} className="rsb-hub-name">
                  #{hub.name}
                </Link>
                <span className="rsb-hub-meta">
                  {hub.memberCount > 0
                    ? `${hub.memberCount.toLocaleString()} members`
                    : `${hub.postCount.toLocaleString()} posts`}
                </span>
              </li>
            ))}
          </ul>
          <Link href="/hub" className="rsb-see-all">
            Browse all hubs →
          </Link>
        </div>
      )}

      {members.length > 0 && (
        <div className="rsb-card">
          <div className="rsb-card-title">Suggested Citizens</div>
          <ul className="rsb-member-list">
            {members.map((m) => (
              <li key={m.id} className="rsb-member-item">
                <Link href={`/connect/${m.username}`} className="rsb-member-link">
                  <MemberAvatar member={m} />
                  <div className="rsb-member-info">
                    <span className="rsb-member-name">{m.display_name}</span>
                    {(m.occupation || m.city) && (
                      <span className="rsb-member-sub">
                        {m.occupation || m.city}
                      </span>
                    )}
                  </div>
                </Link>
                <SidebarFollowBtn username={m.username} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
