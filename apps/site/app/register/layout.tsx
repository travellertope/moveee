import { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Join The Moveee" },
  description: "Create your Moveee account — free membership for culture lovers, or Connect Pro for full access to the archive, events, and community.",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
