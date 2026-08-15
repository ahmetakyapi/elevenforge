"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  Bell,
  MoreHorizontal,
  Settings,
  User2,
  UserPlus,
  Users2,
  Wallet,
  type LucideIcon,
} from "lucide-react";

type Item = { href: string; label: string; hint: string; Icon: LucideIcon };

/**
 * Secondary destinations, behind one control.
 *
 * The bar previously carried nine labelled links plus six bare icons plus the
 * notification toggle, league switcher, balance and sign-out — sixteen
 * controls competing in a single row. Past about 1400px it stopped fitting
 * and fell back to a horizontal scrollbar, which is a poor way to reach a
 * primary navigation item: you cannot see what you are scrolling toward.
 *
 * These are real pages but not the daily loop, so they live one click away
 * with names attached instead of being guessable icons.
 */
const ITEMS: Item[] = [
  { href: "/finances", label: "Finans", hint: "Gelir, gider, kasa geçmişi", Icon: Wallet },
  { href: "/crew", label: "Crew", hint: "Sohbet ve etkinlik akışı", Icon: Bell },
  { href: "/stats", label: "İstatistikler", hint: "Gol krallığı, form", Icon: BarChart2 },
  { href: "/free-agents", label: "Serbest Oyuncular", hint: "Sözleşmesi bitenler", Icon: UserPlus },
  { href: "/profile", label: "Menajer Profili", hint: "Kupalar ve geçmiş", Icon: User2 },
  { href: "/lobby", label: "Lig Kur / Katıl", hint: "Davet koduyla katıl", Icon: Users2 },
  { href: "/league-settings", label: "Lig Ayarları", hint: "Maç saati, yetkiler", Icon: Settings },
];

export function NavOverflow() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  // Close on route change by adjusting state during render rather than in an
  // effect — the effect version fires a second render pass every navigation.
  // See "You Might Not Need an Effect" in the React docs.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Outside click and Escape genuinely need listeners.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const activeInMenu = ITEMS.some(
    (i) => pathname === i.href || pathname.startsWith(`${i.href}/`),
  );

  return (
    <div ref={ref} style={{ position: "relative" }} className="desktop-only">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn btn-ghost btn-sm"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Diğer sayfalar"
        style={{
          color: activeInMenu ? "var(--accent)" : undefined,
          background: activeInMenu
            ? "color-mix(in oklab, var(--accent) 14%, transparent)"
            : undefined,
        }}
      >
        <MoreHorizontal size={15} strokeWidth={1.7} />
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            minWidth: 246,
            padding: 6,
            borderRadius: 14,
            border: "1px solid var(--border-strong)",
            background: "var(--bg-2)",
            boxShadow: "0 24px 60px -18px rgba(0,0,0,0.65)",
            zIndex: 120,
            animation: "slide-up 160ms var(--ease) both",
          }}
        >
          {ITEMS.map(({ href, label, hint, Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                role="menuitem"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "9px 10px",
                  borderRadius: 10,
                  textDecoration: "none",
                  color: active ? "var(--accent)" : "var(--text)",
                  background: active
                    ? "color-mix(in oklab, var(--accent) 12%, transparent)"
                    : "transparent",
                }}
              >
                <Icon size={15} strokeWidth={1.7} style={{ flexShrink: 0 }} />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 600 }}>
                    {label}
                  </span>
                  <span
                    className="t-caption"
                    style={{ display: "block", fontSize: 10.5, marginTop: 1 }}
                  >
                    {hint}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
