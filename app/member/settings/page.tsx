import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import NewsletterPreferences from "./NewsletterPreferences";
import "../../member.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Newsletter Preferences · The Moveee",
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
      {/* ── PROFILE HERO ── */}
      <div className="mem-hero">
        <div className="mem-hero-inner">
          <div className="mem-avatar">{initial}</div>
          <div className="mem-hero-body">
            <div className="mem-eyebrow">The Moveee &mdash; Newsletter Preferences</div>
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
          <div className="mem-col-main">
            <NewsletterPreferences email={email} />
          </div>

          <div className="mem-col-side">
            {/* Quick links */}
            <section className="mem-card mem-links-card">
              <Link href="/member" className="mem-link">
                Dashboard →
              </Link>
              <Link href="/newsletter" className="mem-link">
                The Cultural Digest →
              </Link>
              <Link href="/events" className="mem-link">
                Upcoming Events →
              </Link>
              <Link
                href="/api/auth/signout"
                className="mem-link mem-link--muted"
              >
                Sign out
              </Link>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
