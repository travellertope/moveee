import type { Metadata } from "next";
import { DM_Sans, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./member.css";
import "./footer.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import SessionProvider from "@/components/SessionProvider";
import ConnectHeader from "@/components/Header";
import Footer from "@/components/Footer";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://connect.themoveee.com"),
  title: {
    default: "Moveee — Connect to Culture",
    template: "%s | Moveee",
  },
  description: "Discover events, creative people, and cultural experiences. The Moveee community — open to everyone.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://connect.themoveee.com",
    siteName: "Moveee",
    images: [
      {
        url: "https://themoveee.com/og-fallback.png",
        width: 1200,
        height: 630,
        alt: "Moveee — Connect to Culture",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@themoveee",
    creator: "@themoveee",
    title: "Moveee — Connect to Culture",
    description: "Discover events, creative people, and cultural experiences. The Moveee community — open to everyone.",
    images: ["https://themoveee.com/og-fallback.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${dmSans.variable} ${fraunces.variable} ${jetBrainsMono.variable}`}>
        <SessionProvider>
          <CurrencyProvider initialPricing={null}>
            <LanguageProvider>
              <ConnectHeader />
              <main>{children}</main>
              <Footer />
            </LanguageProvider>
          </CurrencyProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
