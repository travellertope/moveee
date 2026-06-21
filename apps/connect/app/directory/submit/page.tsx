import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWPData, GET_DIRECTORY_TYPES } from "@/lib/wp";
import "../../directory.css";
import DirectorySubmitForm from "./DirectorySubmitForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "Submit a Directory Entry · The Moveee" },
  description: "Add a person, place, movement, or cultural institution to the Moveee Culture Directory. Help build the definitive reference of global culture.",
};

export default async function DirectorySubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ improve?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const u = session?.user as any;

  const { improve } = await searchParams;

  // Fetch entry types from WordPress so any type added in WP Admin
  // (Culture Directory → Entry Types) is available in the form immediately.
  const typesData = await getWPData(GET_DIRECTORY_TYPES, {}).catch(() => null);
  const wpTypes: Array<{ slug: string; name: string }> =
    typesData?.cultureDirectoryTypes?.nodes ?? [];

  const entryTypes = wpTypes.length
    ? wpTypes.map((t: any) => ({ slug: t.slug, label: t.name }))
    : undefined; // undefined → form uses its own fallback

  return (
    <DirectorySubmitForm
      isLoggedIn={!!u}
      userTier={(u?.tier as string) ?? null}
      improvingSlug={improve ?? null}
      entryTypes={entryTypes}
    />
  );
}
