import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ReadingStatsClient from "./ReadingStatsClient";
import "../../../../connect-member.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "Your Year in Culture | Moveee" },
};

// Reading Tracker stats dashboard — Phase 4, see
// docs/reading-tracker-plan.md §2/§4. Not registered in AccountNav (it's a
// sub-page of Reading Tracker, same "linked from the parent page, not a
// top-level account destination" relationship Analytics quick-links have to
// the Member Dashboard) — reached via the "Your Year in Culture →" link on
// /member/reading itself.
export default async function ReadingStatsPage() {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) redirect("/login?callbackUrl=/member/reading/stats");

  const user = session.user;

  return (
    <div className="acct-page">
      <div className="acct-wrap">
        <div className="acct-page-head">
          <p className="acct-page-eyebrow">Books</p>
          <h2 className="acct-page-title">Your Year in Culture</h2>
          <p className="acct-page-sub">
            <Link href="/member/reading" className="rt-stats-back">← Back to your Culture Log</Link>
          </p>
        </div>

        <ReadingStatsClient />
      </div>
    </div>
  );
}
