import Link from "next/link";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

interface Hub {
  id: number;
  name: string;
  slug: string;
  memberCount: number;
  postCount: number;
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

export default async function RightSidebar() {
  const hubs = await fetchTrendingHubs();

  if (hubs.length === 0) return null;

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
    </aside>
  );
}
