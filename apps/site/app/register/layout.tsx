import { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Join Moveee" },
  description: "Create your Moveee account — free membership for culture lovers, or Moveee Pro for full access to the archive, events, and community.",
  robots: { index: false, follow: false },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
