"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Crest, GlassCard } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import type { NewspaperData } from "@/lib/queries/newspaper";

type Tab = "cover" | "totw" | "stats" | "press" | "fun";

const TABS: Array<[Tab, string]> = [
  ["cover", "Kapak"],
  ["totw", "Haftanın 11'i"],
  ["stats", "Gol & Asist"],
  ["press", "Basın Odası"],
  ["fun", "Köşe"],
];

export default function NewspaperUi({ paper }: { paper: NewspaperData }) {
  const [tab, setTab] = useState<Tab>("cover");

  if (!paper) {
    return (
      <div style={{ maxWidth: 720, margin: "80px auto", padding: "0 24px" }}>
        <GlassCard pad={48} hover={false} style={{ textAlign: "center" }}>
          <div className="t-h2">Henüz gazete çıkmadı</div>
          <div
            className="t-small"
            style={{ marginTop: 10, color: "var(--muted)" }}
          >
            Bir hafta oyna, ertesi sabah manşet burada olur.
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 24px" }}>
      <div
        style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}
      >
        {TABS.map(([k, l]) => (
          <button
            key={k}
            type="button"
            className={`chip ${tab === k ? "active" : ""}`}
            onClick={() => setTab(k)}
            style={{ cursor: "pointer", padding: "8px 14px", fontSize: 13 }}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "cover" && <CoverPage paper={paper} />}
      {tab === "totw" && <TOTWPage paper={paper} />}
      {tab === "stats" && <ScorersPage paper={paper} />}
      {tab === "press" && <PressRoom />}
      {tab === "fun" && <FunPage paper={paper} />}
    </div>
  );
}

function CoverPage({ paper }: { paper: NonNullable<NewspaperData> }) {
  const { cover } = paper;
  const winnerIsHome = cover.homeScore > cover.awayScore;
  const winner = winnerIsHome ? cover.heroHomeClubName : cover.heroAwayClubName;
  const winnerClubId = winnerIsHome
    ? cover.heroHomeClubId
    : cover.heroAwayClubId;
  const loser = winnerIsHome ? cover.heroAwayClubName : cover.heroHomeClubName;
  return (
    <div
      style={{
        background: "#e8e0cf",
        color: "#1a0f08",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 30px 60px -20px rgba(0,0,0,0.6)",
        border: "1px solid rgba(0,0,0,0.2)",
        fontFamily: "Georgia, serif",
      }}
    >
      <div
        style={{
          padding: "20px 28px",
          borderBottom: "3px double #1a0f08",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: 11,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          Sezon {cover.seasonNumber} · Hafta {cover.weekNumber}
        </span>
        <div
          style={{
            fontFamily: "var(--font-manrope)",
            fontWeight: 900,
            fontSize: 32,
            letterSpacing: "-0.02em",
          }}
        >
          ElevenForge <span style={{ color: "#b91c1c" }}>SPOR</span>
        </div>
        <span
          style={{
            fontSize: 11,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          {paper.publishedAt.toLocaleDateString("tr-TR")}
        </span>
      </div>
      <div
        style={{
          padding: "32px 28px 20px",
          background: "linear-gradient(180deg, #dc2626 0%, #7f1d1d 120%)",
          color: "#fff",
          borderBottom: "2px solid #1a0f08",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <Crest
            clubId={winnerClubId}
            size={28}
            club={paper.crestLookup[winnerClubId]}
          />
          <span
            style={{
              fontSize: 12,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              opacity: 0.9,
            }}
          >
            {winner} {cover.homeScore} – {cover.awayScore} {loser}
          </span>
        </div>
        <div
          style={{
            fontFamily: "var(--font-manrope)",
            fontWeight: 900,
            fontSize: "clamp(48px, 8vw, 88px)",
            lineHeight: 0.9,
            letterSpacing: "-0.03em",
            marginBottom: 10,
          }}
        >
          {cover.headline}
        </div>
        <div
          style={{
            fontSize: 20,
            fontStyle: "italic",
            opacity: 0.92,
            fontWeight: 400,
          }}
        >
          {cover.subhead}
        </div>
      </div>
      <div
        style={{
          padding: "24px 28px",
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 24,
          borderBottom: "1px solid rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ fontSize: 14, lineHeight: 1.7 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
            Stat doldu, skor {Math.abs(cover.homeScore - cover.awayScore)}{" "}
            farkla kapandı.
          </div>
          <p style={{ marginTop: 0 }}>
            Hafta {cover.weekNumber}&apos;nin en dikkat çekici maçında{" "}
            {winner}, rakibine {cover.homeScore} - {cover.awayScore}
            &apos;lik bir skor kabul ettirdi. İki takımın da taktikleri sahada
            konuştu — ancak günün sonunda fark bariz netleşti.
          </p>
          <p>
            Kazanan taraftaki moral beklendiği üzere tavana vururken, rakip
            cephesi maç sonu basın toplantısında susmayı tercih etti. Haftanın
            11&apos;i (yandaki sayfada) bu maçtan dört oyuncuyu da listeye ekledi.
          </p>
        </div>
        <aside
          style={{
            borderLeft: "1px solid rgba(0,0,0,0.15)",
            paddingLeft: 16,
            fontSize: 13,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 10,
              color: "#b91c1c",
            }}
          >
            Gol Krallığı (Sezon)
          </div>
          {paper.scorers.slice(0, 5).map((s, i) => (
            <div
              key={s.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0",
                borderBottom: "1px dotted rgba(0,0,0,0.2)",
              }}
            >
              <span>
                {i + 1}. {s.name}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-jetbrains)",
                  fontWeight: 600,
                }}
              >
                {s.g}
              </span>
            </div>
          ))}
          {paper.scorers.length === 0 && (
            <div style={{ fontSize: 12, opacity: 0.7 }}>Henüz gol yok.</div>
          )}
        </aside>
      </div>
      <div
        style={{
          padding: "14px 28px",
          fontSize: 11,
          display: "flex",
          justifyContent: "space-between",
          color: "#4a3420",
          fontStyle: "italic",
        }}
      >
        <span>Devam sayfalarında: Haftanın 11&apos;i · Gol &amp; Asist</span>
        <span>Sayı {cover.weekNumber}</span>
      </div>
    </div>
  );
}

function TOTWPage({ paper }: { paper: NonNullable<NewspaperData> }) {
  const totw = paper.totw;
  if (totw.length === 0) {
    return (
      <GlassCard pad={40} hover={false}>
        <div className="t-h3">Henüz haftanın 11&apos;i yok</div>
      </GlassCard>
    );
  }
  const rows = [
    totw.slice(0, 1),
    totw.slice(1, 5),
    totw.slice(5, 9),
    totw.slice(9, 11),
  ];

  return (
    <GlassCard
      pad={28}
      hover={false}
      style={{
        background: "linear-gradient(180deg, #0a1e14 0%, #051a10 100%)",
        border:
          "1px solid color-mix(in oklab, var(--emerald) 30%, var(--border))",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 24,
        }}
      >
        <div>
          <span className="t-label" style={{ color: "var(--gold)" }}>
            HAFTANIN 11&apos;İ
          </span>
          <div className="t-h1" style={{ marginTop: 8, color: "#fff" }}>
            Team of the Week
          </div>
        </div>
        <span className="t-mono" style={{ fontSize: 13, color: "var(--gold)" }}>
          Hafta {paper.cover.weekNumber} · Sezon {paper.cover.seasonNumber}
        </span>
      </div>
      <div
        style={{
          background: "rgba(255,255,255,0.05)",
          padding: "40px 30px",
          borderRadius: 16,
          display: "flex",
          flexDirection: "column",
          gap: 32,
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {rows.map((row, i) => (
          <div
            key={`row-${i}`}
            style={{ display: "flex", justifyContent: "space-around", gap: 20 }}
          >
            {row.filter(Boolean).map((p) => (
              <div
                key={p.playerId}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--gold), #ca8a04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid var(--gold)",
                    boxShadow:
                      "0 0 20px color-mix(in oklab, var(--gold) 40%, transparent)",
                  }}
                >
                  <span
                    className="t-mono"
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#1a0f08",
                    }}
                  >
                    {p.rating}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#fff",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.name}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Crest
                    clubId={p.clubId}
                    size={14}
                    club={paper.crestLookup[p.clubId]}
                  />
                  <span
                    className="t-caption"
                    style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}
                  >
                    {p.position}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function ScorersPage({ paper }: { paper: NonNullable<NewspaperData> }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <GlassCard pad={24} hover={false}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 24 }}>⚽</div>
          <div>
            <span className="t-label" style={{ color: "var(--gold)" }}>
              GOL KRALLIĞI
            </span>
            <div className="t-h2" style={{ fontSize: 18 }}>
              Top scorers
            </div>
          </div>
        </div>
        {paper.scorers.map((s, i) => (
          <div
            key={s.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 0",
              borderBottom:
                i < paper.scorers.length - 1
                  ? "1px solid var(--border)"
                  : "none",
            }}
          >
            <span
              className="t-mono"
              style={{
                color: i < 3 ? "var(--gold)" : "var(--muted)",
                fontSize: 14,
                width: 20,
              }}
            >
              {i + 1}
            </span>
            <Crest clubId={s.clubId} size={22} club={paper.crestLookup[s.clubId]} />
            <span style={{ flex: 1, fontSize: 14 }}>{s.name}</span>
            <span
              className="t-mono"
              style={{ fontSize: 16, fontWeight: 600, color: "var(--gold)" }}
            >
              {s.g}
            </span>
          </div>
        ))}
        {paper.scorers.length === 0 && (
          <div className="t-small" style={{ color: "var(--muted)" }}>
            Henüz gol yok.
          </div>
        )}
      </GlassCard>
      <GlassCard pad={24} hover={false}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 24 }}>🎯</div>
          <div>
            <span className="t-label" style={{ color: "var(--cyan)" }}>
              ASİST KRALLIĞI
            </span>
            <div className="t-h2" style={{ fontSize: 18 }}>
              Top assists
            </div>
          </div>
        </div>
        {paper.assists.map((s, i) => (
          <div
            key={s.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 0",
              borderBottom:
                i < paper.assists.length - 1
                  ? "1px solid var(--border)"
                  : "none",
            }}
          >
            <span
              className="t-mono"
              style={{
                color: i < 3 ? "var(--cyan)" : "var(--muted)",
                fontSize: 14,
                width: 20,
              }}
            >
              {i + 1}
            </span>
            <Crest clubId={s.clubId} size={22} club={paper.crestLookup[s.clubId]} />
            <span style={{ flex: 1, fontSize: 14 }}>{s.name}</span>
            <span
              className="t-mono"
              style={{ fontSize: 16, fontWeight: 600, color: "var(--cyan)" }}
            >
              {s.a}
            </span>
          </div>
        ))}
        {paper.assists.length === 0 && (
          <div className="t-small" style={{ color: "var(--muted)" }}>
            Henüz asist yok.
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function PressRoom() {
  const [answer, setAnswer] = useState<number | null>(null);
  const toast = useToast();
  const answers = [
    {
      text: "Oyuncularım inandı, ben de oyuna inandım. Skor doğal geldi.",
      morale: 2,
      emoji: "💎",
      color: "var(--emerald)",
    },
    {
      text: "Taktik planımız işledi, rakibin geçişlerini durdurduk.",
      morale: 0,
      emoji: "🎯",
      color: "var(--cyan)",
    },
    {
      text: "Bu sezonun en kötü rakiplerinden biriydi, ben de şaşkınım.",
      morale: -1,
      emoji: "🧊",
      color: "var(--danger)",
    },
  ];
  return (
    <GlassCard pad={28} hover={false}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: "color-mix(in oklab, var(--indigo) 18%, transparent)",
            border:
              "1px solid color-mix(in oklab, var(--indigo) 40%, transparent)",
            color: "var(--indigo)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MessageSquare size={20} strokeWidth={1.6} />
        </div>
        <div>
          <span className="t-label">BASIN ODASI</span>
          <div className="t-h2" style={{ fontSize: 20, marginTop: 4 }}>
            &ldquo;Bu skoru nasıl değerlendiriyorsun?&rdquo;
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {answers.map((a, i) => (
          <button
            key={a.emoji}
            type="button"
            onClick={() => {
              setAnswer(i);
              toast({
                icon: a.emoji,
                title: "Cevabın gönderildi",
                body:
                  a.morale > 0
                    ? `Moral +${a.morale}`
                    : a.morale < 0
                      ? `Moral ${a.morale}`
                      : "Moral nötr",
                accent: a.color,
              });
            }}
            className="glass"
            style={{
              padding: 16,
              textAlign: "left",
              cursor: "pointer",
              border: `1px solid ${answer === i ? a.color : "var(--border)"}`,
              background:
                answer === i
                  ? `color-mix(in oklab, ${a.color} 10%, var(--panel))`
                  : "var(--panel)",
              fontFamily: "var(--font-manrope)",
              color: "var(--text)",
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 20 }}>{a.emoji}</span>
            <span style={{ flex: 1, fontSize: 14 }}>{a.text}</span>
            <span
              className="t-mono"
              style={{ fontSize: 12, fontWeight: 600, color: a.color }}
            >
              {a.morale > 0 ? `+${a.morale}` : a.morale} moral
            </span>
          </button>
        ))}
      </div>
      <div className="t-caption" style={{ marginTop: 16, fontSize: 12 }}>
        Cevapların oyuncu moralini etkiler. Moral, bir sonraki maçta performansa
        yansır.
      </div>
    </GlassCard>
  );
}

function FunPage({ paper }: { paper: NonNullable<NewspaperData> }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <GlassCard pad={24} hover={false}>
        <span className="t-label" style={{ color: "var(--warn)" }}>
          AI KÖŞE · EĞLENCELİK
        </span>
        <div
          className="t-h2"
          style={{ fontSize: 18, marginTop: 8, marginBottom: 12 }}
        >
          Forge Fun Fact
        </div>
        <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.7 }}>
          {paper.funFact || "Gazete henüz köşe yazısı yayınlamadı."}
        </p>
      </GlassCard>
      <GlassCard pad={24} hover={false}>
        <span className="t-label" style={{ color: "var(--danger)" }}>
          TRANSFER SÖYLENTİLERİ
        </span>
        <div
          className="t-h2"
          style={{ fontSize: 18, marginTop: 8, marginBottom: 12 }}
        >
          Rumor mill
        </div>
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: "none",
            fontSize: 13,
            color: "var(--text-2)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <li>🔥 Pazarda hareket yoğun — lideri zorlamaya hazırlanıyor.</li>
          <li>📰 Kaşiflerden sıcak haberler, yılın genç yıldızı yolda.</li>
          <li>🔍 Hafta sonu rövanşlar konuşulacak.</li>
        </ul>
      </GlassCard>
    </div>
  );
}
