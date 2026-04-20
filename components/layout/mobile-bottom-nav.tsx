"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  Home,
  Play,
  Target,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
};

const ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Ana",      Icon: Home },
  { href: "/squad",     label: "Kadro",    Icon: Users },
  { href: "/transfer",  label: "Transfer", Icon: ArrowLeftRight },
  { href: "/tactic",    label: "Taktik",   Icon: Target },
  { href: "/cup",       label: "Kupa",     Icon: Trophy },
  { href: "/match",     label: "Maç",      Icon: Play },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="mobile-only"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "grid",
        gridTemplateColumns: "repeat(6, 1fr)",
        background: "color-mix(in oklab, var(--bg) 90%, transparent)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border)",
        padding: "8px 4px calc(10px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {ITEMS.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "6px 0",
              textDecoration: "none",
              color: active ? "var(--accent)" : "var(--muted)",
              fontFamily: "var(--font-manrope)",
              fontWeight: 600,
              fontSize: 10,
              transition: "color var(--t) var(--ease)",
            }}
          >
            <Icon size={18} strokeWidth={1.6} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
