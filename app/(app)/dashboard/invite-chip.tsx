"use client";

import { useState } from "react";
import { Check, Copy, Link2, X } from "lucide-react";
import { copyText } from "@/lib/clipboard";

export function InviteChip({ code }: { code: string }) {
  // "idle" | "ok" | "fail". Three states, not a boolean: the button used to
  // report success unconditionally, so a refused copy still said "Kopyalandı"
  // and the user pasted nothing.
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");
  const handleCopy = async () => {
    setState((await copyText(code)) ? "ok" : "fail");
    window.setTimeout(() => setState("idle"), 2200);
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
        background:
          state === "ok"
            ? "color-mix(in oklab, var(--emerald) 18%, var(--panel-2))"
            : state === "fail"
              ? "color-mix(in oklab, var(--warn) 18%, var(--panel-2))"
              : "color-mix(in oklab, var(--accent) 12%, var(--panel-2))",
        borderColor:
          state === "ok"
            ? "color-mix(in oklab, var(--emerald) 40%, var(--border))"
            : state === "fail"
              ? "color-mix(in oklab, var(--warn) 45%, var(--border))"
              : "color-mix(in oklab, var(--accent) 30%, var(--border))",
        color:
          state === "ok"
            ? "var(--emerald)"
            : state === "fail"
              ? "var(--warn)"
              : "var(--accent)",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
      }}
    >
      {state === "ok" ? (
        <Check size={12} strokeWidth={2} />
      ) : state === "fail" ? (
        <X size={12} strokeWidth={2} />
      ) : (
        <Link2 size={12} strokeWidth={1.8} />
      )}
      <span>{code}</span>
      {state === "ok" ? (
        <span style={{ fontWeight: 600 }}>Kopyalandı</span>
      ) : state === "fail" ? (
        <span style={{ fontWeight: 600 }}>Kopyalanamadı — elle seç</span>
      ) : (
        <Copy size={12} strokeWidth={1.6} style={{ opacity: 0.8 }} />
      )}
    </button>
  );
}
