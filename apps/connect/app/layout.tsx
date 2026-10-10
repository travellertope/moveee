import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./member.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { ThemeProvider } from "@/context/ThemeContext";
import SessionProvider from "@/components/SessionProvider";
import ConnectHeader from "@/components/Header";
import TopBar from "@/components/TopBar";
import GlobalAuthModal from "@/components/GlobalAuthModal";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
  description: "Discover events, creative people, and cultural experiences. A community open to everyone.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Moveee",
    startupImage: [
      { url: "/icons/apple-touch-icon.png" },
    ],
  },
  formatDetection: {
    telephone: false,
  },
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
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#f3ece0" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#14110d" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className={inter.variable}>
        <SessionProvider>
          <CurrencyProvider initialPricing={null}>
            <LanguageProvider>
              <ThemeProvider>
                <TopBar />
                <div className="cw-shell">
                  <ConnectHeader />
                  <div className="cw-shell-content">
                    <main>{children}</main>
                  </div>
                </div>
                <GlobalAuthModal />
                <PWAInstallPrompt />
              </ThemeProvider>
            </LanguageProvider>
          </CurrencyProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
