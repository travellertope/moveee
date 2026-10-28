import { Suspense } from "react";
import { ThemeProvider } from "@/context/ThemeContext";
import ConnectHeader from "@/components/ConnectHeader";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import GlobalAuthModal from "@/components/GlobalAuthModal";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import PullToRefresh from "@/components/PullToRefresh";
import NavigationLoader from "@/components/NavigationLoader";
import QuoteShareProvider from "@/components/QuoteShareProvider";
import RightSidebar from "./RightSidebar";
import "../connect-globals.css";
import "../connect-member.css";

export default function ConnectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <QuoteShareProvider>
        <TopBar />
        <div className="cw-shell">
          <ConnectHeader />
          <div className="cw-shell-content">
            <main>{children}</main>
          </div>
          <Suspense fallback={null}>
            <RightSidebar />
          </Suspense>
        </div>
        <BottomNav />
        <GlobalAuthModal />
        <PwaInstallPrompt />
        <PullToRefresh />
        <NavigationLoader />
      </QuoteShareProvider>
    </ThemeProvider>
  );
}
