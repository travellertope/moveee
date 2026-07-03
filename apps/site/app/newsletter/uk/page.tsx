import EditionNewsletterHub from "@/components/EditionNewsletterHub";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: "Newsletters — UK Edition · Moveee Magazine" },
  description:
    "Culture Drop and GetMeLit — the Moveee newsletter programme, UK edition. Weekly cultural commentary across London, Manchester, and Edinburgh.",
  alternates: { canonical: "https://themoveee.com/newsletter/uk" },
  openGraph: {
    title: "Newsletters — UK Edition · Moveee Magazine",
    description:
      "Culture Drop and GetMeLit — the Moveee newsletter programme, UK edition.",
    url: "https://themoveee.com/newsletter/uk",
    siteName: "Moveee Magazine",
    type: "website",
    images: [{ url: "/og-fallback.png", width: 1200, height: 630, alt: "Moveee Magazine Newsletters" }],
  },
};

export default function NewsletterUkPage() {
  return <EditionNewsletterHub edition="uk" />;
}
