import {
  ArrowLeftRight,
  Home,
  ListOrdered,
  MessageSquare,
  Newspaper,
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
  /**
   * 1 = the daily loop, always in the bar. 2 = moves into the "···" menu on
   * narrower desktops (see `.topnav-tier-2` in app/globals.css).
   */
  tier: 1 | 2;
};

/*
 * The bar did not fit.
 *
 * Nine labelled links with icons need 812px; at 1440px the row had 782px and
 * the last link ran 14px under the right-hand cluster, at 1366px 88px, at
 * 1280px 174px and at 1024px 430px — "Crew" and "Gazete" sat underneath the
 * theme button, unclickable. The nav is `nowrap` with `min-width: 0`, so it
 * never pushed back; it just overflowed its own box.
 *
 * Steps instead of one cramped compromise: below 1500px the icons go (the
 * words already say where you are going), below 1280px the notification
 * button drops its label, and below 1180px the tier-2 links move into the
 * "···" menu, which lists them at those widths only. Measured after: no
 * overlap anywhere from 900px (where the desktop bar starts) to 1920px.
 */
export const NAV_MAIN: NavItem[] = [
  { href: "/dashboard", label: "Ana",      Icon: Home,           tier: 1 },
  { href: "/squad",     label: "Kadro",    Icon: Users,          tier: 1 },
  { href: "/transfer",  label: "Transfer", Icon: ArrowLeftRight, tier: 1 },
  { href: "/tactic",    label: "Taktik",   Icon: Target,         tier: 1 },
  { href: "/match",     label: "Maç",      Icon: Play,           tier: 1 },
  { href: "/cup",       label: "Kupa",     Icon: Trophy,         tier: 2 },
  { href: "/standings", label: "Tablo",    Icon: ListOrdered,    tier: 2 },
  { href: "/newspaper", label: "Gazete",   Icon: Newspaper,      tier: 2 },
  { href: "/crew",      label: "Sohbet",   Icon: MessageSquare,  tier: 2 },
];

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

