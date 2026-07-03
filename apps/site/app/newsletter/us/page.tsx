import EditionNewsletterHub from "@/components/EditionNewsletterHub";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: "Newsletters — US Edition · Moveee Magazine" },
  description:
    "Culture Drop and GetMeLit — the Moveee newsletter programme, US edition. Weekly cultural commentary across New York, Atlanta, and Los Angeles.",
  alternates: { canonical: "https://themoveee.com/newsletter/us" },
  openGraph: {
    title: "Newsletters — US Edition · Moveee Magazine",
    description:
      "Culture Drop and GetMeLit — the Moveee newsletter programme, US edition.",
    url: "https://themoveee.com/newsletter/us",
    siteName: "Moveee Magazine",
    type: "website",
    images: [{ url: "/og-fallback.png", width: 1200, height: 630, alt: "Moveee Magazine Newsletters" }],
  },
};

export default function NewsletterUsPage() {
  return <EditionNewsletterHub edition="us" />;
}
