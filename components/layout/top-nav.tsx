"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  BarChart2,
  Bell,
  Home,
  ListOrdered,
  MessageSquare,
  Newspaper,
  Play,
  Settings,
  Target,
  Trophy,
  User2,
  Users,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { Crest } from "@/components/ui/primitives";
import { LogoLockup } from "@/components/brand/logo";
import { LeagueSwitcher, type OwnedLeague } from "@/app/(app)/league-switcher";
import { PushSubscribeButton } from "@/components/push-subscribe";
import { MobileDrawer } from "./mobile-drawer";

type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
};

const NAV_MAIN: NavItem[] = [
  { href: "/dashboard", label: "Ana",      Icon: Home },
  { href: "/squad",     label: "Kadro",    Icon: Users },
  { href: "/transfer",  label: "Transfer", Icon: ArrowLeftRight },
  { href: "/tactic",    label: "Taktik",   Icon: Target },
  { href: "/match",     label: "Maç",      Icon: Play },
  { href: "/cup",       label: "Kupa",     Icon: Trophy },
  { href: "/standings", label: "Tablo",    Icon: ListOrdered },
  { href: "/newspaper", label: "Gazete",   Icon: Newspaper },
  { href: "/crew",      label: "Crew",     Icon: MessageSquare },
];

export function TopNav({
  owned,
  currentLeagueId,
  currentLeagueName,
  balanceCents,
  clubCrest,
}: {
  owned: OwnedLeague[];
  currentLeagueId: string | null;
  currentLeagueName: string | null;
  balanceCents: number | null;
  clubCrest: { clubId: string; color: string; color2: string; short: string } | null;
}) {
  const pathname = usePathname();
  const current =
    currentLeagueId && currentLeagueName
      ? owned.find((o) => o.leagueId === currentLeagueId) ?? {
          leagueId: currentLeagueId,
          leagueName: currentLeagueName,
          clubId: "",
          clubName: "",
        }
      : null;
  const balanceLabel =
    balanceCents !== null
      ? `€${(balanceCents / 100 / 1_000_000).toFixed(1)}M`
      : "—";

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        background: "color-mix(in oklab, var(--bg) 82%, transparent)",
      }}
    >
      <div
        style={{
          maxWidth: 1600,
          margin: "0 auto",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", textDecoration: "none" }}
        >
          <LogoLockup size={18} icon="anvil" />
        </Link>

        <nav
          className="desktop-only"
          style={{ display: "flex", gap: 2, flex: 1, marginLeft: 20, overflowX: "auto" }}
        >
          {NAV_MAIN.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  borderRadius: 8,
                  fontFamily: "var(--font-manrope)",
                  fontWeight: 600,
                  fontSize: 13.5,
                  textDecoration: "none",
                  background: active
                    ? "color-mix(in oklab, var(--accent) 12%, var(--panel))"
                    : "transparent",
                  color: active ? "var(--text)" : "var(--muted)",
                  border: `1px solid ${
                    active
                      ? "color-mix(in oklab, var(--accent) 30%, var(--border))"
                      : "transparent"
                  }`,
                  transition: "all var(--t) var(--ease)",
                  whiteSpace: "nowrap",
                }}
              >
                <Icon size={14} strokeWidth={1.6} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link
            href="/crew"
            className="btn btn-ghost btn-sm"
            title="Crew · sohbet ve etkinlik akışı"
            style={{ textDecoration: "none" }}
          >
            <Bell size={14} strokeWidth={1.6} />
          </Link>
          <Link
            href="/stats"
            className="btn btn-ghost btn-sm desktop-only"
            style={{ textDecoration: "none" }}
            title="İstatistikler"
          >
            <BarChart2 size={14} strokeWidth={1.6} />
          </Link>
          <Link
            href="/free-agents"
            className="btn btn-ghost btn-sm desktop-only"
            style={{ textDecoration: "none" }}
            title="Serbest oyuncular"
          >
            <UserPlus size={14} strokeWidth={1.6} />
          </Link>
          <Link
            href="/profile"
            className="btn btn-ghost btn-sm desktop-only"
            style={{ textDecoration: "none" }}
            title="Menajer profili"
          >
            <User2 size={14} strokeWidth={1.6} />
          </Link>
          <Link
            href="/league-settings"
            className="btn btn-ghost btn-sm desktop-only"
            style={{ textDecoration: "none" }}
            title="Lig ayarları"
          >
            <Settings size={14} strokeWidth={1.6} />
          </Link>
          <PushSubscribeButton />
          <MobileDrawer />
          <div className="v-divider" style={{ height: 22 }} />
          {clubCrest && (
            <Crest
              clubId={clubCrest.clubId}
              size={28}
              club={{
                color: clubCrest.color,
                color2: clubCrest.color2,
                short: clubCrest.short,
              }}
            />
          )}
          {current && (
            <LeagueSwitcher current={current} owned={owned} />
          )}
          <span
            className="t-mono"
            style={{ fontSize: 13, color: "var(--emerald)" }}
          >
            {balanceLabel}
          </span>
        </div>
      </div>
    </header>
  );
}
