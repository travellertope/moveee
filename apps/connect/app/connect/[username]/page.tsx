import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ProfileTabs from "./ProfileTabs";
import ShareButton from "./ShareButton";
import FollowButton from "./FollowButton";
import BadgeShelf from "./BadgeShelf";
import CoverPhotoClient from "./CoverPhotoClient";
import AvatarClient from "./AvatarClient";
import "./profile.css";
import "@/app/pulse-layout.css";

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
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export async function generateMetadata(
  { params }: { params: Promise<{ username: string }> }
): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) return { title: "Member not found" };

  const repLabel = REP_TIER_LABELS[profile.reputation_tier] ?? "Member";
  const description = profile.bio
    ? `${profile.bio} — ${repLabel} on Moveee.`
    : `${profile.display_name}'s profile on Moveee — ${repLabel}.`;

  return {
    title: profile.display_name,
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
  const [profile, session] = await Promise.all([
    getProfile(username),
    getServerSession(authOptions as any) as any,
  ]);
  if (!profile) notFound();

  const repLabel = REP_TIER_LABELS[profile.reputation_tier] ?? "Member";
  const locationParts = [profile.city, profile.country].filter(Boolean);
  const initial = (profile.display_name || profile.username || "?")
    .charAt(0).toUpperCase();
  const profileUrl = `${SITE_URL}/connect/${profile.username}`;
  const sessionUsername = session?.user?.username ?? session?.user?.name ?? null;
  const isOwnProfile = sessionUsername &&
    sessionUsername.toLowerCase() === profile.username.toLowerCase();

  // Use session tier as fallback when the WP meta hasn't been synced yet
  // (session tier is set at sign-in from the authoritative source).
  const sessionTier = (session?.user as any)?.tier ?? null;
  const effectiveTier = profile.tier !== "citizen" ? profile.tier : (isOwnProfile ? sessionTier ?? profile.tier : profile.tier);
  const isPatron = effectiveTier === "patron";
  const isLit = effectiveTier === "lit";

  return (
    <div>
      <div className="pulse-layout pulse-layout--feed">

        <main className="pulse-timeline">
          <div className="pulse-timeline-inner">

            {/* Hero card */}
            <article style={{
              background: "var(--paper, #f3ece0)",
              borderRadius: "var(--radius-xl, 12px)",
              border: "1px solid var(--rule, #e8e2d8)",
              overflow: "hidden",
              boxShadow: "0 1px 4px rgba(20,17,13,0.06)",
              margin: "1rem 1.25rem 0",
            }}>
              {/* Cover photo — client component handles upload modal + error fallback */}
              <CoverPhotoClient
                initialCoverUrl={profile.cover_photo_url || null}
                isOwnProfile={!!isOwnProfile}
              />

              {/* Info section */}
              <div style={{ padding: "0 1.5rem 1.5rem" }}>
                {/* Avatar + actions row */}
                <div style={{
                  display: "flex", alignItems: "flex-end",
                  justifyContent: "space-between", flexWrap: "wrap",
                  marginTop: "-64px", marginBottom: "1.1rem", gap: "0.75rem",
                }}>
                  {/* Avatar — client component handles upload modal + onError fallback */}
                  <AvatarClient
                    initialAvatarUrl={profile.avatar_url || null}
                    displayName={profile.display_name}
                    initial={initial}
                    isOwnProfile={!!isOwnProfile}
                  />

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", paddingBottom: "4px" }}>
                    {isOwnProfile ? (
                      <Link href="/member/settings" style={{
                        display: "inline-flex", alignItems: "center", gap: "6px",
                        background: "var(--ochre, #7a241c)", color: "#fff",
                        fontFamily: "var(--font-inter), 'Inter', sans-serif",
                        fontSize: "13px", fontWeight: 600,
                        padding: "9px 20px",
                        borderRadius: "9999px",
                        textDecoration: "none",
                        letterSpacing: "0.01em",
                      }}>
                        Edit Profile
                      </Link>
                    ) : (
                      <FollowButton
                        username={profile.username}
                        initialFollowersCount={profile.followers_count}
                      />
                    )}
                    <ShareButton url={profileUrl} name={profile.display_name} />
                  </div>
                </div>

                {/* Name + PRO badge */}
                <div style={{ marginBottom: "0.35rem" }}>
                  <h1 style={{
                    display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap",
                    fontSize: "clamp(1.35rem, 3vw, 1.85rem)",
                    fontFamily: "var(--font-fraunces), serif",
                    fontWeight: 700, letterSpacing: "-0.02em",
                    color: "var(--ink)", margin: 0, lineHeight: 1.15,
                  }}>
                    {profile.display_name}
                    {isPatron && (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "4px",
                        background: "#fae4e1", color: "#c6452c",
                        border: "1px solid #f5bcb5",
                        fontSize: "11px", fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: "9999px",
                        letterSpacing: "0.04em",
                        fontFamily: "var(--font-inter), 'Inter', sans-serif",
                        verticalAlign: "middle",
                      }}>
                        👑 PRO
                      </span>
                    )}
                    {isLit && (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "4px",
                        background: "#f3eeff", color: "#6b3fa0",
                        border: "1px solid #d9c8f5",
                        fontSize: "11px", fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: "9999px",
                        letterSpacing: "0.04em",
                        fontFamily: "var(--font-inter), 'Inter', sans-serif",
                        verticalAlign: "middle",
                      }}>
                        📖 LIT
                      </span>
                    )}
                  </h1>
                </div>

                {/* Handle · location · occupation */}
                <p style={{
                  fontSize: "0.82rem",
                  color: "var(--mute, #7a6f5c)", margin: "0 0 0.85rem",
                  display: "flex", flexWrap: "wrap", gap: "0.35rem", alignItems: "center",
                  fontFamily: "var(--font-inter), 'Inter', sans-serif",
                }}>
                  <span style={{ color: "var(--ochre, #7a241c)", fontWeight: 600 }}>@{profile.username}</span>
                  {locationParts.length > 0 && (
                    <><span style={{ opacity: 0.4 }}>•</span><span>{locationParts.join(", ")}</span></>
                  )}
                  {profile.occupation && (
                    <><span style={{ opacity: 0.4 }}>•</span><span>{profile.occupation}</span></>
                  )}
                </p>

                {/* Reputation tier pill (non-member only) */}
                {profile.reputation_tier !== "member" && (
                  <div style={{ marginBottom: "0.75rem" }}>
                    <span style={{
                      display: "inline-block",
                      background: "var(--ink, #14110d)", color: "var(--paper, #f3ece0)",
                      fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em",
                      textTransform: "uppercase", padding: "0.2rem 0.6rem",
                      borderRadius: "var(--radius-full, 9999px)",
                      fontFamily: "var(--font-inter), 'Inter', sans-serif",
                    }}>
                      {repLabel}
                    </span>
                  </div>
                )}

                {/* Badge shelf */}
                <BadgeShelf badges={profile.badges} />

                {/* Bio */}
                {profile.bio && (
                  <p style={{
                    fontFamily: "var(--font-fraunces), serif",
                    fontSize: "0.875rem", fontStyle: "italic",
                    color: "var(--ink-soft, #3a342b)", lineHeight: 1.6,
                    margin: "0 0 1rem",
                    background: "rgba(42,36,28,0.04)",
                    border: "1px solid var(--rule, #e8e2d8)",
                    borderRadius: "var(--radius-lg, 6px)",
                    padding: "0.75rem 1rem",
                  }}>
                    {profile.bio}
                  </p>
                )}

                {/* Stats row */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "0.5rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid var(--rule, #e8e2d8)",
                }}>
                  {[
                    { label: "Points", value: profile.reputation.toLocaleString() },
                    { label: "Posts", value: profile.post_count.toString() },
                    { label: "Followers", value: profile.followers_count.toString() },
                    { label: "Joined", value: formatJoined(profile.joined) },
                  ].map(stat => (
                    <div key={stat.label} style={{
                      background: "rgba(42,36,28,0.03)",
                      borderRadius: "var(--radius-lg, 6px)",
                      border: "1px solid var(--rule, #e8e2d8)",
                      padding: "0.65rem 0.5rem",
                      textAlign: "center",
                    }}>
                      <p style={{
                        margin: "0 0 0.2rem",
                        fontSize: "0.55rem", fontWeight: 700,
                        letterSpacing: "0.12em", textTransform: "uppercase",
                        color: "var(--mute, #7a6f5c)",
                        fontFamily: "var(--font-inter), 'Inter', sans-serif",
                      }}>
                        {stat.label}
                      </p>
                      <p style={{
                        margin: 0, fontSize: "1rem", fontWeight: 800,
                        color: "var(--ink)", lineHeight: 1.1,
                        fontFamily: "var(--font-inter), 'Inter', sans-serif",
                      }}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            {/* Tabbed content */}
            <div style={{ margin: "0 1.25rem" }}>
              <ProfileTabs profile={{
                id: profile.id,
                username: profile.username,
                display_name: profile.display_name,
                avatar_url: profile.avatar_url,
                tier: profile.tier,
                reputation: profile.reputation,
                reputation_tier: profile.reputation_tier,
              }} />
            </div>

          </div>
        </main>

        {/* Right rail */}
        <aside className="pulse-sidebar-right">
          <div style={{ padding: "1.25rem 1rem" }}>
            <div style={{
              background: "var(--paper, #fff)",
              border: "1px solid var(--rule, #e8e2d8)",
              borderRadius: "var(--radius-xl, 12px)",
              padding: "1rem 1.25rem",
              marginBottom: "1rem",
            }}>
              <p style={{
                color: "#7a6f5c", fontSize: "0.6rem", fontWeight: 700,
                letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 0.65rem",
              }}>
                Profile
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                  <span style={{ color: "#7a6f5c" }}>Reputation</span>
                  <strong style={{ color: "#14110d" }}>{profile.reputation.toLocaleString()} pts</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                  <span style={{ color: "#7a6f5c" }}>Posts</span>
                  <strong style={{ color: "#14110d" }}>{profile.post_count}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                  <span style={{ color: "#7a6f5c" }}>Followers</span>
                  <strong style={{ color: "#14110d" }}>{profile.followers_count}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                  <span style={{ color: "#7a6f5c" }}>Tier</span>
                  <strong style={{ color: "#14110d" }}>{repLabel}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                  <span style={{ color: "#7a6f5c" }}>Joined</span>
                  <strong style={{ color: "#14110d" }}>{formatJoined(profile.joined)}</strong>
                </div>
              </div>
            </div>

            <p style={{ margin: "1rem 0 0", fontSize: "0.68rem", color: "#7a6f5c", lineHeight: 1.7 }}>
              © {new Date().getFullYear()} The Moveee. All Rights Reserved.
              <br />
              <Link href="/terms" style={{ color: "#7a6f5c" }}>Terms</Link>
              {" · "}
              <Link href="/privacy" style={{ color: "#7a6f5c" }}>Privacy</Link>
              {" · "}
              <Link href="/contact" style={{ color: "#7a6f5c" }}>Contact</Link>
            </p>
          </div>
        </aside>

      </div>
    </div>
  );
}
