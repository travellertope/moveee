import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

// Retired — this used to be a dedicated page built on SubmitPost.tsx (a
// second, independent implementation of the whole composer form, now
// deleted). The composer is modal-first everywhere else on the site
// (TopBar/BottomNav/PulseFeed all open ComposerModal in place), so any
// surviving link to /post/new — a bookmark, a stale share, a deep link —
// now redirects into /feed with ?compose=1 instead, which PulseFeed.tsx
// reads to auto-open the real composer modal. The old ?template= value is
// mapped onto ComposerModal's tab; the old draft-continuation and
// "save a line" prefill features (SubmitPost-only, both already covered
// elsewhere — SaveLineButton.tsx opens ComposerModal with initialQuote
// directly) are not reconstructed here.

const TEMPLATE_TO_TAB: Record<string, string> = {
  post: "update",
  "hidden-gem": "review",
  "food-review": "review",
  "book-review": "review",
  "music-review": "review",
  "film-review": "review",
  project: "art",
  quote: "quote",
  poll: "poll",
  itinerary: "itinerary",
  event: "event",
};

interface PageProps {
  searchParams: Promise<{ template?: string }>;
}

export default async function PostNewPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user) redirect("/login?callbackUrl=/feed");

  const { template } = await searchParams;
  const tab = (template && TEMPLATE_TO_TAB[template]) || "update";

  redirect(`/feed?compose=1&tab=${tab}`);
}
