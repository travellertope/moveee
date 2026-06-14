import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import EventCheckinClient from "./EventCheckinClient";

export default async function EventCheckinPage({
  searchParams,
}: {
  searchParams: { id?: string; t?: string };
}) {
  const { id, t } = searchParams;

  if (!id || !t) {
    redirect("/events");
  }

  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/events/checkin?id=${id}&t=${t}`)}`);
  }

  return <EventCheckinClient eventId={id} token={t} />;
}
