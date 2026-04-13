import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import "../../directory.css";
import DirectorySubmitForm from "./DirectorySubmitForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Submit a Directory Entry · The Moveee",
};

export default async function DirectorySubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ improve?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const u = session?.user as any;

  const { improve } = await searchParams;

  return (
    <DirectorySubmitForm
      isLoggedIn={!!u}
      userTier={(u?.tier as string) ?? null}
      improvingSlug={improve ?? null}
    />
  );
}
