"use client";

import { Mic } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import {
  answerPressConference,
  getOrCreatePressConference,
} from "./press-actions";
import { promptByCode } from "@/lib/press-conferences";

type PressRow = {
  id: string;
  promptCode: string;
  answerCode: string | null;
};

/**
 * Compact press conference card. Lazily fetches the current week's prompt
 * on mount; once answered it shows a thank-you state with the chosen
 * morale/prestige deltas.
 */
export function PressWidget() {
  const [row, setRow] = useState<PressRow | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    getOrCreatePressConference().then((res) => {
      if (cancelled || !res.ok) return;
      setRow({
        id: res.row.id,
        promptCode: res.row.promptCode,
        answerCode: res.row.answerCode,
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const prompt = row ? promptByCode(row.promptCode) : null;
  if (!row || !prompt) return null;

  const answer = (code: string) => {
    startTransition(async () => {
      const res = await answerPressConference({ pressId: row.id, answerCode: code });
      if (!res.ok) {
        toast({
          icon: "⚠",
          title: "Cevaplanamadı",
          body: res.error,
          accent: "var(--danger)",
        });
        return;
      }
      setRow({ ...row, answerCode: code });
      const parts: string[] = [];
      if (res.moraleDelta !== 0) parts.push(`Moral ${res.moraleDelta > 0 ? "+" : ""}${res.moraleDelta}`);
      if (res.prestigeDelta !== 0) parts.push(`Prestij ${res.prestigeDelta > 0 ? "+" : ""}${res.prestigeDelta}`);
      toast({
        icon: "🎙",
        title: "Basın açıklaması yapıldı",
        body: parts.length > 0 ? parts.join(" · ") : "Etkisiz açıklama.",
        accent: "var(--cyan)",
      });
      router.refresh();
    });
  };

  const answered = !!row.answerCode;
  const chosenAnswer = answered ? prompt.answers.find((a) => a.code === row.answerCode) : null;

  return (
    <div
      style={{
        padding: "16px 18px",
        borderRadius: 12,
        background: "color-mix(in oklab, var(--cyan) 10%, var(--panel))",
        border: "1px solid color-mix(in oklab, var(--cyan) 24%, var(--border))",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Mic size={16} strokeWidth={1.6} style={{ color: "var(--cyan)" }} />
        <span className="t-label" style={{ color: "var(--cyan)" }}>
          BASIN TOPLANTISI
        </span>
        {answered && (
          <span
            style={{
              fontSize: 10,
              padding: "1px 6px",
              borderRadius: 3,
              background: "color-mix(in oklab, var(--emerald) 28%, transparent)",
              color: "var(--emerald)",
              fontWeight: 700,
              marginLeft: "auto",
            }}
          >
            CEVAPLANDI
          </span>
        )}
      </div>
      <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.5 }}>
        {prompt.question}
      </div>
      {answered && chosenAnswer ? (
        <div
          style={{
            marginTop: 12,
            padding: "10px 12px",
            borderRadius: 8,
            background: "color-mix(in oklab, var(--panel-2) 60%, transparent)",
            fontSize: 13,
          }}
        >
          <div style={{ fontWeight: 600 }}>&ldquo;{chosenAnswer.text}&rdquo;</div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
            {chosenAnswer.description}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
          {prompt.answers.map((a) => (
            <button
              key={a.code}
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={pending}
              onClick={() => answer(a.code)}
              style={{
                justifyContent: "flex-start",
                textAlign: "left",
                padding: "10px 12px",
                fontSize: 13,
                fontWeight: 500,
                whiteSpace: "normal",
                lineHeight: 1.4,
              }}
            >
              {a.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
