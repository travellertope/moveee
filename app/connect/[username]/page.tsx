import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProfileTabs from "./ProfileTabs";
import ShareButton from "./ShareButton";
import "./profile.css";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://themoveee.com";

interface Profile {
  id: number;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  city: string;
  country: string;
  occupation: string;
  tier: string;
  reputation: number;
  reputation_tier: string;
  badges: string[];
  interests: string[];
  joined: string;
  post_count: number;
}

async function getProfile(username: string): Promise<Profile | null> {
  try {
    const res = await fetch(
      `${WP_URL}/wp-json/culture/v1/member/${encodeURIComponent(username)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const BADGE_LABELS: Record<string, string> = {
  first_steps: "First Steps", regular: "Regular", culture_vulture: "Culture Vulture",
  explorer: "Explorer", globetrotter: "Globetrotter",
  commentator: "Commentator", century_club: "Century Club",
  wordsmith: "Wordsmith", librarian: "Librarian", philosopher: "Philosopher",
  influencer: "Influencer", thought_leader: "Thought Leader",
  culture_archivist: "Culture Archivist", knowledge_keeper: "Knowledge Keeper",
  cultural_encyclopaedist: "Cultural Encyclopaedist",
  cultural_specialist: "Cultural Specialist", deep_diver: "Deep Diver",
  culture_liaison: "Culture Liaison",
  // New badges
  first_post: "First Post", prolific_poster: "Prolific Poster", century_scribe: "Century Scribe",
  conversationalist: "Conversationalist",
  food_critic: "Food Critic", culture_guide: "Culture Guide",
  itinerary_master: "Itinerary Master", poll_champion: "Poll Champion", gem_hunter: "Gem Hunter",
  connector: "Connector", super_connector: "Super Connector",
  profile_complete: "Profile Complete", directory_member: "In the Directory",
  newsletter_subscriber: "Newsletter Subscriber",
  monthly_member: "Monthly Member", veteran: "Veteran", annual_advocate: "Annual Advocate",
  rising_star: "Rising Star", taste_maker_badge: "Taste Maker", culture_authority_badge: "Culture Authority",
};

const BADGE_EMOJI: Record<string, string> = {
  first_steps: "🚩", regular: "🎖️", culture_vulture: "🦅",
  explorer: "🌍", globetrotter: "✈️",
  commentator: "💬", century_club: "💯",
  wordsmith: "✍️", librarian: "📚", philosopher: "🧠",
  influencer: "👍", thought_leader: "📣",
  culture_archivist: "🗂️", knowledge_keeper: "📖", cultural_encyclopaedist: "🏛️",
  cultural_specialist: "💬", deep_diver: "🔍", culture_liaison: "🤝",
  // New
  first_post: "📝", prolific_poster: "✏️", century_scribe: "📜",
  conversationalist: "🗣️",
  food_critic: "🍽️", culture_guide: "💡", itinerary_master: "🗺️",
  poll_champion: "📊", gem_hunter: "💎",
  connector: "🔗", super_connector: "🌐",
  profile_complete: "🪪", directory_member: "📇", newsletter_subscriber: "📬",
  monthly_member: "📅", veteran: "🎖️", annual_advocate: "⭐",
  rising_star: "🌟", taste_maker_badge: "👑", culture_authority_badge: "🏆",
};

const REP_TIER_LABELS: Record<string, string> = {
  member:              "Member",
  "culture-contributor": "Culture Contributor",
  "taste-maker":       "Taste Maker",
  "culture-authority": "Culture Authority",
};

function formatJoined(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export async function generateMetadata(
  { params }: { params: Promise<{ username: string }> }
): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) return { title: "Member not found | Moveee" };

  const repLabel = REP_TIER_LABELS[profile.reputation_tier] ?? "Member";
  const description = profile.bio
    ? `${profile.bio} — ${repLabel} on Moveee Connect.`
    : `${profile.display_name}'s profile on Moveee Connect — ${repLabel}.`;

  return {
    title: `${profile.display_name} | Moveee Connect`,
    description,
    openGraph: {
      title: `${profile.display_name} | Moveee Connect`,
      description,
      url: `${SITE_URL}/connect/${profile.username}`,
      images: profile.avatar_url ? [{ url: profile.avatar_url }] : [],
    },
    twitter: {
      card: "summary",
      title: `${profile.display_name} | Moveee Connect`,
      description,
      images: profile.avatar_url ? [profile.avatar_url] : [],
    },
  };
}

export default async function PublicProfilePage(
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) notFound();

  const isPatron = profile.tier === "patron";
  const repLabel = REP_TIER_LABELS[profile.reputation_tier] ?? "Member";
  const locationParts = [profile.city, profile.country].filter(Boolean);
  const initial = (profile.display_name || profile.username || "?")
    .charAt(0).toUpperCase();
  const profileUrl = `${SITE_URL}/connect/${profile.username}`;

  return (
    <div className="prf-page">
      <div className="prf-header">
        <div className="prf-header-inner">
          <div className="prf-identity">
            <div className={`prf-avatar${isPatron ? " prf-avatar--patron" : ""}`}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.display_name} />
              ) : initial}
            </div>

            <div className="prf-identity-body">
              <h1 className="prf-name">{profile.display_name}</h1>

              <p className="prf-handle-line">
                <span>@{profile.username}</span>
                {locationParts.length > 0 && (
                  <>
                    <span className="prf-handle-sep">·</span>
                    <span>{locationParts.join(", ")}</span>
                  </>
                )}
                {profile.occupation && (
                  <>
                    <span className="prf-handle-sep">·</span>
                    <span>{profile.occupation}</span>
                  </>
                )}
              </p>

              <div className="prf-badges">
                <span className={`prf-tier-badge prf-tier-badge--${isPatron ? "patron" : "citizen"}`}>
                  {isPatron ? "Connect Pro" : "Connect Citizen"}
                </span>
                {profile.reputation_tier !== "member" && (
                  <span className="prf-rep-badge">{repLabel}</span>
                )}
              </div>

              {profile.badges.length > 0 && (
                <div className="prf-badge-shelf">
                  {profile.badges.map(badge => (
                    <span key={badge} className="prf-gamification-badge prf-gamification-badge--shelf" title={BADGE_LABELS[badge] ?? badge.replace(/_/g, " ")}>
                      {BADGE_EMOJI[badge] ?? "🏅"} {BADGE_LABELS[badge] ?? badge.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}

              {profile.bio && <p className="prf-bio">{profile.bio}</p>}

              <div className="prf-stats">
                <span className="prf-stat"><strong>{profile.reputation.toLocaleString()}</strong> rep</span>
                <span className="prf-stat"><strong>{profile.post_count}</strong> posts</span>
                <span className="prf-stat">Joined <strong>{formatJoined(profile.joined)}</strong></span>
              </div>

              <div className="prf-actions">
                <ShareButton url={profileUrl} name={profile.display_name} />
                <Link href="/connect/people" className="prf-share-btn" style={{ textDecoration: "none" }}>
                  ← Directory
                </Link>
              </div>
            </div>
          </div>

          <ProfileTabs profile={{
            id: profile.id,
            username: profile.username,
            reputation: profile.reputation,
            reputation_tier: profile.reputation_tier,
          }} />
        </div>
      </div>
    </div>
  );
}
