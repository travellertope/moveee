import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import CreateClusterClient from "./CreateClusterClient";

export const metadata = { title: "Start a House Fellowship · Moveee" };

export default async function CreateClusterPage() {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) redirect("/login?callbackUrl=/cluster/create");

  return (
    <CreateClusterClient
      viewerCountry={session.user.nationality ?? ""}
    />
  );
}
