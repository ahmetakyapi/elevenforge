"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  Copy,
  Link2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Crest, GlassCard } from "@/components/ui/primitives";
import { Field } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { copyText } from "@/lib/clipboard";
import { switchLeagueAction } from "@/app/(app)/switch-league-action";
import { createNewLeague, joinByInvite, previewInvite } from "./actions";

export type LobbyLeagueRow = {
  clubId: string;
  clubName: string;
  clubShort: string;
  clubColor: string;
  clubColor2: string;
  leagueId: string;
  leagueName: string;
  seasonNumber: number;
  weekNumber: number;
  seasonLength: number;
  matchTime: string;
  inviteCode: string;
  humanCount: number;
  botCount: number;
};

type Mode = null | "create" | "join";

export function LobbyClient({ leagues }: { leagues: LobbyLeagueRow[] }) {
  const [mode, setMode] = useState<Mode>(null);
  const router = useRouter();
  if (mode === "create")
    return (
      <CreateWizard
        onDone={() => router.push("/dashboard")}
        onBack={() => setMode(null)}
      />
    );
  if (mode === "join")
    return (
      <JoinFlow
        onBack={() => setMode(null)}
        onJoined={() => router.push("/dashboard")}
      />
    );
  return <LobbyEntry setMode={setMode} leagues={leagues} />;
}

function LobbyEntry({
  setMode,
  leagues,
}: {
  setMode: (m: Mode) => void;
  leagues: LobbyLeagueRow[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const handleContinue = (row: LobbyLeagueRow) => {
    setSwitchingId(row.leagueId);
    startTransition(async () => {
      const res = await switchLeagueAction({ leagueId: row.leagueId });
      if (!res.ok) {
        toast({
          icon: "⚠",
          title: "Değiştirilemedi",
          body: res.error ?? "Bilinmeyen hata",
          accent: "var(--danger)",
        });
        setSwitchingId(null);
        return;
      }
      router.push("/dashboard");
    });
  };

  // The toast used to fire regardless of whether the copy succeeded — and
  // the promise was never awaited, so a refusal surfaced as an unhandled
  // rejection while the user was being told it had worked. See lib/clipboard.ts.
  const handleCopy = async (code: string) => {
    const ok = await copyText(code);
    toast({
      icon: ok ? "📋" : "⚠",
      title: ok ? "Davet kodu kopyalandı" : "Kopyalanamadı",
      body: ok ? code : `Kodu elle kopyala: ${code}`,
      accent: ok ? "var(--emerald)" : "var(--warn)",
    });
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>
      <span className="t-label" style={{ color: "var(--indigo)" }}>
        LİG
      </span>
      <div className="t-h1" style={{ marginTop: 8 }}>
        Ligine başla.
      </div>
      <div
        style={{
          color: "var(--muted)",
          fontSize: 15,
          marginTop: 8,
          maxWidth: 560,
        }}
      >
        Yeni bir lig kur ve arkadaşlarını davet et, ya da bir davet kodu
        kullanarak hazır bir lige katıl.
      </div>
      <div
        data-lobby-actions
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginTop: 36,
        }}
      >
        <GlassCard
          pad={28}
          onClick={() => setMode("create")}
          style={{ minHeight: 220, position: "relative", overflow: "hidden" }}
        >
          <BigIconBadge Icon={Sparkles} color="var(--indigo)" />
          <div className="t-h2" style={{ marginTop: 18 }}>
            Yeni Lig Kur
          </div>
          <div style={{ color: "var(--muted)", marginTop: 6 }}>
            16 slotlu özel lig. Sezon uzunluğu, maç saati ve görünürlüğü sen
            belirle.
          </div>
          <div
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              display: "flex",
              gap: 6,
            }}
          >
            <span className="chip" style={{ fontSize: 11 }}>
              3 dk
            </span>
          </div>
        </GlassCard>
        <GlassCard
          pad={28}
          onClick={() => setMode("join")}
          style={{ minHeight: 220, position: "relative", overflow: "hidden" }}
        >
          <BigIconBadge Icon={Link2} color="var(--emerald)" />
          <div className="t-h2" style={{ marginTop: 18 }}>
            Davet Kodu ile Katıl
          </div>
          <div style={{ color: "var(--muted)", marginTop: 6 }}>
            Arkadaşının gönderdiği 6 haneli kodu gir, hemen oynamaya başla.
          </div>
        </GlassCard>
      </div>
      <div
        style={{
          marginTop: 32,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <span className="t-label">LİGLERİN</span>
        {leagues.length === 0 && (
          <GlassCard pad={18} hover={false}>
            <div style={{ color: "var(--muted)", fontSize: 14 }}>
              Henüz bir lige katılmadın. Yukarıdan yeni bir lig kur veya davet
              kodu ile katıl.
            </div>
          </GlassCard>
        )}
        {leagues.map((row) => (
          <GlassCard key={row.leagueId} pad={16} hover={false}>
            <div
              data-lobby-row
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <Crest
                clubId={row.clubId}
                size={40}
                club={{
                  color: row.clubColor,
                  color2: row.clubColor2,
                  short: row.clubShort,
                }}
              />
              <div style={{ flex: 1, minWidth: 180 }}>
                <div className="t-h3">
                  {row.leagueName} · Sezon {row.seasonNumber}
                </div>
                <div className="t-small">
                  Hafta {row.weekNumber} / {row.seasonLength} · Maç saati{" "}
                  {row.matchTime}
                </div>
                <div
                  className="t-caption"
                  style={{ marginTop: 2, color: "var(--muted)" }}
                >
                  {row.clubName} · {row.humanCount} insan · {row.botCount} bot
                </div>
              </div>
              <button
                type="button"
                className="chip"
                onClick={() => handleCopy(row.inviteCode)}
                style={{
                  fontFamily: "var(--font-jetbrains, monospace)",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: "pointer",
                }}
                title="Davet kodunu kopyala"
              >
                <Copy size={12} strokeWidth={1.6} />
                {row.inviteCode}
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleContinue(row)}
                disabled={pending && switchingId === row.leagueId}
              >
                {pending && switchingId === row.leagueId
                  ? "Açılıyor…"
                  : "Devam Et"}
                <ArrowRight size={14} strokeWidth={1.6} />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

function BigIconBadge({ Icon, color }: { Icon: LucideIcon; color: string }) {
  return (
    <div
      style={{
        width: 54,
        height: 54,
        borderRadius: 14,
        background: `color-mix(in oklab, ${color} 18%, transparent)`,
        border: `1px solid color-mix(in oklab, ${color} 38%, transparent)`,
        color,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon size={24} strokeWidth={1.6} />
    </div>
  );
}

function CreateWizard({
  onDone,
  onBack,
}: {
  onDone: () => void;
  onBack: () => void;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#dc2626");
  const [time, setTime] = useState("21:00");
  const [vis, setVis] = useState<"private" | "public">("private");
  const [manualAdvance, setManualAdvance] = useState(true);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const steps = ["İsim + Renk", "Sezon + Saat", "Görünürlük"];

  const handleCreate = () => {
    startTransition(async () => {
      const res = await createNewLeague({
        teamName: name,
        matchTime: time,
        visibility: vis,
        accentColor: color,
        manualAdvanceEnabled: manualAdvance,
      });
      if (!res.ok) {
        toast({
          icon: "⚠",
          title: "Lig kurulamadı",
          body: res.error,
          accent: "var(--danger)",
        });
        return;
      }
      setCreatedCode(res.inviteCode);
      setStep(3);
    });
  };
  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "40px 24px" }}>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
        <ChevronLeft size={14} strokeWidth={1.6} /> Geri
      </button>
      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 20,
          marginBottom: 28,
        }}
      >
        {steps.map((s, i) => (
          <div
            key={s}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div
              style={{
                height: 3,
                borderRadius: 3,
                background: i <= step ? "var(--accent)" : "var(--border)",
              }}
            />
            <span
              className={i === step ? "t-h3" : "t-caption"}
              style={{ fontSize: 12 }}
            >
              {i + 1}. {s}
            </span>
          </div>
        ))}
      </div>
      <GlassCard pad={32} hover={false}>
        {step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Field label="Lig adı">
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <div>
              <span className="t-label">Lig rengi</span>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 10,
                  flexWrap: "wrap",
                }}
              >
                {[
                  "#dc2626",
                  "#ea580c",
                  "#facc15",
                  "#10b981",
                  "#22d3ee",
                  "#6366f1",
                  "#a855f7",
                  "#ec4899",
                ].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: c,
                      border:
                        color === c
                          ? "3px solid var(--text)"
                          : "1px solid var(--border)",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <span className="t-label">Sezon uzunluğu</span>
              <div
                style={{
                  marginTop: 10,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "color-mix(in oklab, var(--panel-2) 60%, transparent)",
                  border: "1px solid var(--border)",
                  fontSize: 13,
                  color: "var(--muted)",
                }}
              >
                <strong style={{ color: "var(--text)" }}>15 hafta</strong> · 16
                takım tek-eleme round-robin (her takım birbiriyle 1 kere oynar)
                + paralel 4 round&apos;luk kupa.
              </div>
            </div>
            <Field label="Maç saati (her gün)">
              <input
                className="input"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                style={{
                  fontFamily: "var(--font-jetbrains, monospace)",
                  maxWidth: 160,
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  marginTop: 6,
                  display: "block",
                }}
              >
                Production&apos;da cron bu saatte /api/cron/match-day&apos;i
                tetikler. Local dev&apos;de npm run cron:dev kullan.
              </span>
            </Field>
            <div>
              <span className="t-label">Manuel oynatma butonu</span>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  display: "block",
                  marginTop: 4,
                  marginBottom: 10,
                }}
              >
                Açık: dashboard&apos;da &ldquo;Sıradaki Haftayı Oyna&rdquo;
                butonu çıkar — arkadaşlarınla hemen oynayabilirsin. Kapalı:
                sadece cron.
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { v: true,  label: "Açık (hemen oyna)" },
                  { v: false, label: "Kapalı (sadece otomatik)" },
                ].map(({ v, label }) => (
                  <button
                    key={String(v)}
                    type="button"
                    className={`chip ${manualAdvance === v ? "active" : ""}`}
                    onClick={() => setManualAdvance(v)}
                    style={{ cursor: "pointer", padding: "8px 16px" }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <VisOption
              label="Davet-only"
              desc="Sadece link ile katılanlar görür."
              active={vis === "private"}
              onClick={() => setVis("private")}
              Icon={Link2}
            />
            <VisOption
              label="Herkese açık"
              desc="Keşfet ekranında listelenir."
              active={vis === "public"}
              onClick={() => setVis("public")}
              Icon={Compass}
            />
          </div>
        )}
        {step === 3 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
              padding: "20px 0",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background:
                  "color-mix(in oklab, var(--emerald) 20%, transparent)",
                border:
                  "1px solid color-mix(in oklab, var(--emerald) 40%, transparent)",
                color: "var(--emerald)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Check size={28} strokeWidth={2} />
            </div>
            <div className="t-h2">Lig kuruldu</div>
            <GlassCard
              pad={14}
              hover={false}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                minWidth: 360,
              }}
            >
              <Link2 size={16} strokeWidth={1.6} />
              <span className="t-mono" style={{ flex: 1 }}>
                {createdCode ?? "—"}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => {
                  if (!createdCode) return;
                  // Same rule as the other copy buttons: report what actually
                  // happened, never assume. See lib/clipboard.ts.
                  void copyText(createdCode).then((ok) =>
                    toast({
                      icon: ok ? "📋" : "⚠",
                      title: ok ? "Davet kodu kopyalandı" : "Kopyalanamadı",
                      body: ok ? createdCode : `Kodu elle kopyala: ${createdCode}`,
                      accent: ok ? "var(--emerald)" : "var(--warn)",
                    }),
                  );
                }}
              >
                Kopyala
              </button>
            </GlassCard>
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 28,
          }}
        >
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => (step > 0 ? setStep(step - 1) : onBack())}
          >
            <ChevronLeft size={14} strokeWidth={1.6} /> Geri
          </button>
          {step < 2 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setStep(step + 1)}
            >
              İleri <ChevronRight size={14} strokeWidth={1.6} />
            </button>
          ) : step === 2 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={pending}
            >
              {pending ? "Lig kuruluyor…" : "Ligi Kur"}{" "}
              <ChevronRight size={14} strokeWidth={1.6} />
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={onDone}>
              Dashboard&apos;a Git <ArrowRight size={14} strokeWidth={1.6} />
            </button>
          )}
        </div>
      </GlassCard>
      <div style={{ display: "none" }}>{JSON.stringify({ color })}</div>
    </div>
  );
}

function VisOption({
  label,
  desc,
  active,
  onClick,
  Icon,
}: {
  label: string;
  desc: string;
  active: boolean;
  onClick: () => void;
  Icon: LucideIcon;
}) {
  return (
    <GlassCard
      pad={18}
      onClick={onClick}
      style={{
        display: "flex",
        gap: 14,
        alignItems: "center",
        borderColor: active
          ? "color-mix(in oklab, var(--accent) 40%, var(--border))"
          : "var(--border)",
        background: active
          ? "color-mix(in oklab, var(--accent) 8%, var(--panel))"
          : "var(--panel)",
      }}
    >
      <Icon size={20} strokeWidth={1.6} />
      <div style={{ flex: 1 }}>
        <div className="t-h3">{label}</div>
        <div className="t-small">{desc}</div>
      </div>
      {active && <Check size={16} strokeWidth={1.6} />}
    </GlassCard>
  );
}

/**
 * Joining a league, in two steps: find it, then choose who you are.
 *
 * It used to be one step — type the code, and the server handed you whichever
 * bot club happened to sort first by UUID. That could be the title favourite,
 * a relegation candidate, or a club in a second division you were never told
 * existed. Joining is the first decision a manager makes and it shapes the
 * whole season; it should be a decision.
 */
function JoinFlow({
  onBack,
  onJoined,
}: {
  onBack: () => void;
  onJoined: () => void;
}) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  type Preview = Extract<
    Awaited<ReturnType<typeof previewInvite>>,
    { ok: true }
  >;
  const [preview, setPreview] = useState<Preview | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const lookup = () => {
    if (code.length < 4) {
      setErr("Davet kodu çok kısa.");
      return;
    }
    setErr(null);
    startTransition(async () => {
      const res = await previewInvite({ inviteCode: code });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setPreview(res);
      setChosen(res.clubs[0]?.id ?? null);
    });
  };

  const join = () => {
    if (!chosen) return;
    startTransition(async () => {
      const res = await joinByInvite({
        inviteCode: code,
        clubId: chosen,
        teamName: teamName.trim() || undefined,
      });
      if (!res.ok) {
        setErr(res.error);
        // The club may have been taken while the picker was open. Refresh the
        // list rather than leaving a stale one on screen.
        const again = await previewInvite({ inviteCode: code });
        if (again.ok) {
          setPreview(again);
          setChosen(again.clubs[0]?.id ?? null);
        }
        return;
      }
      toast({
        icon: "✅",
        title: "Lige katıldın",
        body: "Kulüp senin. Kadroyu incelemekle başla.",
        accent: "var(--emerald)",
      });
      onJoined();
    });
  };

  // ── Step 1: the code ────────────────────────────────────────────────
  if (!preview) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "80px 24px" }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
          <ChevronLeft size={14} strokeWidth={1.6} /> Geri
        </button>
        <div className="t-h1" style={{ marginTop: 20 }}>
          Davet kodu
        </div>
        <div style={{ color: "var(--muted)", fontSize: 14, marginTop: 6 }}>
          Arkadaşın sana 6 haneli bir kod yolladı.
        </div>
        <input
          className={`input ${err ? "invalid" : code.length >= 4 ? "valid" : ""}`}
          style={{
            marginTop: 28,
            fontFamily: "var(--font-jetbrains)",
            fontSize: 24,
            textAlign: "center",
            letterSpacing: "0.4em",
            padding: "20px 16px",
          }}
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            if (err) setErr(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && lookup()}
          maxLength={6}
          autoFocus
        />
        {err && (
          <div
            style={{ color: "var(--danger)", fontSize: 13, marginTop: 10 }}
            role="alert"
          >
            {err}
          </div>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={lookup}
          disabled={pending || code.length < 4}
          style={{ width: "100%", justifyContent: "center", marginTop: 20 }}
        >
          {pending ? "Aranıyor…" : "Ligi Bul"}
        </button>
      </div>
    );
  }

  // ── Step 2: which club ──────────────────────────────────────────────
  const { league, clubs: available } = preview;
  const byDivision = [1, 2]
    .map((d) => ({ division: d, list: available.filter((c) => c.division === d) }))
    .filter((g) => g.list.length > 0);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 80px" }}>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => {
          setPreview(null);
          setErr(null);
        }}
      >
        <ChevronLeft size={14} strokeWidth={1.6} /> Kodu değiştir
      </button>

      <div className="t-h1" style={{ marginTop: 18 }}>
        {league.name}
      </div>
      <div style={{ color: "var(--muted)", fontSize: 14, marginTop: 6 }}>
        Sezon {league.seasonNumber} · Hafta {league.weekNumber}/{league.seasonLength} ·
        maçlar {league.matchTime}&apos;de · {available.length} kulüp müsait.
        Hangisini devralacağını sen seç — bu kararı sonradan değiştiremezsin.
      </div>

      <input
        className="input"
        placeholder="Kulübüne isim ver (boş bırakırsan mevcut ismi kalır)"
        value={teamName}
        onChange={(e) => setTeamName(e.target.value)}
        style={{ marginTop: 20, maxWidth: 420 }}
        maxLength={28}
      />

      {byDivision.map(({ division, list }) => (
        <section key={division} style={{ marginTop: 26 }}>
          <span className="t-label">
            {division === 1 ? "SÜPER LİG" : "1. LİG"} · {list.length} kulüp
          </span>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: 10,
              marginTop: 12,
            }}
          >
            {list.map((c) => {
              const active = chosen === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setChosen(c.id)}
                  aria-pressed={active}
                  style={{
                    textAlign: "left",
                    font: "inherit",
                    color: "inherit",
                    cursor: "pointer",
                    padding: 14,
                    borderRadius: 14,
                    background: active
                      ? "color-mix(in oklab, var(--accent) 12%, var(--panel))"
                      : "var(--panel)",
                    border: active
                      ? "1px solid var(--accent)"
                      : "1px solid var(--border)",
                    transition: "border-color 160ms var(--ease), background-color 160ms var(--ease)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Crest
                      clubId={c.id}
                      size={30}
                      club={{ color: c.color, color2: c.color2, short: c.shortName }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                      <div className="t-caption" style={{ fontSize: 11 }}>
                        {c.city}
                      </div>
                    </div>
                    <span
                      className="t-mono"
                      title="Kadro ortalaması"
                      style={{
                        fontSize: 17,
                        fontWeight: 800,
                        color:
                          c.avgOverall >= 78
                            ? "var(--gold)"
                            : c.avgOverall >= 73
                              ? "var(--emerald)"
                              : c.avgOverall >= 68
                                ? "var(--cyan)"
                                : "var(--muted)",
                      }}
                    >
                      {c.avgOverall.toFixed(1)}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      marginTop: 10,
                      fontSize: 11,
                      color: "var(--muted)",
                      flexWrap: "wrap",
                    }}
                  >
                    <span>{c.squadSize} oyuncu</span>
                    <span>Bütçe €{(c.budgetEur / 1_000_000).toFixed(0)}M</span>
                    <span>Prestij {c.prestige}</span>
                  </div>

                  {c.starName && (
                    <div style={{ fontSize: 11.5, marginTop: 6 }}>
                      <span style={{ color: "var(--muted)" }}>Yıldızı: </span>
                      <span style={{ fontWeight: 600 }}>{c.starName}</span>{" "}
                      <span className="t-mono" style={{ color: "var(--gold)" }}>
                        {c.starOverall}
                      </span>
                    </div>
                  )}

                  <div
                    className="t-mono"
                    style={{
                      fontSize: 10,
                      marginTop: 8,
                      color: active ? "var(--accent)" : "var(--muted-2)",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {c.expectation.toUpperCase()}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {err && (
        <div
          style={{ color: "var(--danger)", fontSize: 13, marginTop: 16 }}
          role="alert"
        >
          {err}
        </div>
      )}

      <button
        type="button"
        className="btn btn-primary"
        onClick={join}
        disabled={pending || !chosen}
        style={{
          justifyContent: "center",
          marginTop: 24,
          width: "100%",
          maxWidth: 420,
        }}
      >
        {pending
          ? "Katılınıyor…"
          : `${available.find((c) => c.id === chosen)?.name ?? "Kulüp"} ile başla`}
      </button>
    </div>
  );
}
