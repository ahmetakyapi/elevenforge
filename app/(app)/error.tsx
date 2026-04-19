"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Route-segment error boundary for /(app). When a server component throws
 * (e.g. missing env, schema mismatch, stale cache) we render this card
 * instead of the bare Next default — so the user can still navigate.
 *
 * The reset() call retries the same render; useful when the error was a
 * transient DB blip (Neon cold start).
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.error("[app/error]", error);
    }
  }, [error]);

  return (
    <div
      style={{
        maxWidth: 640,
        margin: "60px auto",
        padding: "32px 28px",
        background: "var(--panel)",
        border: "1px solid color-mix(in oklab, var(--danger) 30%, var(--border))",
        borderRadius: 16,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 8 }}>⚠</div>
      <div className="t-h2" style={{ marginBottom: 8 }}>
        Bir şeyler ters gitti
      </div>
      <div style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
        Sayfa yüklenirken bir hata oluştu. Sorun geçiciyse tekrar denersen
        düzelir; yoksa farklı bir sayfaya geç.
      </div>
      {error.digest && (
        <div
          className="t-mono"
          style={{
            fontSize: 11,
            color: "var(--muted)",
            marginBottom: 20,
            opacity: 0.7,
          }}
        >
          ref: {error.digest}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        <button type="button" className="btn btn-primary btn-sm" onClick={reset}>
          Tekrar Dene
        </button>
        <Link
          href="/dashboard"
          className="btn btn-ghost btn-sm"
          style={{ textDecoration: "none" }}
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
