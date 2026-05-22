import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | The Moveee",
  description: "Sign in to your Moveee account to access your saved articles, member benefits, and community.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
