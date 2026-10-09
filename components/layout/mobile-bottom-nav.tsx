"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
        viewTransitionName: "bottom-nav",
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
            aria-current={active ? "page" : undefined}
            style={{
              position: "relative",
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
            {active && (
              <motion.span
                layoutId="bottom-nav-pill"
                aria-hidden
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                style={{
                  position: "absolute",
                  top: -9,
                  left: "22%",
                  right: "22%",
                  height: 3,
                  borderRadius: 999,
                  background: "linear-gradient(90deg, var(--accent), var(--accent-2))",
                  boxShadow: "0 0 14px var(--accent)",
                }}
              />
            )}
            <motion.span
              animate={{ y: active ? -2 : 0, scale: active ? 1.12 : 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 26 }}
              style={{ display: "inline-flex" }}
            >
              <Icon size={18} strokeWidth={active ? 2 : 1.6} />
            </motion.span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
