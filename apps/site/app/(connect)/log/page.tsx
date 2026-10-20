import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUnifiedFeed } from "@/lib/unified-feed";
import type { FeedItem } from "@/lib/unified-feed";
import type { Metadata } from "next";
import LogHomeClient from "./LogHomeClient";
import "./reading-log.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Your Log | Moveee" },
  description: "Log books, films, music, food and places. Track what you're into, what you've done, and what people you follow are logging.",
};

export default async function LogPage() {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) redirect("/login?callbackUrl=/log");

  const user = session.user;
  const displayName = user.displayName || user.name || user.username || "Member";
  const initial = displayName.charAt(0).toUpperCase();

  // Feed preview fetched server-side — no client API route needed
  let feedPreview: FeedItem[] = [];
  try {
    const items = await getUnifiedFeed();
    feedPreview = items.slice(0, 3);
  } catch {}

  return (
    <div className="rl-page">
      <div className="rl-inner">
        <LogHomeClient
          displayName={displayName}
          initial={initial}
          avatarUrl={user.avatarUrl ?? null}
          feedPreview={feedPreview}
        />
      </div>
    </div>
  );
}
