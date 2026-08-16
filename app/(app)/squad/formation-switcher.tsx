"use client";

/**
 * One-tap formation change, on the squad screen.
 *
 * The tactic board is the right place to arrange an eleven carefully — drag
 * each name into its slot, set seven dials, save. It is entirely the wrong
 * place for "try a back three", which a manager wants to do in one tap while
 * looking at his squad and undo in another.
 *
 * So this switches shape AND re-arranges the eleven to fit it, using the same
 * auto-assignment the AI managers use. Changing the formation alone would be
 * worse than nothing: the saved team sheet would still be the old shape's XI,
 * and the resolver would go on fielding a back four inside a 3-5-2.
 *
 * It says so in the toast, because a control that silently rewrites the team
 * sheet you spent ten minutes on is a control you learn not to touch.
 */

import { useState, useTransition } from "react";
import { LayoutGrid } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { setFormationQuick } from "./actions";

const FORMATIONS = [
  "4-3-3",
  "4-4-2",
  "4-2-3-1",
  "3-5-2",
  "5-3-2",
  "4-1-4-1",
] as const;

/** A one-line read on what each shape is for. */
const BLURB: Record<string, string> = {
  "4-3-3": "Kanatlardan genişlik, üçlü orta saha",
  "4-4-2": "Klasik denge, iki santrfor",
  "4-2-3-1": "Çift ön libero, tek forvet",
  "3-5-2": "Üçlü savunma, orta sahada sayı üstünlüğü",
  "5-3-2": "Beşli blok — kapan ve kontra bekle",
  "4-1-4-1": "Tek ön libero, kompakt dört-dört",
};

export function FormationSwitcher({ current }: { current: string }) {
  const [active, setActive] = useState(current);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const apply = (f: string) => {
    if (f === active || pending) return;
    // Optimistic: the chips must respond on the tap, not after the round-trip.
    const previous = active;
    setActive(f);
    startTransition(async () => {
      const res = await setFormationQuick(f);
      if (res.ok) {
        toast({
          icon: "⬒",
          title: `Diziliş ${f}`,
          body: `${res.xiCount} kişilik ilk 11 bu dizilişe göre yeniden kuruldu.`,
          accent: "var(--emerald)",
        });
      } else {
        setActive(previous);
        toast({ title: "Değiştirilemedi", body: res.error, accent: "var(--danger)" });
      }
    });
  };

  return (
    <section
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        padding: "12px 16px",
        borderRadius: 14,
        background: "var(--panel)",
        border: "1px solid var(--border)",
        marginBottom: 18,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <LayoutGrid size={15} strokeWidth={1.7} color="var(--accent)" />
        <span className="t-label">DİZİLİŞ</span>
      </div>

      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", flex: 1 }}>
        {FORMATIONS.map((f) => (
          <button
            key={f}
            type="button"
            disabled={pending}
            onClick={() => apply(f)}
            className={`chip ${active === f ? "active" : ""}`}
            title={BLURB[f]}
            aria-pressed={active === f}
            style={{
              cursor: pending ? "wait" : "pointer",
              padding: "7px 13px",
              fontSize: 12,
              fontFamily: "var(--font-jetbrains)",
              fontWeight: 700,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <span
        className="t-caption"
        style={{ fontSize: 11, color: "var(--muted)", minWidth: 0 }}
      >
        {BLURB[active]}
      </span>
    </section>
  );
}
