import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ReadingTrackerClient from "./ReadingTrackerClient";
import "../../../connect-member.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "Culture Log | Moveee" },
};

export default async function ReadingTrackerPage() {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) redirect("/login?callbackUrl=/member/reading");

  const user = session.user;

  return (
    <div className="acct-page">
      <div className="acct-wrap">
        <div className="acct-page-head">
          <p className="acct-page-eyebrow">Books</p>
          <h2 className="acct-page-title">Culture Log</h2>
          <p className="acct-page-sub">A private log of the books, films, music, food and places you want to get to, what you&apos;re on now, and everything you&apos;ve already done.</p>
        </div>

        <ReadingTrackerClient />
      </div>
    </div>
  );
}
