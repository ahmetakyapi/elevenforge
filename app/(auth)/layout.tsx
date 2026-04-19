import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/toast";
import { TweaksPanel } from "@/components/tweaks/tweaks-panel";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <div className="app-bg" aria-hidden />
      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
        {children}
        <TweaksPanel />
      </div>
    </ToastProvider>
  );
}
