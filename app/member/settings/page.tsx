import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import NewsletterPreferences from "./NewsletterPreferences";
import ProfileEditor from "./ProfileEditor";
import ChapterSelector from "@/components/ChapterSelector";
import "../../member.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Settings · The Moveee",
};

export default async function MemberSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/member/settings");

  const user = session.user as any;
  const email = user.email as string;
  const displayName = user.displayName || user.name || user.username || "Member";
  const initial = displayName.charAt(0).toUpperCase();
  const isPatron = user.tier === "patron";

  return (
    <>
      {/* ── HERO ── */}
      <div className="mem-hero">
        <div className="mem-hero-inner">
          <div className="mem-avatar">{initial}</div>
          <div className="mem-hero-body">
            <div className="mem-eyebrow">The Moveee &mdash; Account Settings</div>
            <h1 className="mem-name">{displayName}</h1>
            <div className="mem-meta">
              <span className={`mem-tier-badge ${isPatron ? "patron" : "citizen"}`}>
                {isPatron ? "Patron" : "Citizen"}
              </span>
              <span className="mem-sep">·</span>
              <span>{email}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mem-body">
        <div className="mem-settings-back">
          <Link href="/member" className="mem-settings-back-link">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="mem-settings-grid">
          {/* ── MAIN COLUMN ── */}
          <div className="mem-col-main">

            {/* ── 1. PROFILE ── */}
            <section className="mem-card">
              <div className="mem-card-label">Profile</div>
              <ProfileEditor user={{
                displayName,
                email,
                username: user.username ?? "",
                phone: user.phone ?? "",
                whatsapp: user.whatsapp ?? "",
                gender: user.gender ?? "",
                dateOfBirth: user.dateOfBirth ?? "",
                nationality: user.nationality ?? "",
                countryOfResidence: user.countryOfResidence ?? "",
                city: user.city ?? "",
                occupation: user.occupation ?? "",
              }} />
            </section>

            {/* ── 2. NOTIFICATIONS ── */}
            <section className="mem-card">
              <div className="mem-card-label">Newsletter Subscriptions</div>
              <NewsletterPreferences email={email} />
            </section>

            {/* ── 3. SECURITY ── */}
            <section className="mem-card">
              <div className="mem-card-label">Security</div>
              <div className="mem-field-list">
                <div className="mem-field mem-field--action">
                  <div>
                    <div className="mem-field-label">Password</div>
                    <div className="mem-field-value mem-field-value--muted">
                      Change your password via email reset
                    </div>
                  </div>
                  <Link
                    href={`/forgot-password?email=${encodeURIComponent(email)}`}
                    className="mem-field-btn"
                  >
                    Change →
                  </Link>
                </div>
              </div>
            </section>

            {/* ── 4. CHAPTER ── */}
            <section className="mem-card">
              <div className="mem-card-label">Chapter</div>
              <ChapterSelector
                currentPrimaryId={user.primaryChapter?.id ?? 0}
                currentPrimaryName={user.primaryChapter?.name ?? ""}
                currentSecondaryId={user.secondaryChapter?.id ?? 0}
                currentSecondaryName={user.secondaryChapter?.name ?? ""}
                isPatron={isPatron}
              />
            </section>

            {/* ── 5. DANGER ZONE ── */}
            <section className="mem-card mem-card--rule">
              <div className="mem-card-label" style={{ color: "var(--mute)" }}>Account</div>
              <div className="mem-field-list">
                <div className="mem-field mem-field--action">
                  <div>
                    <div className="mem-field-label">Sign out</div>
                    <div className="mem-field-value mem-field-value--muted">
                      Sign out of your account on this device
                    </div>
                  </div>
                  <Link href="/api/auth/signout" className="mem-field-btn mem-field-btn--muted">
                    Sign out →
                  </Link>
                </div>
              </div>
            </section>

          </div>

          {/* ── SIDE COLUMN ── */}
          <div className="mem-col-side">
            <section className="mem-card mem-links-card">
              <Link href="/member" className="mem-link">Dashboard →</Link>
              <Link href="/member/collection" className="mem-link">My Collection →</Link>
              <Link href="/newsletter" className="mem-link">The Cultural Digest →</Link>
              <Link href="/events" className="mem-link">Upcoming Events →</Link>
              <Link href="/magazine" className="mem-link">Magazine →</Link>
              <Link href="/api/auth/signout" className="mem-link mem-link--muted">Sign out</Link>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
