import { getWPData, GET_DIRECTORY_TYPES } from "@/lib/wp";
import "../../directory.css";
import DirectorySubmitForm from "./DirectorySubmitForm";

export const revalidate = 3600;

export const metadata = {
  title: { absolute: "Submit a Directory Entry · Moveee Magazine" },
  description: "Add a person, place, movement, or cultural institution to the Moveee Culture Directory.",
  robots: { index: false, follow: false },
};

export default async function DirectorySubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ improve?: string }>;
}) {
  const { improve } = await searchParams;

  const typesData = await getWPData(GET_DIRECTORY_TYPES, {}).catch(() => null);
  const wpTypes: Array<{ slug: string; name: string }> =
    typesData?.cultureDirectoryTypes?.nodes ?? [];

  const entryTypes = wpTypes.length
    ? wpTypes.map((t: any) => ({ slug: t.slug, label: t.name }))
    : undefined;

  // isLoggedIn / userTier resolved client-side inside DirectorySubmitForm via useSession()
  return (
    <DirectorySubmitForm
      isLoggedIn={false}
      userTier={null}
      improvingSlug={improve ?? null}
      entryTypes={entryTypes}
    />
  );
}
