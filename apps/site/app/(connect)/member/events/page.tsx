import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import EventsClient from "./EventsClient";
import "../../../connect-member.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "My Events | Moveee" },
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
      <div className="acct-page">
        <div className="acct-wrap">
          <div className="evt-upsell">
            <span className="evt-upsell-badge">Moveee Pro</span>
            <h3 className="evt-upsell-title">RSVP management is a Moveee Pro feature</h3>
            <p className="evt-upsell-desc">
              RSVP management for community events is available to Moveee Pro members.
              Upgrade your membership to enable RSVP on your events and view attendee lists.
            </p>
            <Link href="/connect/membership" className="evt-upsell-btn">Become a Moveee Pro →</Link>
          </div>
        </div>
      </div>
    );
  }

  const events = await fetchOrganiserEvents(Number(user.id));

  return (
    <div className="acct-page">
      <div className="acct-wrap">
        <EventsClient events={events} />

        <div className="acct-card">
          <div className="acct-card-header"><span className="acct-card-title">About RSVP</span></div>
          <p className="acct-card-desc" style={{ marginTop: 0 }}>
            Enable RSVP when you create an event in the Moveee app to track free,
            capacity-limited signups. Only the organiser can view the attendee list
            for their own events.
          </p>
        </div>
      </div>
    </div>
  );
}
