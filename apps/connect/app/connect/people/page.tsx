import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import MemberDirectory from "@/components/connect/MemberDirectory";
import Link from "next/link";
import "@/app/people.css";

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
    <div className="ppl-page-bg">
      <div className="ppl-wrap">
        <div className="ppl-header">
          <div className="ppl-header-text">
            <h1 className="ppl-title">People Near Me</h1>
            <p className="ppl-lede">
              Members of the Moveee community near you — who they are, what they do.
            </p>
          </div>
          <Link href={loggedIn ? "/member/settings" : "/register"} className="ppl-header-cta">
            {loggedIn ? "Update your profile →" : "Join & get listed →"}
          </Link>
        </div>

        <MemberDirectory viewerCity={viewerCity} viewerCountry={viewerCountry} />
      </div>
    </div>
  );
}
