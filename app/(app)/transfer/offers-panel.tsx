"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Handshake, X } from "lucide-react";
import { OvrChip, PosBadge, SectionHead } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import {
  acceptCounterOffer,
  respondToTransferOffer,
  withdrawTransferOffer,
} from "./offer-actions";
import type { OfferView } from "@/lib/queries/offers";
import type { Position } from "@/types";

const EASE = [0.22, 1, 0.36, 1] as const;

/*
 * Tokens, not hex.
 *
 * This file was the odd one out: it carried its own literal palette while the
 * rest of the app styles from CSS variables. That meant the theme could not
 * reach it — "Kabul edildi" stayed at the dark-mode emerald and measured
 * 2.2:1 against a white page — and the accept buttons below used Tailwind's
 * `bg-emerald-500/90 text-black`, which is 1.04:1 in dark mode.
 */
const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  pending: { text: "Bekliyor", color: "var(--warn)" },
  accepted: { text: "Kabul edildi", color: "var(--emerald)" },
  rejected: { text: "Reddedildi", color: "var(--danger)" },
  countered: { text: "Karşı teklif", color: "var(--accent)" },
  withdrawn: { text: "Geri çekildi", color: "var(--muted)" },
  expired: { text: "Süresi doldu", color: "var(--muted)" },
};

function eur(n: number): string {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `€${Math.round(n / 1_000)}K`;
  return `€${n}`;
}

/**
 * Same container as the rest of the transfer page.
 *
 * This panel renders as a sibling of TransferUi, which sets its own
 * `maxWidth`/`padding`. The panel set neither, so "Transfer Teklifleri" was
 * pinned to the viewport edge while every row beneath it was inset — a
 * misalignment on desktop and, on a phone, text touching the glass.
 *
 * The literal string matters: app/globals.css tightens mobile padding by
 * matching serialized inline styles, and "20px 28px" is one of the forms it
 * looks for.
 */
const PANEL_CONTAINER = {
  maxWidth: 1400,
  margin: "0 auto",
  padding: "20px 28px",
} as const;

export default function OffersPanel({ offers }: { offers: OfferView[] }) {
  const [pending, startTransition] = useTransition();
  const [counterFor, setCounterFor] = useState<string | null>(null);
  const [counterValue, setCounterValue] = useState("");
  const pushToast = useToast();

  const incoming = offers.filter(
    (o) => o.direction === "in" && o.status === "pending",
  );
  const outgoing = offers.filter(
    (o) => o.direction === "out" && (o.status === "pending" || o.status === "countered"),
  );
  const settled = offers.filter(
    (o) => !["pending", "countered"].includes(o.status),
  );

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) pushToast({ title: okMsg, accent: "var(--emerald)" });
      else
        pushToast({
          title: "İşlem başarısız",
          body: res.error,
          accent: "#ef4444",
        });
    });
  }

  if (offers.length === 0) {
    return (
      <section className="space-y-3" style={PANEL_CONTAINER}>
        <SectionHead label="Pazarlık" title="Transfer Teklifleri" />
        <p className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-6 text-center text-xs text-white/40">
          Henüz teklif yok. Listede olmayan bir oyuncu için kulübüne doğrudan
          teklif götürebilirsin — oyuncu sayfasındaki <strong>Teklif Yap</strong>{" "}
          düğmesini kullan.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4" style={PANEL_CONTAINER}>
      <SectionHead
        label="Pazarlık"
        title="Transfer Teklifleri"
        right={
          <span className="font-mono text-[11px] text-white/40">
            {incoming.length} gelen · {outgoing.length} giden
          </span>
        }
      />

      {incoming.length > 0 && (
        <div className="space-y-2">
          <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/45">
            <ArrowDownLeft size={12} /> Sana Gelen Teklifler
          </h4>
          <AnimatePresence initial={false}>
            {incoming.map((o) => (
              <motion.div
                key={o.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="rounded-xl border border-amber-400/20 bg-amber-500/[0.04] p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <PosBadge pos={o.playerPos as Position} size={22} />
                  <span className="text-sm font-semibold text-white/90">
                    {o.playerName}
                  </span>
                  <OvrChip ovr={o.playerOvr} size="sm" />
                  <span className="text-[11px] text-white/45">
                    değeri {eur(o.playerValueEur)}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-white/60">
                  <strong className="text-white/85">{o.otherClubName}</strong>{" "}
                  {eur(o.amountEur)} teklif ediyor.
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      run(
                        () =>
                          respondToTransferOffer({
                            offerId: o.id,
                            action: "accept",
                          }),
                        "Transfer tamamlandı",
                      )
                    }
                    className="btn btn-sm btn-primary"
                  >
                    Kabul Et
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      run(
                        () =>
                          respondToTransferOffer({
                            offerId: o.id,
                            action: "reject",
                          }),
                        "Teklif reddedildi",
                      )
                    }
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10 disabled:opacity-50"
                  >
                    Reddet
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      setCounterFor(counterFor === o.id ? null : o.id);
                      setCounterValue(
                        String(Math.round((o.playerValueEur * 1.3) / 1_000_000)),
                      );
                    }}
                    className="rounded-lg border border-indigo-400/25 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/20 disabled:opacity-50"
                  >
                    Karşı Teklif
                  </button>
                </div>
                {counterFor === o.id && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={counterValue}
                      onChange={(e) => setCounterValue(e.target.value)}
                      className="w-24 rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 font-mono text-xs text-white/90 outline-none focus:border-indigo-400/40"
                    />
                    <span className="text-[11px] text-white/40">milyon €</span>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        run(
                          () =>
                            respondToTransferOffer({
                              offerId: o.id,
                              action: "counter",
                              counterEur: Number(counterValue) * 1_000_000,
                            }),
                          "Karşı teklif gönderildi",
                        )
                      }
                      className="rounded-lg bg-indigo-500/90 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-50"
                    >
                      Gönder
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {outgoing.length > 0 && (
        <div className="space-y-2">
          <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/45">
            <ArrowUpRight size={12} /> Gönderdiğin Teklifler
          </h4>
          {outgoing.map((o) => (
            <div
              key={o.id}
              className="rounded-xl border border-white/8 bg-white/[0.02] p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <PosBadge pos={o.playerPos as Position} size={22} />
                <span className="text-sm font-semibold text-white/90">
                  {o.playerName}
                </span>
                <OvrChip ovr={o.playerOvr} size="sm" />
                <span className="text-[11px] text-white/45">
                  {o.otherClubName}
                </span>
                <span
                  className="ml-auto rounded-full px-2 py-0.5 font-mono text-[10px]"
                  style={{
                    background: `color-mix(in oklab, ${STATUS_LABEL[o.status]?.color ?? "var(--muted)"} 14%, transparent)`,
                    color: STATUS_LABEL[o.status]?.color ?? "var(--muted)",
                  }}
                >
                  {STATUS_LABEL[o.status]?.text ?? o.status}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-white/55">
                Teklifin: {eur(o.amountEur)}
                {o.counterEur !== null && (
                  <>
                    {" · "}
                    <span className="text-indigo-300">
                      İstenen: {eur(o.counterEur)}
                    </span>
                  </>
                )}
              </p>
              {o.message && (
                <p className="mt-1 text-[11px] italic text-white/40">
                  “{o.message}”
                </p>
              )}
              <div className="mt-2 flex items-center gap-2">
                {o.status === "countered" && o.counterEur !== null && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      run(
                        () => acceptCounterOffer({ offerId: o.id }),
                        "Karşı teklif kabul edildi",
                      )
                    }
                    className="btn btn-sm btn-primary"
                  >
                    <Handshake size={13} /> {eur(o.counterEur)} Öde
                  </button>
                )}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    run(
                      () => withdrawTransferOffer({ offerId: o.id }),
                      "Teklif geri çekildi",
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/60 transition hover:bg-white/10 disabled:opacity-50"
                >
                  <X size={13} /> Geri Çek
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {settled.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wider text-white/35 transition hover:text-white/55">
            Geçmiş ({settled.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {settled.slice(0, 12).map((o) => (
              <li
                key={o.id}
                className="flex items-center gap-2 rounded-lg bg-white/[0.02] px-2.5 py-1.5 text-[11px]"
              >
                <span className="text-white/60">{o.playerName}</span>
                <span className="text-white/30">{o.otherClubName}</span>
                <span className="ml-auto font-mono text-white/40">
                  {eur(o.amountEur)}
                </span>
                <span
                  className="rounded-full px-1.5 py-0.5 font-mono text-[9px]"
                  style={{
                    background: `color-mix(in oklab, ${STATUS_LABEL[o.status]?.color ?? "var(--muted)"} 14%, transparent)`,
                    color: STATUS_LABEL[o.status]?.color ?? "var(--muted)",
                  }}
                >
                  {STATUS_LABEL[o.status]?.text ?? o.status}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
