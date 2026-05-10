import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchHomepageData } from "@/lib/fetchHomepageData";
import HomepageContent from "@/components/HomepageContent";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user;
  const data = await fetchHomepageData(); // global edition — no tag filter

  return <HomepageContent {...data} isLoggedIn={isLoggedIn} edition="global" />;
}
