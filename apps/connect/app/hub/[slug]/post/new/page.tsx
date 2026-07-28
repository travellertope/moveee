import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import HubPostNewClient from "./HubPostNewClient";
import "@/app/post/new/post-new.css";

export const dynamic = "force-dynamic";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

export const metadata = {
  title: { absolute: "New Hub Post | Moveee" },
};

interface Hub {
  id: number;
  slug: string;
  name: string;
  status: string;
  allowedTemplates: string[];
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

export default async function HubPostNewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) redirect(`/login?callbackUrl=/hub/${slug}/post/new`);

  const hub = await fetchHub(slug);
  if (!hub) notFound();
  if (hub.status === "archived") redirect(`/hub/${slug}`);

  const isMember = await fetchIsMember(hub.id, Number(session.user.id));
  if (!isMember) redirect(`/hub/${slug}`);

  return (
    <div className="post-new-wrap">
      <HubPostNewClient hubId={hub.id} hubSlug={hub.slug} allowedTemplates={hub.allowedTemplates} />
    </div>
  );
}
