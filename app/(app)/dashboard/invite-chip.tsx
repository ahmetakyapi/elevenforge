"use client";

import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";

export function InviteChip({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="chip"
      title="Davet kodunu kopyala ve arkadaşına yolla"
      style={{
        fontFamily: "var(--font-jetbrains)",
        fontWeight: 700,
        background: copied
          ? "color-mix(in oklab, var(--emerald) 18%, var(--panel-2))"
          : "color-mix(in oklab, var(--accent) 12%, var(--panel-2))",
        borderColor: copied
          ? "color-mix(in oklab, var(--emerald) 40%, var(--border))"
          : "color-mix(in oklab, var(--accent) 30%, var(--border))",
        color: copied ? "var(--emerald)" : "var(--accent)",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
      }}
    >
      {copied ? (
        <Check size={12} strokeWidth={2} />
      ) : (
        <Link2 size={12} strokeWidth={1.8} />
      )}
      <span>{code}</span>
      {copied ? (
        <span style={{ fontWeight: 600 }}>Kopyalandı</span>
      ) : (
        <Copy size={12} strokeWidth={1.6} style={{ opacity: 0.8 }} />
      )}
    </button>
  );
}
