import type { ReactNode } from "react";
import { TopNav } from "@/components/layout/top-nav";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { ToastProvider } from "@/components/ui/toast";
import { TweaksPanel } from "@/components/tweaks/tweaks-panel";
import { FooterCredit } from "@/components/layout/footer-credit";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <div className="app-bg" aria-hidden />
      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
        <TopNav />
        {children}
        <FooterCredit />
        <MobileBottomNav />
        <TweaksPanel />
      </div>
    </ToastProvider>
  );
}
