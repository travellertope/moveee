import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProfileTabs from "./ProfileTabs";
import ShareButton from "./ShareButton";
import FollowButton from "./FollowButton";
import BadgeShelf from "./BadgeShelf";
import "./profile.css";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://themoveee.com";

interface Profile {
  id: number;
  username: string;
  display_name: string;
  avatar_url: string;
  cover_photo_url: string;
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
  followers_count: number;
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

const REP_TIER_LABELS: Record<string, string> = {
  member:                "Member",
  "culture-contributor": "Culture Contributor",
  "taste-maker":         "Taste Maker",
  "culture-authority":   "Culture Authority",
  "culture-icon":        "Culture Icon",
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
    ? `${profile.bio} — ${repLabel} on Moveee.`
    : `${profile.display_name}'s profile on Moveee — ${repLabel}.`;

  return {
    title: `${profile.display_name} | Moveee`,
    description,
    openGraph: {
      title: `${profile.display_name} | Moveee`,
      description,
      url: `${SITE_URL}/connect/${profile.username}`,
      images: profile.avatar_url ? [{ url: profile.avatar_url }] : [],
    },
    twitter: {
      card: "summary",
      title: `${profile.display_name} | Moveee`,
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
        {profile.cover_photo_url ? (
          <div className="prf-cover">
            <img src={profile.cover_photo_url} alt="" className="prf-cover-img" />
          </div>
        ) : null}
        <div className="prf-header-inner">
          <div className="prf-identity">
            <div className={`prf-avatar${isPatron ? " prf-avatar--patron" : ""}`}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.display_name} />
              ) : initial}
            </div>

            <div className="prf-identity-body">
              <h1 className="prf-name">
                {profile.display_name}
                {isPatron && (
                  <svg className="prf-pro-check" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-label="Connect Pro">
                    <path d="M12 2l2.4 1.7 2.9-.4 1.2 2.6 2.6 1.2-.4 2.9L22 12l-1.7 2.4.4 2.9-2.6 1.2-1.2 2.6-2.9-.4L12 22l-2.4-1.7-2.9.4-1.2-2.6-2.6-1.2.4-2.9L2 12l1.7-2.4-.4-2.9 2.6-1.2 1.2-2.6 2.9.4L12 2z" fill="#B38238"/>
                    <path d="M8.5 12.2l2.4 2.4 4.8-5.4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                )}
              </h1>

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
                {profile.reputation_tier !== "member" && (
                  <span className="prf-rep-badge">{repLabel}</span>
                )}
              </div>

              <BadgeShelf badges={profile.badges} />

              {profile.bio && <p className="prf-bio">{profile.bio}</p>}

              <div className="prf-stats">
                <span className="prf-stat"><strong>{profile.reputation.toLocaleString()}</strong> pts</span>
                <span className="prf-stat"><strong>{profile.post_count}</strong> posts</span>
                <span className="prf-stat">Joined <strong>{formatJoined(profile.joined)}</strong></span>
              </div>

              <div className="prf-actions">
                <FollowButton username={profile.username} initialFollowersCount={profile.followers_count} />
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
