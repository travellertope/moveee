import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import MemberNavSelect from "@/components/MemberNavSelect";
import EventsClient from "./EventsClient";
import "../../member.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "My Events | The Moveee" },
};

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

async function fetchOrganiserEvents(userId: number) {
  try {
    const res = await fetch(
      `${WP_URL}/wp-json/culture/v1/community/my-events?user_id=${userId}`,
      { headers: { Authorization: `Bearer ${API_SECRET}` }, cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.events ?? [];
  } catch {
    return [];
  }
}

export default async function MemberEventsPage() {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user) redirect("/login?callbackUrl=/member/events");

  const user = session.user;
  const isPatron = user.tier === "patron";

  if (!isPatron) {
    return (
      <>
        <div className="mem-hero">
          <div className="mem-hero-inner">
            <div className="mem-hero-body">
              <div className="mem-eyebrow">
                <Link href="/member" style={{ color: "inherit", textDecoration: "none" }}>Dashboard</Link>
                {" "}&rsaquo;{" "}My Events
              </div>
              <h1 className="mem-name">My Events</h1>
            </div>
          </div>
        </div>
        <div className="mem-body">
          <section className="mem-card">
            <div className="mem-card-label">Moveee Pro feature</div>
            <p className="mem-card-desc">
              RSVP management for community events is available to Moveee Pro members.
              Upgrade your membership to enable RSVP on your events and view attendee lists.
            </p>
            <Link href="/connect/membership" className="mem-settings-back-link">
              View Moveee Pro →
            </Link>
          </section>
        </div>
      </>
    );
  }

  const events = await fetchOrganiserEvents(Number(user.id));

  return (
    <>
      <div className="mem-hero">
        <div className="mem-hero-inner">
          <div className="mem-hero-body">
            <div className="mem-eyebrow">
              <Link href="/member" style={{ color: "inherit", textDecoration: "none" }}>Dashboard</Link>
              {" "}&rsaquo;{" "}My Events
            </div>
            <h1 className="mem-name">My Events</h1>
            <div className="mem-meta">
              <span className="mem-tier-badge patron">Moveee Pro</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mem-body">
        <div className="mem-settings-back">
          <Link href="/member" className="mem-settings-back-link">← Back to Dashboard</Link>
        </div>

        <div className="mem-settings-grid">
          <div className="mem-col-main">
            <EventsClient events={events} />
          </div>

          <div className="mem-col-side">
            <MemberNavSelect items={[
              { label: "Dashboard", href: "/member" },
              { label: "Settings",  href: "/member/settings" },
            ]} />

            <section className="mem-card">
              <div className="mem-card-label">About RSVP</div>
              <div style={{ fontSize: "0.78rem", color: "var(--mute)", lineHeight: 1.6 }}>
                <p style={{ margin: "0 0 8px" }}>
                  Enable RSVP when you create an event in the Moveee app to track free,
                  capacity-limited signups.
                </p>
                <p style={{ margin: 0 }}>
                  Only the organiser can view the attendee list for their own events.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
