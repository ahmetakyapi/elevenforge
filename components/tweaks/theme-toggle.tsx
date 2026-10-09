"use client";

/**
 * The light/dark switch, where people look for it.
 *
 * The theme already existed but the only way to reach it was a 40px unlabelled
 * gear pinned to the bottom-right corner, which is where a debug panel lives,
 * not a preference anyone is expected to find. This puts the choice in the two
 * places a visitor actually looks: the app's top bar and the landing header.
 *
 * It reads and writes the SAME localStorage key as the tweaks panel
 * (`ef.tweaks`) and stamps the same `data-theme` attribute, so the two controls
 * are two views of one setting rather than two settings that disagree. The
 * shape is `{ theme, accent }`; accent is preserved on write so toggling the
 * theme does not silently reset someone's accent colour.
 */
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "ef.tweaks";
type Theme = "dark" | "light";

function readTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return "dark";
    const parsed = JSON.parse(raw) as { theme?: Theme };
    return parsed.theme === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  // Server and first client render must agree, so the real value is only read
  // after mount — the usual next-themes hydration guard, applied by hand
  // because this app stamps the attribute itself.
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(readTheme());
    setMounted(true);
  }, []);

  const commit = (next: Theme) => {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    // The tweaks panel keeps its own copy of the theme; without this it
    // wrote the stale value back the next time the accent was changed.
    window.dispatchEvent(new CustomEvent("ef:theme", { detail: next }));
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...parsed, theme: next }),
      );
    } catch {
      /* storage blocked — the attribute is still applied for this session */
    }
  };

  /*
   * The new theme spreads out from the button as a circle — like floodlights
   * switching on (or off) from the corner of the stadium. Uses a manual View
   * Transition: the browser snapshots the old page, we flip the attribute,
   * and the new snapshot is revealed through an expanding clip-path.
   */
  const apply = (next: Theme, origin?: { x: number; y: number }) => {
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> };
    };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!doc.startViewTransition || reduce || !origin) {
      commit(next);
      return;
    }
    const root = document.documentElement;
    const r = Math.hypot(
      Math.max(origin.x, innerWidth - origin.x),
      Math.max(origin.y, innerHeight - origin.y),
    );
    root.setAttribute("data-theme-vt", "");
    const vt = doc.startViewTransition(() => {
      flushSync(() => commit(next));
    });
    vt.ready
      .then(() => {
        root.animate(
          {
            clipPath: [
              `circle(0px at ${origin.x}px ${origin.y}px)`,
              `circle(${r}px at ${origin.x}px ${origin.y}px)`,
            ],
          },
          {
            duration: 760,
            easing: "cubic-bezier(0.76, 0, 0.24, 1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      })
      .catch(() => {});
    vt.finished.finally(() => root.removeAttribute("data-theme-vt"));
  };

  const isLight = theme === "light";
  const label = isLight ? "Koyu temaya geç" : "Açık temaya geç";

  return (
    <button
      type="button"
      onClick={(e) => {
        const b = e.currentTarget.getBoundingClientRect();
        apply(isLight ? "dark" : "light", { x: b.left + b.width / 2, y: b.top + b.height / 2 });
      }}
      title={label}
      aria-label={label}
      // Before mount the value is a guess, so the icon is held back rather
      // than flashing the wrong one.
      aria-pressed={mounted ? isLight : undefined}
      style={{
        width: compact ? 34 : 36,
        height: compact ? 34 : 36,
        borderRadius: 10,
        border: "1px solid var(--border)",
        background: "var(--panel)",
        color: "var(--muted)",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "color var(--t) var(--ease), background var(--t) var(--ease)",
        opacity: mounted ? 1 : 0,
      }}
    >
      {isLight ? (
        <Moon size={16} strokeWidth={1.8} />
      ) : (
        <Sun size={16} strokeWidth={1.8} />
      )}
    </button>
  );
}
