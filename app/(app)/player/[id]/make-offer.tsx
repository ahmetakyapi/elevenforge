"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Handshake } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { sendTransferOffer } from "@/app/(app)/transfer/offer-actions";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Bid for a player who is not on the transfer list.
 *
 * This is the flow the game was missing entirely: previously the only way to
 * sign anybody was to wait for their club to list them, so every squad in the
 * league was effectively untouchable.
 */
export default function MakeOffer({
  playerId,
  playerName,
  marketValueEur,
}: {
  playerId: string;
  playerName: string;
  marketValueEur: number;
}) {
  const suggested = Math.max(1, Math.round((marketValueEur * 1.2) / 1_000_000));
  const [open, setOpen] = useState(false);
  const [amountM, setAmountM] = useState(String(suggested));
  const [pending, startTransition] = useTransition();
  const pushToast = useToast();

  const minM = Math.max(1, Math.round((marketValueEur * 0.5) / 1_000_000));

  function submit() {
    const amountEur = Number(amountM) * 1_000_000;
    if (!Number.isFinite(amountEur) || amountEur <= 0) {
      pushToast({ title: "Geçersiz tutar", accent: "#ef4444" });
      return;
    }
    startTransition(async () => {
      const res = await sendTransferOffer({ playerId, amountEur });
      if (res.ok) {
        pushToast({
          title: "Teklif gönderildi",
          body: `${playerName} için ${amountM}M € teklif ettin.`,
          accent: "#10b981",
        });
        setOpen(false);
      } else {
        pushToast({ title: "Teklif reddedildi", body: res.error, accent: "#ef4444" });
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-500/90 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
      >
        <Handshake size={15} /> Teklif Yap
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: EASE }}
      className="rounded-xl border border-indigo-400/25 bg-indigo-500/[0.06] p-3"
    >
      <p className="mb-2 text-xs text-white/60">
        {playerName} için kulübüne teklif götür. En az{" "}
        <strong className="text-white/85">{minM}M €</strong> olmalı.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="number"
          min={minM}
          value={amountM}
          onChange={(e) => setAmountM(e.target.value)}
          className="w-28 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 font-mono text-sm text-white/90 outline-none focus:border-indigo-400/40"
        />
        <span className="text-[11px] text-white/40">milyon €</span>
        <button
          type="button"
          disabled={pending}
          onClick={submit}
          className="rounded-lg bg-indigo-500/90 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-50"
        >
          Gönder
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/60 transition hover:bg-white/10"
        >
          Vazgeç
        </button>
      </div>
    </motion.div>
  );
}
