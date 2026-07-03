import EditionNewsletterHub from "@/components/EditionNewsletterHub";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: "Newsletters — Africa Edition · Moveee Magazine" },
  description:
    "Culture Drop and GetMeLit — the Moveee newsletter programme, Africa edition. Weekly cultural commentary across Lagos, Accra, Nairobi, Johannesburg, and Cape Town.",
  alternates: { canonical: "https://themoveee.com/newsletter/africa" },
  openGraph: {
    title: "Newsletters — Africa Edition · Moveee Magazine",
    description:
      "Culture Drop and GetMeLit — the Moveee newsletter programme, Africa edition.",
    url: "https://themoveee.com/newsletter/africa",
    siteName: "Moveee Magazine",
    type: "website",
    images: [{ url: "/og-fallback.png", width: 1200, height: 630, alt: "Moveee Magazine Newsletters" }],
  },
};

export default function NewsletterAfricaPage() {
  return <EditionNewsletterHub edition="africa" />;
}
