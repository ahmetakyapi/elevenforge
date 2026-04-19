"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { updateLeagueSettings } from "./actions";

export function LeagueSettingsForm({
  initial,
}: {
  initial: {
    matchTime: string;
    visibility: "private" | "public";
    commissionerOnlyAdvance: boolean;
  };
}) {
  const [matchTime, setMatchTime] = useState(initial.matchTime);
  const [visibility, setVisibility] = useState(initial.visibility);
  const [commOnly, setCommOnly] = useState(initial.commissionerOnlyAdvance);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  const dirty =
    matchTime !== initial.matchTime ||
    visibility !== initial.visibility ||
    commOnly !== initial.commissionerOnlyAdvance;

  const save = () => {
    startTransition(async () => {
      const res = await updateLeagueSettings({
        matchTime,
        visibility,
        commissionerOnlyAdvance: commOnly,
      });
      if (!res.ok) {
        toast({ icon: "⚠", title: "Kaydedilemedi", body: res.error, accent: "var(--danger)" });
        return;
      }
      toast({
        icon: "✅",
        title: "Ayarlar güncellendi",
        body: "Yeni ayarlar bir sonraki maç-gününden itibaren geçerli.",
        accent: "var(--emerald)",
      });
      router.refresh();
    });
  };

  return (
    <div
      style={{
        background: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 22,
      }}
    >
      <Field label="Maç saati" desc="Her gün fikstürlerin oynanacağı saat (HH:MM).">
        <input
          className="input"
          type="time"
          value={matchTime}
          onChange={(e) => setMatchTime(e.target.value)}
          style={{ maxWidth: 160, fontFamily: "var(--font-jetbrains)" }}
        />
      </Field>

      <Field
        label="Görünürlük"
        desc="Davet-only: sadece koduyla katılım. Herkese açık: keşfet listesinde."
      >
        <div style={{ display: "flex", gap: 8 }}>
          <Pill
            active={visibility === "private"}
            onClick={() => setVisibility("private")}
            label="Davet-only"
          />
          <Pill
            active={visibility === "public"}
            onClick={() => setVisibility("public")}
            label="Herkese açık"
          />
        </div>
      </Field>

      <Field
        label="Hafta ileri sarma"
        desc="Açıkken sadece kurucu sıradaki haftayı oynatabilir; kapalı bırakırsan herhangi bir kullanıcı tetikleyebilir."
      >
        <div style={{ display: "flex", gap: 8 }}>
          <Pill
            active={commOnly}
            onClick={() => setCommOnly(true)}
            label="Sadece kurucu"
          />
          <Pill
            active={!commOnly}
            onClick={() => setCommOnly(false)}
            label="Herkes"
          />
        </div>
      </Field>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={save}
          disabled={!dirty || pending}
        >
          {pending ? "Kaydediliyor…" : "Değişiklikleri Kaydet"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  desc,
  children,
}: {
  label: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span className="t-label">{label}</span>
      <span style={{ fontSize: 12, color: "var(--muted)" }}>{desc}</span>
      {children}
    </div>
  );
}

function Pill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className={`chip ${active ? "active" : ""}`}
      onClick={onClick}
      style={{ cursor: "pointer", padding: "8px 16px" }}
    >
      {label}
    </button>
  );
}
