import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import "../../directory.css";
import DirectorySubmitForm from "./DirectorySubmitForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Submit a Directory Entry · The Moveee",
};

export default async function DirectorySubmitPage() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user;
  return <DirectorySubmitForm isLoggedIn={isLoggedIn} />;
}
