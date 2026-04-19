"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  BarChart2,
  Bell,
  Home,
  ListOrdered,
  MessageSquare,
  Menu,
  Newspaper,
  Play,
  Settings,
  Target,
  Trophy,
  User2,
  Users,
  UserPlus,
  X,
  type LucideIcon,
} from "lucide-react";

type Item = { href: string; label: string; Icon: LucideIcon };

const ITEMS: Item[] = [
  { href: "/dashboard", label: "Ana", Icon: Home },
  { href: "/squad", label: "Kadro", Icon: Users },
  { href: "/transfer", label: "Transfer", Icon: ArrowLeftRight },
  { href: "/free-agents", label: "Serbest", Icon: UserPlus },
  { href: "/tactic", label: "Taktik", Icon: Target },
  { href: "/match", label: "Maç", Icon: Play },
  { href: "/cup", label: "Kupa", Icon: Trophy },
  { href: "/standings", label: "Puan Durumu", Icon: ListOrdered },
  { href: "/stats", label: "İstatistik", Icon: BarChart2 },
  { href: "/newspaper", label: "Gazete", Icon: Newspaper },
  { href: "/crew", label: "Crew", Icon: MessageSquare },
  { href: "/profile", label: "Profil", Icon: User2 },
  { href: "/league-settings", label: "Ayarlar", Icon: Settings },
];

/**
 * Mobile-only hamburger drawer. Mounts a button on phones, a slide-in
 * sheet on press. Auto-closes when route changes so users land on the
 * new page rather than staring at the menu.
 */
export function MobileDrawer() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="mobile-only btn btn-ghost btn-sm"
        onClick={() => setOpen(true)}
        aria-label="Menüyü aç"
        style={{ padding: "6px 8px" }}
      >
        <Menu size={18} strokeWidth={1.6} />
      </button>
      {open && (
        <div
          className="mobile-only"
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.6)",
            backdropFilter: "blur(4px)",
            zIndex: 200,
          }}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "min(86vw, 320px)",
              background: "var(--panel)",
              borderLeft: "1px solid var(--border)",
              padding: "20px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              animation: "drawer-in 220ms var(--ease, ease-out)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <span className="t-label">MENÜ</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setOpen(false)}
                aria-label="Kapat"
                style={{ padding: "4px 8px" }}
              >
                <X size={14} strokeWidth={1.6} />
              </button>
            </div>
            {ITEMS.map(({ href, label, Icon }) => {
              const active =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 8,
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: 600,
                    color: active ? "var(--text)" : "var(--muted)",
                    background: active
                      ? "color-mix(in oklab, var(--accent) 14%, transparent)"
                      : "transparent",
                    border: active
                      ? "1px solid color-mix(in oklab, var(--accent) 30%, var(--border))"
                      : "1px solid transparent",
                  }}
                >
                  <Icon size={16} strokeWidth={1.6} />
                  {label}
                </Link>
              );
            })}
            <div style={{ flex: 1 }} />
            <div
              style={{
                fontSize: 11,
                color: "var(--muted)",
                textAlign: "center",
                paddingTop: 12,
                borderTop: "1px solid var(--border)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Bell size={11} strokeWidth={1.6} />
              <span>ElevenForge</span>
            </div>
          </aside>
          <style>{`
            @keyframes drawer-in {
              from { transform: translateX(100%); }
              to   { transform: translateX(0); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
