import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";

// Retired — hub-scoped mirror of /post/new's own retirement. See that
// page for the full reasoning. Keeps the hub lookup/auth/membership
// checks the old page did (still meaningful — a non-member shouldn't be
// bounced into a Hub's composer), but redirects into the Hub's own feed
// with ?compose=1 instead of rendering a dedicated page.

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

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

interface Hub {
  id: number;
  slug: string;
  status: string;
}

async function fetchHub(slug: string): Promise<Hub | null> {
  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/hub/slug/${slug}`, {
      headers: { Authorization: `Bearer ${API_SECRET}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchIsMember(hubId: number, userId: number): Promise<boolean> {
  try {
    const res = await fetch(
      `${WP_URL}/wp-json/culture/v1/hub/${hubId}/status?user_id=${userId}`,
      { headers: { Authorization: `Bearer ${API_SECRET}` }, cache: "no-store" }
    );
    if (!res.ok) return false;
    const data = await res.json();
    return !!data?.isMember;
  } catch {
    return false;
  }
}

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ template?: string }>;
}

export default async function HubPostNewPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) redirect(`/login?callbackUrl=/hub/${slug}`);

  const hub = await fetchHub(slug);
  if (!hub) notFound();
  if (hub.status === "archived") redirect(`/hub/${slug}`);

  const isMember = await fetchIsMember(hub.id, Number(session.user.id));
  if (!isMember) redirect(`/hub/${slug}`);

  const { template } = await searchParams;
  const tab = (template && TEMPLATE_TO_TAB[template]) || "update";

  redirect(`/hub/${slug}?compose=1&tab=${tab}`);
}
