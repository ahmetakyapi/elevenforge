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

  const apply = (next: Theme) => {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
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

  const isLight = theme === "light";
  const label = isLight ? "Koyu temaya geç" : "Açık temaya geç";

  return (
    <button
      type="button"
      onClick={() => apply(isLight ? "dark" : "light")}
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
