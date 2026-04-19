"use client";

import { Zap } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { playNextRound } from "./actions";

export function PlayNextRoundButton() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  return (
    <button
      type="button"
      className="btn btn-primary"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const res = await playNextRound();
          if (res.ok) {
            toast({
              icon: "⚽",
              title: `Hafta ${res.weekNumber} oynandı`,
              body: `${res.simulated} maç · ${res.newspaper ? "gazete yayında" : "gazete yok"}`,
              accent: "var(--emerald)",
            });
            router.refresh();
          } else {
            toast({
              icon: "⚠",
              title: "Olmadı",
              body: res.error,
              accent: "var(--danger)",
            });
          }
        });
      }}
    >
      <Zap size={14} strokeWidth={1.8} />
      {pending ? "Maçlar oynanıyor…" : "Sıradaki Haftayı Oyna"}
    </button>
  );
}
