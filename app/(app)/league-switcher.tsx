"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { switchLeagueAction } from "./switch-league-action";

export type OwnedLeague = {
  leagueId: string;
  clubId: string;
  leagueName: string;
  clubName: string;
};

/**
 * Drop-down in the top nav listing every league the user owns a club in.
 * Picking one calls the switchLeague server action and refreshes routing.
 */
export function LeagueSwitcher({
  current,
  owned,
}: {
  current: OwnedLeague;
  owned: OwnedLeague[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (owned.length <= 1) {
    // Single-league user — don't render the dropdown chrome at all.
    return (
      <span className="t-mono" style={{ fontSize: 12, color: "var(--muted)" }}>
        {current.leagueName}
      </span>
    );
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
      >
        <span className="t-mono" style={{ fontSize: 12 }}>
          {current.leagueName}
        </span>
        <ChevronDown size={12} strokeWidth={1.6} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 6,
            minWidth: 240,
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: 6,
            zIndex: 50,
            boxShadow: "0 8px 24px rgba(0,0,0,.4)",
          }}
        >
          {owned.map((o) => {
            const isCurrent = o.leagueId === current.leagueId;
            return (
              <button
                key={o.leagueId}
                type="button"
                className="btn btn-ghost btn-sm"
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: 6,
                  background: isCurrent
                    ? "color-mix(in oklab, var(--accent) 14%, transparent)"
                    : "transparent",
                  textAlign: "left",
                }}
                disabled={pending || isCurrent}
                onClick={() => {
                  startTransition(async () => {
                    const res = await switchLeagueAction({
                      leagueId: o.leagueId,
                    });
                    if (res.ok) {
                      setOpen(false);
                      router.refresh();
                    }
                  });
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    {o.leagueName}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>
                    {o.clubName}
                  </span>
                </div>
                {isCurrent && (
                  <span
                    className="t-mono"
                    style={{
                      fontSize: 10,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: "color-mix(in oklab, var(--accent) 22%, transparent)",
                      color: "var(--accent)",
                    }}
                  >
                    AKTİF
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
