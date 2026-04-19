"use client";

import { useTransition } from "react";
import { Flame } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import type { StreakInfo } from "@/lib/queries/dashboard";
import { claimDailyReward } from "./streak-actions";
import { fmtEUR } from "@/lib/utils";

export function StreakBanner({ streak }: { streak: StreakInfo }) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  if (streak.streak === 0) return null;

  const claim = () =>
    startTransition(async () => {
      const res = await claimDailyReward();
      if (res.ok) {
        toast({
          icon: "🔥",
          title: `${streak.streak}. gün ödülü`,
          body: `+${fmtEUR(res.granted)} kasa'ya düştü`,
          accent: "var(--gold)",
        });
        router.refresh();
      } else {
        toast({
          icon: "⚠",
          title: "Ödül alınamadı",
          body: res.error,
          accent: "var(--muted)",
        });
      }
    });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 12px",
        borderRadius: 999,
        background: streak.rewardAvailable
          ? "color-mix(in oklab, var(--gold) 16%, var(--panel))"
          : "var(--panel)",
        border: `1px solid ${
          streak.rewardAvailable
            ? "color-mix(in oklab, var(--gold) 40%, var(--border))"
            : "var(--border)"
        }`,
      }}
    >
      <Flame
        size={14}
        strokeWidth={2}
        color={streak.rewardAvailable ? "var(--gold)" : "var(--muted)"}
      />
      <span
        className="t-mono"
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: streak.rewardAvailable ? "var(--gold)" : "var(--text-2)",
        }}
      >
        {streak.streak}. GÜN
      </span>
      {streak.rewardAvailable && (
        <button
          type="button"
          className="btn btn-sm"
          disabled={pending}
          onClick={claim}
          style={{
            padding: "3px 10px",
            fontSize: 11,
            borderRadius: 999,
            background: "var(--gold)",
            color: "#111",
            border: "none",
            fontWeight: 700,
          }}
        >
          {pending ? "…" : `+${fmtEUR(streak.rewardEur)} al`}
        </button>
      )}
    </div>
  );
}
