import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import CreateHubClient from "./CreateHubClient";
import "../../member.css";

export const metadata = { title: "Start a Hub · Moveee" };

export default async function CreateHubPage() {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) redirect("/login?callbackUrl=/hub/create");

  return <CreateHubClient />;
}
