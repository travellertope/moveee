import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ServicesRootPage() {
  const h = await headers();
  const country = h.get("x-vercel-ip-country") ?? "";
  if (country === "NG") redirect("/services/africa");
  if (country === "GB") redirect("/services/uk");
  redirect("/services/us");
}
