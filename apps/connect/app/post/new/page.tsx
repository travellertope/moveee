import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PostNewClient from "./PostNewClient";
import "./post-new.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "New Post | Moveee" },
};

export default async function PostNewPage() {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user) redirect("/login?callbackUrl=/post/new");

  return (
    <div className="post-new-wrap">
      <PostNewClient />
    </div>
  );
}
