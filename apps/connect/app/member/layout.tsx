import type { Metadata } from "next";

// All /member/* pages are session-gated — must never be indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
