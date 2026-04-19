"use client";

import { Moon, Settings, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "dark" | "light";
type AccentKey = "indigo" | "emerald" | "cyan" | "gold" | "rose";

const ACCENTS: Record<AccentKey, { main: string; alt: string; label: string }> = {
  indigo: { main: "#6366f1", alt: "#10b981", label: "İndigo" },
  emerald: { main: "#10b981", alt: "#6366f1", label: "Emerald" },
  cyan: { main: "#22d3ee", alt: "#6366f1", label: "Cyan" },
  gold: { main: "#facc15", alt: "#6366f1", label: "Gold" },
  rose: { main: "#f43f5e", alt: "#6366f1", label: "Rose" },
};

const STORAGE_KEY = "ef.tweaks";

type StoredTweaks = { theme?: Theme; accent?: AccentKey };

function readInitial(): Required<StoredTweaks> {
  if (typeof window === "undefined") {
    return { theme: "dark", accent: "indigo" };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { theme: "dark", accent: "indigo" };
    const parsed = JSON.parse(raw) as StoredTweaks;
    return {
      theme: parsed.theme ?? "dark",
      accent: parsed.accent ?? "indigo",
    };
  } catch {
    return { theme: "dark", accent: "indigo" };
  }
}

export function TweaksPanel() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [accent, setAccent] = useState<AccentKey>("indigo");
  const [mounted, setMounted] = useState(false);

  // Read from localStorage only after mount (avoid hydration mismatch)
  useEffect(() => {
    const init = readInitial();
    setTheme(init.theme);
    setAccent(init.accent);
    setMounted(true);
  }, []);

  // Apply to document + persist
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", theme);
    const a = ACCENTS[accent];
    document.documentElement.style.setProperty("--accent", a.main);
    document.documentElement.style.setProperty("--accent-2", a.alt);
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ theme, accent }),
      );
    } catch {}
  }, [theme, accent, mounted]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Tema ayarları"
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 900,
          width: 40,
          height: 40,
          borderRadius: 20,
          background: "color-mix(in oklab, var(--bg) 85%, transparent)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid var(--border)",
          color: "var(--muted)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all var(--t) var(--ease)",
        }}
      >
        <Settings size={16} strokeWidth={1.8} />
      </button>

      {open && (
        <div
          className="glass"
          style={{
            position: "fixed",
            bottom: 70,
            right: 20,
            zIndex: 901,
            width: 280,
            padding: 16,
            borderRadius: 14,
            background: "var(--bg-2)",
            boxShadow: "var(--shadow-lg)",
            border: "1px solid var(--border-strong)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <div>
              <span className="t-label" style={{ color: "var(--accent)" }}>
                TWEAKS
              </span>
              <div className="t-h3" style={{ marginTop: 2 }}>
                Görünüm
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setOpen(false)}
            >
              <X size={14} strokeWidth={1.6} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <span className="t-label">AKSAN RENGİ</span>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: 6,
                  marginTop: 8,
                }}
              >
                {(Object.entries(ACCENTS) as Array<[AccentKey, typeof ACCENTS[AccentKey]]>).map(
                  ([k, v]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setAccent(k)}
                      aria-label={v.label}
                      style={{
                        height: 36,
                        borderRadius: 8,
                        cursor: "pointer",
                        background: `linear-gradient(135deg, ${v.main}, ${v.alt})`,
                        border:
                          accent === k
                            ? "2px solid var(--text)"
                            : "2px solid transparent",
                        transition: "border-color var(--t) var(--ease)",
                      }}
                    />
                  ),
                )}
              </div>
            </div>
            <div>
              <span className="t-label">TEMA</span>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 6,
                  marginTop: 8,
                }}
              >
                <button
                  type="button"
                  className={`chip ${theme === "dark" ? "active" : ""}`}
                  onClick={() => setTheme("dark")}
                  style={{
                    cursor: "pointer",
                    justifyContent: "center",
                    padding: "8px",
                  }}
                >
                  <Moon size={13} strokeWidth={1.8} /> Karanlık
                </button>
                <button
                  type="button"
                  className={`chip ${theme === "light" ? "active" : ""}`}
                  onClick={() => setTheme("light")}
                  style={{
                    cursor: "pointer",
                    justifyContent: "center",
                    padding: "8px",
                  }}
                >
                  <Sun size={13} strokeWidth={1.8} /> Aydınlık
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
