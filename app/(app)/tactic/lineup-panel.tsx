"use client";

import { useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, RotateCcw, Save, TriangleAlert, Users } from "lucide-react";
import { OvrChip, PosBadge, SectionHead } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { autoPickLineup, saveLineup } from "./lineup-actions";
import type { Formation, Player } from "@/types";

const EASE = [0.22, 1, 0.36, 1] as const;

const LINE_ORDER = ["GK", "DEF", "MID", "FWD"] as const;
type Line = (typeof LINE_ORDER)[number];

function parseFormationCounts(formation: Formation): Record<Line, number> {
  const parts = formation
    .split("-")
    .map((n) => parseInt(n, 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (parts.length < 2) return { GK: 1, DEF: 4, MID: 4, FWD: 2 };
  const def = parts[0];
  const fwd = parts[parts.length - 1];
  const mid = parts.slice(1, -1).reduce((a, b) => a + b, 0);
  if (def + mid + fwd !== 10) return { GK: 1, DEF: 4, MID: 4, FWD: 2 };
  return { GK: 1, DEF: def, MID: mid, FWD: fwd };
}

/**
 * `Player.id` is optional on the shared type because the landing page builds
 * mock players without one. Everything here keys off the id, so narrow once
 * up front rather than sprinkling non-null assertions.
 */
type SquadPlayer = Player & { id: string };

function hasId(p: Player): p is SquadPlayer {
  return typeof p.id === "string";
}

function isUnavailable(p: Player): boolean {
  return p.status === "injured" || p.status === "suspended";
}

type Props = {
  squad: Player[];
  formation: Formation;
  initialXi: string[];
  initialBench: string[];
};

/**
 * The team sheet.
 *
 * Until this existed the squad screen was decorative — the engine re-picked
 * the best eleven by rating at kick-off no matter what the manager arranged.
 * Selecting here writes clubs.lineup_json, which is what actually takes the
 * field on match day.
 */
export default function LineupPanel({
  squad,
  formation,
  initialXi,
  initialBench,
}: Props) {
  const [xi, setXi] = useState<string[]>(initialXi);
  const [bench, setBench] = useState<string[]>(initialBench);
  const [pending, startTransition] = useTransition();
  const pushToast = useToast();

  const roster = useMemo(() => squad.filter(hasId), [squad]);
  const byId = useMemo(
    () => new Map(roster.map((p) => [p.id, p])),
    [roster],
  );
  const need = useMemo(() => parseFormationCounts(formation), [formation]);

  const selected = useMemo(
    () => xi.map((id) => byId.get(id)).filter((p): p is SquadPlayer => !!p),
    [xi, byId],
  );

  const counts = useMemo(() => {
    const c: Record<Line, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    for (const p of selected) c[p.pos as Line]++;
    return c;
  }, [selected]);

  const unavailableInXi = selected.filter(isUnavailable).length;
  const shapeOk = LINE_ORDER.every((line) => counts[line] === need[line]);
  const complete = xi.length === 11;

  function toggle(playerId: string) {
    setXi((current) => {
      if (current.includes(playerId)) {
        return current.filter((id) => id !== playerId);
      }
      if (current.length >= 11) {
        pushToast({ title: "İlk 11 dolu", body: "Önce birini çıkar.", accent: "#f59e0b" });
        return current;
      }
      return [...current, playerId];
    });
    setBench((current) => current.filter((id) => id !== playerId));
  }

  function toggleBench(playerId: string) {
    if (xi.includes(playerId)) return;
    setBench((current) =>
      current.includes(playerId)
        ? current.filter((id) => id !== playerId)
        : [...current, playerId].slice(0, 9),
    );
  }

  function onSave() {
    startTransition(async () => {
      const res = await saveLineup({ xi, bench });
      if (!res.ok) {
        pushToast({ title: "Kaydedilemedi", body: res.error, accent: "#ef4444" });
        return;
      }
      if (res.unavailable > 0) {
        pushToast({
          title: "Kadro kaydedildi",
          body: `${res.unavailable} oyuncu maça çıkamaz — yerlerine en uygun yedek girecek.`,
          accent: "#f59e0b",
        });
      } else if (!res.matchesFormation) {
        pushToast({
          title: "Kadro kaydedildi",
          body: "Diziliş ile birebir örtüşmüyor.",
          accent: "#f59e0b",
        });
      } else {
        pushToast({ title: "Kadro kaydedildi", accent: "#10b981" });
      }
    });
  }

  function onAuto() {
    startTransition(async () => {
      const res = await autoPickLineup();
      if (res.ok) {
        setXi(res.lineup.xi);
        setBench(res.lineup.bench);
        pushToast({ title: "En iyi 11 dizildi", accent: "#10b981" });
      }
    });
  }

  const byLine = (line: Line) =>
    roster.filter((p) => p.pos === line).sort((a, b) => b.ovr - a.ovr);

  return (
    <section className="space-y-4">
      <SectionHead
        label="Maç Günü"
        title="İlk 11"
        right={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onAuto}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10 disabled:opacity-50"
            >
              <RotateCcw size={13} /> Otomatik Diz
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/90 px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-50"
            >
              <Save size={13} /> Kadroyu Kaydet
            </button>
          </div>
        }
      />

      {/* Status strip — tells the manager whether the sheet is match-ready. */}
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono ${
            complete
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-amber-500/15 text-amber-300"
          }`}
        >
          <Users size={12} /> {xi.length}/11
        </span>
        {LINE_ORDER.map((line) => (
          <span
            key={line}
            className={`rounded-full px-2 py-1 font-mono ${
              counts[line] === need[line]
                ? "bg-white/5 text-white/50"
                : "bg-amber-500/15 text-amber-300"
            }`}
          >
            {line} {counts[line]}/{need[line]}
          </span>
        ))}
        {shapeOk && complete && (
          <span className="inline-flex items-center gap-1 text-emerald-300/80">
            <CheckCircle2 size={12} /> {formation} dizilişine uygun
          </span>
        )}
        {unavailableInXi > 0 && (
          <span className="inline-flex items-center gap-1 text-amber-300/90">
            <TriangleAlert size={12} /> {unavailableInXi} oyuncu maça çıkamaz
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {LINE_ORDER.map((line) => (
          <div
            key={line}
            className="rounded-xl border border-white/8 bg-white/[0.02] p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">
                {line}
              </span>
              <span className="font-mono text-[11px] text-white/35">
                {counts[line]}/{need[line]}
              </span>
            </div>
            <ul className="space-y-1">
              {byLine(line).map((p) => {
                const inXi = xi.includes(p.id);
                const onBench = bench.includes(p.id);
                const out = isUnavailable(p);
                return (
                  <li key={p.id}>
                    <motion.button
                      type="button"
                      onClick={() => toggle(p.id)}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.15, ease: EASE }}
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition ${
                        inXi
                          ? "bg-emerald-500/15 ring-1 ring-emerald-400/30"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <PosBadge pos={p.pos} size={20} />
                      <span
                        className={`min-w-0 flex-1 truncate text-xs ${
                          out ? "text-white/35 line-through" : "text-white/85"
                        }`}
                      >
                        {p.n}
                      </span>
                      {onBench && !inXi && (
                        <span className="rounded bg-white/10 px-1 font-mono text-[9px] text-white/50">
                          YDK
                        </span>
                      )}
                      <OvrChip ovr={p.ovr} size="sm" />
                    </motion.button>
                    {!inXi && (
                      <button
                        type="button"
                        onClick={() => toggleBench(p.id)}
                        className="ml-8 text-[10px] text-white/30 transition hover:text-white/60"
                      >
                        {onBench ? "Yedekten çıkar" : "Yedeğe al"}
                      </button>
                    )}
                  </li>
                );
              })}
              {byLine(line).length === 0 && (
                <li className="py-2 text-center text-[11px] text-white/25">
                  Bu mevkide oyuncu yok
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>

      <p className="text-[11px] leading-relaxed text-white/35">
        Kaydettiğin 11, maç günü sahaya çıkan kadrodur. Sakat veya cezalı bir
        oyuncu listede kalırsa yerine mevkisine en uygun yedek otomatik girer —
        yani eksik bir kadro yüzünden maçı kaybetmezsin.
      </p>
    </section>
  );
}
