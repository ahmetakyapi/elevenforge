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
      {/* A column, so the footer sits at the bottom of the window on short
          pages (an empty match or newspaper screen) instead of floating
          mid-screen with the background showing underneath it. */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <TopNav
          owned={ctx?.ownedLeagues ?? []}
          currentLeagueId={ctx?.league.id ?? null}
          currentLeagueName={ctx?.league.name ?? null}
          balanceCents={ctx?.club.balanceCents ?? null}
          clubCrest={
            ctx
              ? {
                  clubId: ctx.club.id,
                  color: ctx.club.color,
                  color2: ctx.club.color2,
                  short: ctx.club.shortName,
                }
              : null
          }
        />
        <main data-page-enter style={{ flex: "1 0 auto" }}>
          {children}
        </main>
        <FooterCredit />
        <MobileBottomNav />
        <TweaksPanel />
      </div>
    </ToastProvider>
  );
}
