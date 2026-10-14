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
      pushToast({ title: "Geçersiz tutar", accent: "var(--danger)" });
      return;
    }
    startTransition(async () => {
      const res = await sendTransferOffer({ playerId, amountEur });
      if (res.ok) {
        pushToast({
          title: "Teklif gönderildi",
          body: `${playerName} için ${amountM}M € teklif ettin.`,
          accent: "var(--emerald)",
        });
        setOpen(false);
      } else {
        pushToast({ title: "Teklif reddedildi", body: res.error, accent: "var(--danger)" });
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-primary"
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
      className="rounded-xl border border-accent/30 bg-accent/5 p-3"
    >
      <p className="mb-2 text-[13px] text-text-2">
        {playerName} için kulübüne teklif götür. En az{" "}
        <strong className="text-text">{minM}M €</strong> olmalı.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="number"
          min={minM}
          value={amountM}
          onChange={(e) => setAmountM(e.target.value)}
          aria-label="Teklif, milyon euro"
          className="input t-mono"
          style={{ width: 112, padding: "7px 10px" }}
        />
        <span className="text-[12px] text-muted">milyon €</span>
        <button
          type="button"
          disabled={pending}
          onClick={submit}
          className="btn btn-sm btn-primary"
        >
          Gönder
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn btn-sm"
        >
          Vazgeç
        </button>
      </div>
    </motion.div>
  );
}
