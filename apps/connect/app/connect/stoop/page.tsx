import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import StoopBrowser from "@/components/connect/StoopBrowser";
import Link from "next/link";
import "../../stoop.css";

export const metadata: Metadata = {
  title: "Stoop — Moveee",
  description: "Small, weekly gatherings of Moveee members in your own area.",
};

export default async function StoopPage() {
  const session = await getServerSession(authOptions);
  const loggedIn = !!session;
  const viewerCity = (session?.user as any)?.city ?? "";
  const viewerCountry = (session?.user as any)?.countryOfResidence ?? "";

  return (
    <div className="stoop-page-bg">
      <div className="stoop-wrap">
        <div className="stoop-header">
          <div className="stoop-header-text">
            <h1 className="stoop-title">Culture, <em>close to home.</em></h1>
            <p className="stoop-lede">
              Small, weekly gatherings of Moveee members in your own area — no ticket, no big crowd,
              just your neighbours in culture.
            </p>
          </div>
        </div>

        {loggedIn ? (
          <StoopBrowser viewerCity={viewerCity} viewerCountry={viewerCountry} />
        ) : (
          <div className="stoop-empty">
            <span className="stoop-empty-icon" aria-hidden="true">🚪</span>
            <h4>Log in to find or start a Stoop near you.</h4>
            <p>Stoop is open to every Moveee member — sign in to see who's meeting near you.</p>
            <Link href="/login?callbackUrl=/connect/stoop" className="stoop-start-btn">Log in →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
