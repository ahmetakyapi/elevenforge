import type { ReactNode } from "react";
import { TopNav } from "@/components/layout/top-nav";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { ToastProvider } from "@/components/ui/toast";
import { TweaksPanel } from "@/components/tweaks/tweaks-panel";
import { FooterCredit } from "@/components/layout/footer-credit";
import { tryLeagueContext } from "@/lib/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const ctx = await tryLeagueContext();
  return (
    <ToastProvider>
      <div className="app-bg" aria-hidden />
      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
        <TopNav
          owned={ctx?.ownedLeagues ?? []}
          currentLeagueId={ctx?.league.id ?? null}
          currentLeagueName={ctx?.league.name ?? null}
          balanceCents={ctx?.club.balanceCents ?? null}
        />
        {children}
        <FooterCredit />
        <MobileBottomNav />
        <TweaksPanel />
      </div>
    </ToastProvider>
  );
}
