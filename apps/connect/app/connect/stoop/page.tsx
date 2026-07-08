import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stoop from "@/components/connect/Stoop";
import Link from "next/link";
import "../../sections.css";
import "../../feed/feed.css";

export const metadata: Metadata = {
  title: "Stoop — Moveee",
  description: "Weekly, area-level gatherings of Moveee members near you.",
};

export default async function StoopPage() {
  const session = await getServerSession(authOptions);
  const loggedIn = !!session;
  const viewerCity = (session?.user as any)?.city ?? "";
  const viewerCountry = (session?.user as any)?.countryOfResidence ?? "";

  return (
    <div>
      <section className="mco-hero">
        <div className="mco-hero-inner">
          <div className="mco-hero-text">
            <p className="mco-eyebrow">Moveee · Stoop</p>
            <h1 className="mco-headline">
              Culture, <em>close to home.</em>
            </h1>
            <p className="mco-lede">
              Weekly, area-level gatherings of Moveee members near you.
            </p>
          </div>
          <div className="mco-hero-cta">
            {loggedIn ? (
              <Link href="/hub" className="con-btn-ghost">Browse Hubs →</Link>
            ) : (
              <Link href="/login?callbackUrl=/connect/stoop" className="con-btn-primary">Log in →</Link>
            )}
            <Link href="/feed" className="con-btn-ghost">← Back to Feed</Link>
          </div>
        </div>
      </section>

      {loggedIn ? (
        <Stoop viewerCity={viewerCity} viewerCountry={viewerCountry} />
      ) : (
        <section className="mco-directory-section" style={{ borderTop: "none" }}>
          <p style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--mute)" }}>
            Log in to find or start a Stoop near you.
          </p>
        </section>
      )}
    </div>
  );
}
