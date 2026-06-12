import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import MemberDirectory from "@/components/connect/MemberDirectory";
import Link from "next/link";
import "../../sections.css";
import "../connect.css";

export const metadata: Metadata = {
  title: "Member Directory — Moveee Connect",
  description:
    "Find Black and diaspora creatives, entrepreneurs, professionals, and culture lovers in the Moveee Connect member directory.",
};

export default async function PeoplePage() {
  const session = await getServerSession(authOptions);
  const loggedIn = !!session;

  return (
    <div>
      <section className="mco-hero">
        <div className="mco-hero-inner">
          <div className="mco-hero-text">
            <p className="mco-eyebrow">Moveee Connect · The Directory</p>
            <h1 className="mco-headline">
              Find each <em>other.</em>
            </h1>
            <p className="mco-lede">
              A searchable index of Moveee Connect members — who they are, what they do, and where
              they're based. The Lagos photographer. The UK art director. The Nigerian lawyer in New York.
            </p>
          </div>
          <div className="mco-hero-cta">
            {loggedIn ? (
              <Link href="/member/settings" className="con-btn-primary">Update your profile →</Link>
            ) : (
              <Link href="/register" className="con-btn-primary">Join &amp; get listed →</Link>
            )}
            <Link href="/connect" className="con-btn-ghost">← Back to Connect</Link>
          </div>
        </div>
        <nav className="mco-section-nav" aria-label="Connect sections">
          <Link href="/connect" className="mco-nav-link">Pulse Feed</Link>
          <span className="mco-nav-link mco-nav-link--active">The Directory</span>
          <Link href="/connect/membership" className="mco-nav-link">Membership</Link>
        </nav>
      </section>

      <section className="mco-directory-section" style={{ borderTop: "none" }}>
        <MemberDirectory />
      </section>
    </div>
  );
}
