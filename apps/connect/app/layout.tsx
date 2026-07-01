import type { Metadata } from "next";
import { DM_Sans, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./member.css";
import "./footer.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { ThemeProvider } from "@/context/ThemeContext";
import SessionProvider from "@/components/SessionProvider";
import ConnectHeader from "@/components/Header";
import Footer from "@/components/Footer";
import AppDownloadBanner from "@/components/AppDownloadBanner";
import AppDownloadModal from "@/components/AppDownloadModal";
import GlobalAuthModal from "@/components/GlobalAuthModal";
import "@/components/app-download-nudge.css";

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
  metadataBase: new URL("https://web.themoveee.com"),
  verification: {
    google: "-PWVNI7d4eBu_a-Qo35KOTlAknn2MiciJ4c_ycsiqdc",
  },
  title: {
    default: "Moveee — Connect to Culture",
    template: "%s | Moveee",
  },
  description: "Discover events, creative people, and cultural experiences. The Moveee community — open to everyone.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://web.themoveee.com",
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
    site: "@moveeeapp",
    creator: "@moveeeapp",
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
      <head>
        {/* Set data-theme before paint to avoid a light/dark flash on load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("moveee-theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${dmSans.variable} ${fraunces.variable} ${jetBrainsMono.variable}`}>
        <SessionProvider>
          <CurrencyProvider initialPricing={null}>
            <LanguageProvider>
              <ThemeProvider>
                <AppDownloadBanner />
                <ConnectHeader />
                <main>{children}</main>
                <Footer />
                <AppDownloadModal />
                <GlobalAuthModal />
              </ThemeProvider>
            </LanguageProvider>
          </CurrencyProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
