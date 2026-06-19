import DiscoverBrowser from "@/components/DiscoverBrowser";
import "../discover.css";

export const metadata = {
  title: { absolute: "Discover | Moveee" },
  description: "Browse the Moveee Culture Directory — people, places, food, books, film, and more.",
};

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; region?: string }>;
}) {
  const { type, region } = await searchParams;

  return (
    <div className="disc-wrap">
      <DiscoverBrowser initialType={type ?? null} initialRegion={region ?? null} />
    </div>
  );
}
