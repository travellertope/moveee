import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import MemberDirectory from "@/components/connect/MemberDirectory";
import HouseFellowship from "@/components/connect/HouseFellowship";
import Link from "next/link";
import "../../sections.css";
import "../../feed/feed.css";

export const metadata: Metadata = {
  title: "People Near Me — Moveee",
  description:
    "Discover creatives, entrepreneurs, professionals, and culture lovers near you in the Moveee community.",
};

export default async function PeoplePage() {
  const session = await getServerSession(authOptions);
  const loggedIn = !!session;
  const viewerCity = (session?.user as any)?.city ?? "";
  const viewerCountry = (session?.user as any)?.countryOfResidence ?? "";

  return (
    <div>
      <section className="mco-hero">
        <div className="mco-hero-inner">
          <div className="mco-hero-text">
            <p className="mco-eyebrow">Moveee · People Near Me</p>
            <h1 className="mco-headline">
              Find each <em>other.</em>
            </h1>
            <p className="mco-lede">
              Members of the Moveee community near you — who they are, what they do. Filter by
              industry to find your people.
            </p>
          </div>
          <div className="mco-hero-cta">
            {loggedIn ? (
              <Link href="/member/settings" className="con-btn-primary">Update your profile →</Link>
            ) : (
              <Link href="/register" className="con-btn-primary">Join &amp; get listed →</Link>
            )}
            <Link href="/feed" className="con-btn-ghost">← Back to Feed</Link>
          </div>
        </div>
        <nav className="mco-section-nav" aria-label="Connect sections">
          <Link href="/feed" className="mco-nav-link">Pulse Feed</Link>
          <span className="mco-nav-link mco-nav-link--active">People Near Me</span>
          <Link href="/connect/membership" className="mco-nav-link">Membership</Link>
        </nav>
      </section>

      {loggedIn && (
        <HouseFellowship viewerCity={viewerCity} viewerCountry={viewerCountry} />
      )}

      <section className="mco-directory-section" style={{ borderTop: "none" }}>
        <MemberDirectory viewerCity={viewerCity} viewerCountry={viewerCountry} />
      </section>
    </div>
  );
}
