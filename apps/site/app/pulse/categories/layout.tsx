import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Categories — Moveee Pulse",
  description: "Explore culture across music, film, fashion, and more — all through a global lens.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
