"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type Toast = {
  id: string;
  icon?: ReactNode;
  title?: string;
  body?: string;
  accent?: string;
  duration?: number;
};

type ToastInput = Omit<Toast, "id">;

type ToastContextValue = (t: ToastInput) => void;

const ToastCtx = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback<ToastContextValue>((t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, ...t }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, t.duration ?? 4000);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column-reverse",
          gap: 10,
          pointerEvents: "none",
          maxWidth: 360,
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="glass anim-slide-in-right"
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              pointerEvents: "auto",
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              minWidth: 280,
              background: "color-mix(in oklab, var(--bg) 90%, var(--panel) 10%)",
              borderColor: t.accent
                ? `color-mix(in oklab, ${t.accent} 40%, var(--border))`
                : "var(--border)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            {t.icon && <span style={{ fontSize: 18, lineHeight: 1.2 }}>{t.icon}</span>}
            <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
              {t.title && (
                <span className="t-h3" style={{ fontSize: 14 }}>
                  {t.title}
                </span>
              )}
              {t.body && <span className="t-small">{t.body}</span>}
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
};
