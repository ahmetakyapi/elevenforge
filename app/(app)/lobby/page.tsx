"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  Link2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Crest, GlassCard } from "@/components/ui/primitives";
import { Field } from "@/components/ui/form";
import { CREW, clubById } from "@/lib/mock-data";
import { useToast } from "@/components/ui/toast";
import { createNewLeague, joinByInvite } from "./actions";

type Mode = null | "create" | "join" | "wait";

export default function LobbyPage() {
  const [mode, setMode] = useState<Mode>(null);
  const router = useRouter();
  if (!mode) return <LobbyEntry setMode={setMode} />;
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
  return <SlotGrid onStart={() => router.push("/dashboard")} />;
}

function LobbyEntry({ setMode }: { setMode: (m: Mode) => void }) {
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
        <span className="t-label">DEVAM EDEN LİGLER</span>
        <GlassCard pad={16} hover={false}>
          <div
            style={{ display: "flex", alignItems: "center", gap: 16 }}
          >
            <Crest clubId="ist" size={40} />
            <div style={{ flex: 1 }}>
              <div className="t-h3">Kartel Crew · Sezon 3</div>
              <div className="t-small">
                Hafta 7 / 10 · Sonraki maç yarın 21:00
              </div>
            </div>
            <span className="chip active">1. sırada</span>
            <span className="t-mono" style={{ color: "var(--muted)" }}>
              16 kişi
            </span>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setMode("wait")}
            >
              Devam Et
            </button>
          </div>
        </GlassCard>
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
  const [name, setName] = useState("Kartel Crew");
  const [color, setColor] = useState("#dc2626");
  const [len, setLen] = useState(5);
  const [time, setTime] = useState("21:00");
  const [vis, setVis] = useState<"private" | "public">("private");
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
                + paralel 4 round'luk kupa.
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
                Her gün bu saatte cron tetiklenip o günün fikstürlerini oynar.
                Manuel oynatmayı sezon başladıktan sonra açabilirsin.
              </span>
            </Field>
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
                  if (createdCode) navigator.clipboard?.writeText(createdCode);
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

function JoinFlow({
  onBack,
  onJoined,
}: {
  onBack: () => void;
  onJoined: () => void;
}) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const submit = () => {
    if (code.length < 4) {
      setErr("Davet kodu çok kısa.");
      return;
    }
    setErr(null);
    startTransition(async () => {
      const res = await joinByInvite({ inviteCode: code });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      toast({
        icon: "✅",
        title: "Lige katıldın",
        body: "Bot kulüplerden biri sana devredildi.",
        accent: "var(--emerald)",
      });
      onJoined();
    });
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "80px 24px" }}>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
        <ChevronLeft size={14} strokeWidth={1.6} /> Geri
      </button>
      <div className="t-h1" style={{ marginTop: 20 }}>
        Davet kodu
      </div>
      <div
        style={{ color: "var(--muted)", fontSize: 14, marginTop: 6 }}
      >
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
        maxLength={6}
      />
      {err && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 14px",
            borderRadius: 10,
            background: "color-mix(in oklab, var(--danger) 10%, transparent)",
            border:
              "1px solid color-mix(in oklab, var(--danger) 40%, var(--border))",
            color: "var(--danger)",
            fontSize: 13,
          }}
        >
          {err}
        </div>
      )}
      <button
        type="button"
        className="btn btn-primary btn-lg"
        style={{ marginTop: 16, width: "100%", justifyContent: "center" }}
        onClick={submit}
        disabled={pending}
      >
        {pending ? "Katılıyorsun…" : "Katıl"}
      </button>
    </div>
  );
}

function SlotGrid({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 20,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <span className="t-label">LİG LOBİSİ</span>
          <div className="t-h1" style={{ marginTop: 8 }}>
            Kartel Crew
          </div>
          <div className="t-small" style={{ marginTop: 4 }}>
            {CREW.filter((c) => !c.bot).length} insan ·{" "}
            {CREW.filter((c) => c.bot).length} bot · 16 / 16 dolu
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <GlassCard
            pad={12}
            hover={false}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <Link2 size={14} strokeWidth={1.6} />
            <span className="t-mono" style={{ fontSize: 13 }}>
              elevenforge.app/j/K4R73L
            </span>
          </GlassCard>
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={onStart}
          >
            Lige Başla <ArrowRight size={14} strokeWidth={1.6} />
          </button>
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        {CREW.map((m) => {
          const c = clubById(m.clubId);
          if (!c) return null;
          return (
            <GlassCard
              key={m.id}
              pad={14}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                minHeight: 72,
              }}
            >
              <Crest clubId={m.clubId} size={36} />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    className="t-h3"
                    style={{
                      fontSize: 14,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {m.name}
                  </span>
                  {m.isUser && (
                    <span
                      className="chip active"
                      style={{ fontSize: 10, padding: "2px 6px" }}
                    >
                      SEN
                    </span>
                  )}
                  {m.bot && (
                    <span
                      className="chip"
                      style={{
                        fontSize: 10,
                        padding: "2px 6px",
                        color: "var(--muted)",
                      }}
                    >
                      BOT
                    </span>
                  )}
                </div>
                <span
                  className="t-small"
                  style={{ fontSize: 12, color: "var(--muted)" }}
                >
                  {c.name}
                </span>
              </div>
              {!m.bot && (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: m.online ? "var(--emerald)" : "var(--muted-2)",
                    flexShrink: 0,
                  }}
                />
              )}
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
