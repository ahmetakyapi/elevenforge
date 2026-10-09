"use client";

/**
 * Animates the content area between screens.
 *
 * Keyed on the pathname, so a navigation unmounts one `<ViewTransition>` and
 * mounts another: the old screen blurs out upward and the new one rises in
 * (`.page` in globals.css). Everything that is NOT a route change — a server
 * action refreshing data, a filter in a `useTransition`, the dashboard's
 * auto-refresh — keeps the same key and `default="none"`, so it never
 * triggers a full-page animation.
 */
import { usePathname } from "next/navigation";
import { ViewTransition, type ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <ViewTransition key={pathname} enter="page" exit="page" default="none">
      {children}
    </ViewTransition>
  );
}
