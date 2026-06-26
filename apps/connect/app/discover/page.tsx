import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DiscoverBrowser from "@/components/DiscoverBrowser";
import "../discover.css";

export const metadata = {
  title: { absolute: "Discover | Moveee" },
  description: "Browse the Moveee Culture Directory — people, places, food, books, film, and more.",
};

// Mirrors REGION_CITY_KEYWORDS in class-culture-directory.php — keep in sync.
function detectRegion(country: string): string | null {
  const c = country.toLowerCase();
  if (/nigeria/.test(c)) return "nigeria";
  if (/ghana/.test(c)) return "ghana";
  if (/united kingdom|^uk$|britain/.test(c)) return "uk";
  if (/united states|^usa$/.test(c)) return "usa";
  if (/senegal|kenya|south africa|africa/.test(c)) return "pan-african";
  return null;
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; region?: string }>;
}) {
  const { type, region } = await searchParams;
  const session = await getServerSession(authOptions);
  const viewerCountry = (session?.user as any)?.countryOfResidence ?? "";
  const viewerInterests: string[] = (session?.user as any)?.interests ?? [];

  // Auto-scope to the viewer's region on first visit (no ?region= present) —
  // still fully overridable via the existing region filter, just a smarter default.
  const initialRegion = region ?? detectRegion(viewerCountry);

  return (
    <div className="disc-page-bg">
      <div className="disc-wrap">
        <DiscoverBrowser
          initialType={type ?? null}
          initialRegion={initialRegion}
          viewerInterests={viewerInterests}
        />
      </div>
    </div>
  );
}
