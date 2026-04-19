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
      <style>{`
        /* ─── Auth pages mobile responsiveness ─────────────────────
           Login/Register share a 2-column layout (pitch art + form).
           On phones we hide the art and stack to single column with
           reduced padding so the form fills the viewport. */
        @media (max-width: 760px) {
          [data-auth-shell] {
            padding: 14px !important;
            min-height: 100vh !important;
          }
          [data-auth-grid] {
            grid-template-columns: 1fr !important;
            min-height: auto !important;
            gap: 0 !important;
          }
          [data-auth-art] {
            display: none !important;
          }
          .auth-card {
            padding: 22px !important;
          }
          .auth-card form {
            max-width: 100% !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </ToastProvider>
  );
}
