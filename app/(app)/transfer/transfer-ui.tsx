"use client";

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { Compass, Plus, Search, X } from "lucide-react";
import {
  Crest,
  Currency,
  GlassCard,
  OvrChip,
  PosBadge,
  ProgressRing,
  SectionHead,
  UserAvatar,
} from "@/components/ui/primitives";
import { Field, SliderField } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { NAT_FLAGS, NAT_NAMES, fmtEUR, tierColor } from "@/lib/utils";
import type { Position } from "@/types";
import {
  findScoutCandidates,
  SCOUT_NATIONALITIES,
} from "@/lib/scout-pool";
import type {
  CrestLookup,
  MyListingView,
  SellRowView,
  TransferListingView,
  TransferPageData,
} from "@/lib/queries/transfer";
import {
  buyListing,
  listPlayer,
  removeListing,
  sendScoutAction,
} from "./actions";
import { claimScout } from "./claim-scout";
import { ListingExtraActions } from "./listing-extra-actions";
import { placeBid } from "./bid-actions";

type SortKey = "trend" | "price-asc" | "price-desc" | "ovr" | "age";
type PosFilter = Position | "ALL";
type Mode = "buy" | "sell";

export default function TransferMarketUi({ data }: { data: TransferPageData }) {
  const [showScout, setShowScout] = useState(false);
  const [pos, setPos] = useState<PosFilter>("ALL");
  const [maxPrice, setMaxPrice] = useState(80);
  const [minOvr, setMinOvr] = useState(60);
  const [maxAge, setMaxAge] = useState(35);
  const [sort, setSort] = useState<SortKey>("trend");
  const [mode, setMode] = useState<Mode>("buy");

  /*
    "Does this player actually improve my team?" is the question a market
    exists to answer, and the row could not answer it. Price, rating and age
    describe the player in isolation; whether he beats what you already have
    at his position is the thing you are really buying. `userSquad` is already
    loaded for the Sell tab, so the comparison costs nothing.
  */
  const squadBest = useMemo(() => {
    const best: Partial<Record<PosFilter, number>> = {};
    for (const p of data.userSquad) {
      const current = best[p.position];
      if (current === undefined || p.overall > current) best[p.position] = p.overall;
    }
    return best;
  }, [data.userSquad]);

  const filtered = data.listings
    .filter((p) => pos === "ALL" || p.position === pos)
    .filter((p) => p.priceEur <= maxPrice * 1_000_000)
    .filter((p) => p.overall >= minOvr)
    .filter((p) => p.age <= maxAge);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sort === "price-asc") arr.sort((a, b) => a.priceEur - b.priceEur);
    else if (sort === "price-desc") arr.sort((a, b) => b.priceEur - a.priceEur);
    else if (sort === "ovr") arr.sort((a, b) => b.overall - a.overall);
    else if (sort === "age") arr.sort((a, b) => a.age - b.age);
    else arr.sort((a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0));
    return arr;
  }, [filtered, sort]);

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 28px" }}>
      {/* Window state, stated up front. A closed market that only reveals
          itself when a button is pressed reads as a broken button. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          borderRadius: 12,
          marginBottom: 14,
          border: `1px solid color-mix(in oklab, ${
            data.window.open ? "var(--emerald)" : "var(--warn, #f59e0b)"
          } 35%, var(--border))`,
          background: `color-mix(in oklab, ${
            data.window.open ? "var(--emerald)" : "var(--warn, #f59e0b)"
          } 10%, transparent)`,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            flexShrink: 0,
            background: data.window.open
              ? "var(--emerald)"
              : "var(--warn, #f59e0b)",
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          {data.window.label}
        </span>
        <span className="t-caption" style={{ fontSize: 11.5 }}>
          {data.window.open
            ? data.window.closesAtWeek !== null
              ? `${data.window.closesAtWeek}. hafta sonunda kapanıyor`
              : ""
            : data.window.opensAtWeek !== null
              ? `${data.window.opensAtWeek}. haftada yeniden açılıyor`
              : "Sezon sonunda yeniden açılıyor"}
        </span>
      </div>

      {data.returnedScouts.length > 0 && (
        <ReturnedScoutsBanner scouts={data.returnedScouts} />
      )}
      <GlobalTicker
        globalTicker={data.globalTicker}
        crestLookup={data.crestLookup}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 320px",
          gap: 20,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <ModeTabs mode={mode} setMode={setMode} />
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowScout(true)}
            >
              <Compass size={14} strokeWidth={1.6} /> Kaşif Gönder
            </button>
          </div>

          {mode === "buy" ? (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  marginBottom: 14,
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <span className="t-label">TRANSFER PAZARI</span>
                  <div className="t-h1" style={{ marginTop: 6, fontSize: 28 }}>
                    {sorted.length} oyuncu
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {SORT_OPTIONS.map(([k, l]) => (
                    <button
                      key={k}
                      type="button"
                      className={`chip ${sort === k ? "active" : ""}`}
                      onClick={() => setSort(k)}
                      style={{ cursor: "pointer", fontSize: 11 }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <GlassCard pad={14} hover={false} style={{ marginBottom: 14 }}>
                <div
                  data-transfer-filters
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr 1fr 1fr",
                    gap: 16,
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {POS_OPTIONS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`chip ${pos === p ? "active" : ""}`}
                        onClick={() => setPos(p)}
                        style={{ cursor: "pointer", fontSize: 11 }}
                      >
                        {p === "ALL" ? "Tüm Mevki" : p}
                      </button>
                    ))}
                  </div>
                  <SliderField
                    label="Max fiyat"
                    value={`€${maxPrice}M`}
                    min={5}
                    max={200}
                    cur={maxPrice}
                    onChange={setMaxPrice}
                    color="var(--emerald)"
                  />
                  <SliderField
                    label="Min OVR"
                    value={minOvr}
                    min={60}
                    max={90}
                    cur={minOvr}
                    onChange={setMinOvr}
                    color="var(--indigo)"
                  />
                  <SliderField
                    label="Max yaş"
                    value={`${maxAge}y`}
                    min={17}
                    max={38}
                    cur={maxAge}
                    onChange={setMaxAge}
                    color="var(--warn)"
                  />
                </div>
              </GlassCard>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 8 }}
              >
                {sorted.map((p, i) => (
                  <TransferRow
                    key={p.id}
                    listing={p}
                    idx={i}
                    crestLookup={data.crestLookup}
                    balanceEur={data.balanceEur}
                    squadBest={squadBest[p.position]}
                  />
                ))}
                {sorted.length === 0 && (
                  <GlassCard
                    pad={40}
                    hover={false}
                    style={{ textAlign: "center" }}
                  >
                    <Search size={24} strokeWidth={1.6} />
                    <div className="t-h3" style={{ marginTop: 12 }}>
                      Filtreye uyan oyuncu yok
                    </div>
                    <div className="t-caption" style={{ marginTop: 4 }}>
                      Filtreleri gevşetmeyi veya Kaşif göndermeyi dene.
                    </div>
                  </GlassCard>
                )}
              </div>
            </>
          ) : (
            <SellTab userSquad={data.userSquad} />
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <MarketStats stats={data.marketStats} />
          <GlassCard pad={16} hover={false}>
            <SectionHead
              label="SENİN LİSTELERİN"
              title={<span style={{ fontSize: 16 }}>Satışta</span>}
            />
            <div
              style={{ display: "flex", flexDirection: "column", gap: 8 }}
            >
              {data.myListings.length === 0 && (
                <div
                  className="t-small"
                  style={{ color: "var(--muted)", padding: "8px 0" }}
                >
                  Henüz listede oyuncun yok.
                </div>
              )}
              {data.myListings.map((p) => (
                <MyListRow key={p.id} listing={p} />
              ))}
              {data.myListings.length < 5 && (
                <button
                  type="button"
                  className="glass"
                  style={{
                    padding: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    border: "1px dashed var(--border)",
                    cursor: "pointer",
                    color: "var(--muted)",
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                  onClick={() => setMode("sell")}
                >
                  <Plus size={14} strokeWidth={1.6} /> Oyuncu Listele
                </button>
              )}
            </div>
          </GlassCard>
          {data.activeScouts.length > 0 && (
            <GlassCard pad={16} hover={false}>
              <SectionHead
                label="SAHADAKİ KAŞİFLER"
                title={
                  <span style={{ fontSize: 16 }}>
                    {data.activeScouts.length} / 3 görevde
                  </span>
                }
              />
              {/* All three, not just the newest. Three may be out at once and
                  the panel showed one, so the other two were invisible until
                  they came back — there was no way to tell whether you had one
                  running or your full allowance. */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {data.activeScouts.map((sc) => (
                  <ScoutActiveCard key={sc.id} scout={sc} />
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      {showScout && (
        <ScoutModal
          onClose={() => setShowScout(false)}
          scoutTier={data.scoutTier}
          inField={data.activeScouts.length}
        />
      )}
    </div>
  );
}

const SORT_OPTIONS: Array<[SortKey, string]> = [
  ["trend", "Trend"],
  ["price-asc", "€↑"],
  ["price-desc", "€↓"],
  ["ovr", "OVR"],
  ["age", "Yaş"],
];
const POS_OPTIONS: PosFilter[] = ["ALL", "GK", "DEF", "MID", "FWD"];

function ReturnedScoutsBanner({
  scouts,
}: {
  scouts: TransferPageData["returnedScouts"];
}) {
  const [openId, setOpenId] = useState<string | null>(scouts[0]?.id ?? null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const active = scouts.find((s) => s.id === openId);

  const claim = (scoutId: string, idx: number, name: string) =>
    startTransition(async () => {
      const res = await claimScout(scoutId, idx);
      if (res.ok) {
        toast({
          icon: "🛰",
          title: `${name} takımında`,
          body: "Kaşifte bulunan oyuncu kadronla birleşti.",
          accent: "var(--emerald)",
        });
      } else {
        toast({
          icon: "⚠",
          title: "Alınamadı",
          body: res.error,
          accent: "var(--danger)",
        });
      }
    });

  return (
    <div
      className="glass"
      style={{
        padding: 0,
        overflow: "hidden",
        marginBottom: 20,
        border:
          "1px solid color-mix(in oklab, var(--indigo) 35%, var(--border))",
        background: "color-mix(in oklab, var(--indigo) 6%, var(--panel))",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Compass size={16} strokeWidth={1.6} color="var(--indigo)" />
        <span className="t-label" style={{ color: "var(--indigo)" }}>
          KAŞİF DÖNDÜ
        </span>
        <span className="t-small" style={{ color: "var(--text-2)" }}>
          {scouts.length} rapor · her raporda 3 aday, birini imzalarsın
        </span>
        <div style={{ flex: 1 }} />
        {scouts.length > 1 && (
          <div style={{ display: "flex", gap: 4 }}>
            {scouts.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={`chip ${openId === s.id ? "active" : ""}`}
                onClick={() => setOpenId(s.id)}
                style={{ cursor: "pointer", fontSize: 11 }}
              >
                {s.country} {s.position} #{i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
      {active && (
        <div
          style={{
            padding: "14px 16px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 10,
          }}
        >
          {active.candidates.map((c, i) => (
            <div
              key={`${c.name}-${i}`}
              className="glass"
              style={{
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                border:
                  "1px solid color-mix(in oklab, var(--indigo) 20%, var(--border))",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 6,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={c.name}
                  >
                    {c.name}
                  </div>
                  <div
                    className="t-caption"
                    style={{
                      fontSize: 11,
                      marginTop: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    <span>
                      {c.role} · {c.age}y · {c.nat}
                    </span>
                    {/* Real footballers carry their actual age, position and
                        club career (lib/scout-pool.ts); invented ones are
                        generated. Saying which is which is the difference
                        between a name you can trust and one you cannot. */}
                    {c.real && (
                      <span
                        className="t-mono"
                        title="Gerçek oyuncu — yaş ve mevki bilgisi doğru"
                        style={{
                          fontSize: 8.5,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          padding: "1px 5px",
                          borderRadius: 4,
                          background: "color-mix(in oklab, var(--gold) 18%, transparent)",
                          color: "var(--gold)",
                        }}
                      >
                        GERÇEK
                      </span>
                    )}
                  </div>
                </div>
                <OvrChip ovr={c.overall} size="sm" />
              </div>

              {/* Six attributes, same fixed order as the squad card, so a
                  scout report can be read against a player you already own. */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "4px 8px",
                }}
              >
                {(
                  [
                    ["pace", "HIZ"],
                    ["shooting", "ŞUT"],
                    ["passing", "PAS"],
                    ["defending", "DEF"],
                    ["physical", "FİZ"],
                    ["goalkeeping", "KAL"],
                  ] as const
                ).map(([key, label]) => {
                  const v = c[key];
                  return (
                    <div
                      key={key}
                      style={{ display: "flex", alignItems: "baseline", gap: 5 }}
                    >
                      <span
                        className="t-mono"
                        style={{
                          fontSize: 11.5,
                          fontWeight: 800,
                          minWidth: 18,
                          color: scoutAttrTone(v),
                        }}
                      >
                        {v}
                      </span>
                      <span className="t-label" style={{ fontSize: 8.5, letterSpacing: "0.1em" }}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span className="t-caption" style={{ fontSize: 11 }}>
                  Potansiyel{" "}
                  <span
                    className="t-mono"
                    style={{
                      color:
                        c.potential > c.overall + 3
                          ? "var(--gold)"
                          : "var(--text-2)",
                      fontWeight: 700,
                    }}
                  >
                    {c.potential}
                  </span>
                </span>
                <Currency value={c.marketValueEur} size={12} color="var(--emerald)" />
              </div>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                disabled={pending}
                onClick={() => claim(active.id, i, c.name)}
                style={{ justifyContent: "center" }}
              >
                {pending ? "…" : `${fmtEUR(c.marketValueEur)} karşılığında al`}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * The attributes a market row prints, by position.
 *
 * Three, matching the squad board — this is a scanning surface, and six
 * numbers per row across twenty rows is a wall. The player sheet has all six
 * for when you are deciding rather than browsing.
 */
const MARKET_ATTRS: Record<
  "GK" | "DEF" | "MID" | "FWD",
  Array<[keyof TransferListingView & ("pace"|"shooting"|"passing"|"defending"|"physical"|"goalkeeping"), string]>
> = {
  GK: [["goalkeeping", "KAL"], ["physical", "FİZ"], ["passing", "PAS"]],
  DEF: [["defending", "DEF"], ["physical", "FİZ"], ["pace", "HIZ"]],
  MID: [["passing", "PAS"], ["defending", "DEF"], ["physical", "FİZ"]],
  FWD: [["shooting", "ŞUT"], ["pace", "HIZ"], ["physical", "FİZ"]],
};

/** Same colour bands as the squad board, so 78 means one thing app-wide. */
function marketAttrTone(v: number): string {
  if (v >= 85) return "var(--gold)";
  if (v >= 76) return "var(--emerald)";
  if (v >= 66) return "var(--cyan)";
  return "var(--muted)";
}

/** Same colour bands as the squad card, so 78 means one thing app-wide. */
function scoutAttrTone(v: number): string {
  if (v >= 88) return "var(--gold)";
  if (v >= 78) return "var(--emerald)";
  if (v >= 68) return "var(--cyan)";
  if (v >= 55) return "var(--text-2)";
  return "var(--muted)";
}

function ModeTabs({
  mode,
  setMode,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        background: "var(--bg-2)",
        padding: 4,
        borderRadius: 999,
        border: "1px solid var(--border)",
      }}
    >
      {(["buy", "sell"] as const).map((m) => {
        const active = mode === m;
        const label = m === "buy" ? "AL" : "SAT";
        return (
          <button
            key={m}
            type="button"
            className="t-label"
            onClick={() => setMode(m)}
            style={{
              padding: "8px 18px",
              borderRadius: 999,
              border: "none",
              background: active
                ? m === "buy"
                  ? "var(--accent)"
                  : "var(--warn)"
                : "transparent",
              color: active
                ? m === "buy"
                  ? "#fff"
                  : "#111"
                : "var(--muted)",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: "0.1em",
              transition: "opacity 200ms, transform 200ms, color 200ms, background-color 200ms, border-color 200ms, box-shadow 200ms",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function GlobalTicker({
  globalTicker,
  crestLookup,
}: {
  globalTicker: TransferPageData["globalTicker"];
  crestLookup: CrestLookup;
}) {
  if (globalTicker.length === 0) {
    return null;
  }
  return (
    <div
      className="glass"
      style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}
    >
      <div
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--emerald)",
            animation: "pulse-accent 2s ease-in-out infinite",
          }}
        />
        <span className="t-label" style={{ color: "var(--emerald)" }}>
          CANLI · TÜM LİGLER
        </span>
        <span
          className="t-small"
          style={{ color: "var(--muted)", marginLeft: "auto" }}
        >
          Son 24 saat
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            gap: 32,
            padding: "12px 0",
            animation: "marquee 64s linear infinite",
            width: "max-content",
            whiteSpace: "nowrap",
          }}
        >
          {[...globalTicker, ...globalTicker].map((t, i) => (
            <span
              key={`${t.buyer}-${t.player}-${i}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "0 16px",
                fontSize: 13,
              }}
            >
              <Crest
                clubId={t.buyerClubId}
                size={20}
                club={crestLookup[t.buyerClubId]}
              />
              <span style={{ fontWeight: 600 }}>{t.buyer}</span>
              <span style={{ color: "var(--muted)" }}>→</span>
              <span style={{ fontWeight: 600 }}>{t.player}</span>
              <span className="t-mono" style={{ color: "var(--emerald)" }}>
                {fmtEUR(t.priceEur)}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function MarketStats({
  stats,
}: {
  stats: TransferPageData["marketStats"];
}) {
  const items = [
    { l: "Hareketli piyasa", v: stats.movement, c: "var(--emerald)" },
    { l: "Ortalama fiyat", v: fmtEUR(stats.avgPrice), c: "var(--text)" },
    { l: "En pahalı", v: fmtEUR(stats.topPrice), c: "var(--warn)" },
    { l: "Bugün satılan", v: `${stats.soldToday}`, c: "var(--indigo)" },
  ];
  return (
    <GlassCard pad={16} hover={false}>
      <SectionHead label="PİYASA" title={<span style={{ fontSize: 16 }}>Özet</span>} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {items.map((s) => (
          <div
            key={s.l}
            style={{ display: "flex", flexDirection: "column", gap: 4 }}
          >
            <span className="t-caption" style={{ fontSize: 10 }}>
              {s.l}
            </span>
            <span
              className="t-mono"
              style={{ fontSize: 16, fontWeight: 700, color: s.c }}
            >
              {s.v}
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function TransferRow({
  listing,
  idx,
  crestLookup,
  balanceEur,
  squadBest,
}: {
  listing: TransferListingView;
  idx: number;
  crestLookup: CrestLookup;
  balanceEur: number;
  /** Best overall the user already fields in this player's position. */
  squadBest: number | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const trending = listing.trending;
  const canAfford = balanceEur >= listing.priceEur;
  const tier = tierColor(listing.overall);
  const growth = Math.max(0, listing.potential - listing.overall);

  /*
    The buying decision, made visible.

    The row showed the asking price and nothing to judge it against — market
    value was loaded (`marketValueEur`) but only appeared once you expanded the
    row, so scanning a market meant opening every listing in turn. A price is
    not information; a price relative to what the player is worth is. The
    premium below is the number a manager actually acts on, so it gets a badge
    of its own and the price is coloured by it rather than by absolute size.
  */
  const premiumPct =
    listing.marketValueEur > 0
      ? Math.round(
          ((listing.priceEur - listing.marketValueEur) / listing.marketValueEur) *
            100,
        )
      : 0;
  const deal =
    premiumPct <= -10
      ? { label: `${premiumPct}% FIRSAT`, tint: "var(--emerald)" }
      : premiumPct <= 5
        ? { label: "PİYASA FİYATI", tint: "var(--cyan)" }
        : premiumPct <= 30
          ? { label: `+${premiumPct}% PRİM`, tint: "var(--muted)" }
          : { label: `+${premiumPct}% PAHALI`, tint: "var(--warn)" };
  const priceColor = canAfford ? deal.tint : "var(--danger)";

  // Measured against the best you already have in that position, because that
  // is who he would have to displace.
  const fit =
    squadBest === undefined
      ? null
      : listing.overall - squadBest >= 1
        ? {
            label: `EN İYİN OLUR +${listing.overall - squadBest}`,
            tint: "var(--emerald)",
          }
        : listing.overall - squadBest >= -2
          ? { label: "İLK 11 ADAYI", tint: "var(--cyan, #22d3ee)" }
          : { label: "YEDEK", tint: "var(--muted)" };

  const isAuction = listing.bidsCloseAtMs !== null;
  const leading =
    isAuction &&
    listing.myBidEur !== null &&
    listing.myBidEur === listing.topBidEur;
  const closesLabel = (() => {
    if (!listing.bidsCloseAtMs) return "";
    const mins = Math.round((listing.bidsCloseAtMs - Date.now()) / 60000);
    if (mins <= 0) return "kapanıyor";
    if (mins < 60) return `${mins}dk`;
    return `${Math.round(mins / 60)}sa`;
  })();

  const onBid = () =>
    startTransition(async () => {
      // Open at the asking price, raise over the leader. The server re-checks
      // both the band and the deadline; this only picks a sensible default so
      // the common case is one click rather than a form.
      const next =
        listing.topBidEur === null
          ? listing.priceEur
          : Math.round(listing.topBidEur * 1.05);
      const res = await placeBid({ listingId: listing.id, amountEur: next });
      if (res.ok) {
        toast({
          icon: "◈",
          title: res.raised ? "Teklifin yükseltildi" : "Teklifin kaydedildi",
          body: `${listing.name} · ${fmtEUR(next)}`,
          accent: "var(--gold)",
        });
      } else {
        toast({
          icon: "⚠",
          title: "Teklif verilemedi",
          body: res.error,
          accent: "var(--danger)",
        });
      }
    });

  const onBuy = () =>
    startTransition(async () => {
      const res = await buyListing(listing.id);
      if (res.ok) {
        toast({
          icon: "✓",
          title: `${res.playerName} takımında`,
          body: "Oyuncu kadronla birleşti.",
          accent: "var(--emerald)",
        });
      } else {
        toast({
          icon: "⚠",
          title: "Alınamadı",
          body: res.error,
          accent: "var(--danger)",
        });
      }
    });

  return (
    <div
      className="glass"
      data-affordable={canAfford || undefined}
      style={{
        padding: 0,
        overflow: "hidden",
        position: "relative",
        transition: "opacity 200ms var(--ease), transform 200ms var(--ease), color 200ms var(--ease), background-color 200ms var(--ease), border-color 200ms var(--ease), box-shadow 200ms var(--ease)",
        borderColor: open
          ? "color-mix(in oklab, var(--accent) 40%, var(--border))"
          : undefined,
        // A listing you cannot pay for is still worth reading — you might sell
        // to reach it — but it should not compete with the ones you can.
        opacity: canAfford ? 1 : 0.62,
        animation: `slide-up 300ms ${Math.min(idx * 40, 600)}ms both var(--ease)`,
      }}
    >
      {/* Quality band, readable before any number is. */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: `linear-gradient(180deg, ${tier}, color-mix(in oklab, ${tier} 25%, transparent))`,
        }}
      />
      <div
        onClick={() => setOpen(!open)}
        data-transfer-row
        style={{
          display: "grid",
          gridTemplateColumns:
            "44px 1.7fr 1fr 60px 58px 128px 152px",
          gap: 14,
          alignItems: "center",
          padding: "12px 16px",
          cursor: "pointer",
        }}
      >
        <div style={{ position: "relative", width: 44, height: 44 }}>
          <UserAvatar name={listing.name} size={44} />
          <div
            style={{
              position: "absolute",
              bottom: -2,
              right: -2,
              border: "2px solid var(--bg)",
              borderRadius: "50%",
            }}
          >
            <PosBadge pos={listing.position} size={18} />
          </div>
        </div>

        <div
          style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{listing.name}</span>
            {isAuction && (
              <span
                className="t-mono"
                title={closesLabel}
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: "0.03em",
                  padding: "2px 7px",
                  borderRadius: 999,
                  whiteSpace: "nowrap",
                  background:
                    "color-mix(in oklab, var(--gold) 18%, transparent)",
                  color: "var(--gold)",
                }}
              >
                {leading ? "AÇIK ARTIRMA · ÖNDESİN" : `AÇIK ARTIRMA · ${closesLabel}`}
              </span>
            )}
            {fit && (
              <span
                className="t-mono"
                title={`Bu mevkideki en iyi oyuncun ${squadBest} overall`}
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: "0.03em",
                  padding: "2px 7px",
                  borderRadius: 999,
                  whiteSpace: "nowrap",
                  background: `color-mix(in oklab, ${fit.tint} 15%, transparent)`,
                  color: fit.tint,
                }}
              >
                {fit.label}
              </span>
            )}
            {trending && (
              <span
                className="t-mono"
                title="Trend yukarı"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--emerald)",
                  background:
                    "color-mix(in oklab, var(--emerald) 14%, transparent)",
                  padding: "2px 6px",
                  borderRadius: 4,
                  letterSpacing: "0.05em",
                }}
              >
                TREND
              </span>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              minWidth: 0,
            }}
          >
            {listing.sellerClubId && (
              <Crest
                clubId={listing.sellerClubId}
                size={14}
                club={crestLookup[listing.sellerClubId]}
              />
            )}
            <span
              className="t-caption"
              style={{
                fontSize: 11.5,
                color: "var(--muted)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {listing.sellerClubName ?? "Bot pazarı"}
            </span>
          </div>

          {/* What you are actually buying.
              The squad screen, the player card and the scout report all print
              attributes; the market — the one screen where you commit money to
              a player you have never seen — printed none. A rating and an age
              cannot tell a quick winger from a slow one. Three, not six: the
              ones that decide this position's job, at a density a list of
              twenty rows can carry. */}
          <div style={{ display: "flex", gap: 9, marginTop: 1 }}>
            {MARKET_ATTRS[listing.position].map(([key, label]) => {
              const v = listing[key];
              return (
                <span
                  key={key}
                  style={{ display: "inline-flex", alignItems: "baseline", gap: 3 }}
                >
                  <span
                    className="t-mono"
                    style={{ fontSize: 10.5, fontWeight: 800, color: marketAttrTone(v) }}
                  >
                    {v}
                  </span>
                  <span className="t-label" style={{ fontSize: 8, letterSpacing: "0.1em" }}>
                    {label}
                  </span>
                </span>
              );
            })}
          </div>
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
            {listing.role}
          </span>
          <span
            className="t-caption"
            style={{
              fontSize: 11.5,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span style={{ fontSize: 14 }}>
              {NAT_FLAGS[listing.nationality] || "🌍"}
            </span>
            <span style={{ color: "var(--muted)" }}>
              {NAT_NAMES[listing.nationality] || listing.nationality}
            </span>
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <OvrChip ovr={listing.overall} size="sm" />
        </div>

        <div style={{ textAlign: "center" }}>
          <div className="t-mono" style={{ fontSize: 15, fontWeight: 700 }}>
            {listing.age}
          </div>
          {growth > 0 ? (
            <div
              className="t-mono"
              title={`Potansiyel ${listing.potential}`}
              style={{ fontSize: 10, fontWeight: 700, color: "var(--gold)" }}
            >
              ↑{growth}
            </div>
          ) : (
            <div className="t-caption" style={{ fontSize: 10 }}>
              yaş
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
          }}
          title={`Piyasa değeri ${fmtEUR(listing.marketValueEur)} · ${listing.hoursOn} saat önce listelendi`}
        >
          <span
            className="t-mono"
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: "0.03em",
              padding: "3px 8px",
              borderRadius: 999,
              whiteSpace: "nowrap",
              background: `color-mix(in oklab, ${deal.tint} 15%, transparent)`,
              color: deal.tint,
            }}
          >
            {deal.label}
          </span>
          <span className="t-caption" style={{ fontSize: 10 }}>
            {isAuction
              ? listing.bidCount === 0
                ? "henüz teklif yok"
                : `${listing.bidCount} teklif · en yüksek ${fmtEUR(listing.topBidEur ?? 0)}`
              : `değer ${fmtEUR(listing.marketValueEur)}`}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            <span
              className="t-mono"
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: priceColor,
                letterSpacing: "-0.01em",
              }}
            >
              {fmtEUR(listing.priceEur)}
            </span>
            <span className="t-caption" style={{ fontSize: 10 }}>
              {listing.sellerType === "bot" ? "Bot" : `@${listing.sellerName ?? ""}`}
            </span>
          </div>
          {isAuction ? (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              disabled={pending}
              onClick={(e) => {
                e.stopPropagation();
                onBid();
              }}
              style={{ minWidth: 78 }}
              title={
                listing.myBidEur !== null
                  ? `Teklifin ${fmtEUR(listing.myBidEur)} — yükselt`
                  : "Açık artırmaya katıl"
              }
            >
              {pending ? "…" : listing.myBidEur !== null ? "Yükselt" : "Teklif"}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              disabled={!canAfford || pending}
              onClick={(e) => {
                e.stopPropagation();
                onBuy();
              }}
              style={{ minWidth: 56 }}
            >
              {pending ? "…" : "Al"}
            </button>
          )}
        </div>
      </div>

      {open && (
        <div
          style={{
            padding: "14px 16px",
            background: "color-mix(in oklab, var(--accent) 5%, transparent)",
            borderTop: "1px solid var(--border)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: 16,
            animation: "slide-up 200ms var(--ease)",
          }}
        >
          <StatRow
            l="Potansiyel"
            v={`${listing.potential}`}
            c={
              listing.potential > listing.overall + 2
                ? "var(--emerald)"
                : "var(--text)"
            }
          />
          <StatRow
            l="Kalan"
            v={
              listing.hoursOn < 6
                ? "Kısa süre"
                : `${Math.max(0, 30 - listing.hoursOn)}sa`
            }
            c="var(--warn)"
          />
          <StatRow
            l="Tipik pazar"
            v={`${fmtEUR(listing.priceEur * 0.9)} - ${fmtEUR(listing.priceEur * 1.15)}`}
            c="var(--muted)"
          />
          <StatRow
            l="Satıcı"
            v={listing.sellerType === "bot" ? "🤖 Bot" : (listing.sellerName ?? "")}
            c="var(--text)"
          />
          <ListingExtraActions
            listingId={listing.id}
            playerId={listing.playerId}
            priceEur={listing.priceEur}
            watching={listing.watching}
          />
        </div>
      )}
    </div>
  );
}

function StatRow({ l, v, c }: { l: string; v: ReactNode; c?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span className="t-caption" style={{ fontSize: 10 }}>
        {l}
      </span>
      <span
        className="t-mono"
        style={{ fontSize: 13, fontWeight: 600, color: c || "var(--text)" }}
      >
        {v}
      </span>
    </div>
  );
}

function SellTab({ userSquad }: { userSquad: SellRowView[] }) {
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 14,
        }}
      >
        <div>
          <span className="t-label">KENDİ OYUNCULARIN</span>
          <div className="t-h1" style={{ marginTop: 6, fontSize: 28 }}>
            Listele &amp; Sat
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {userSquad.map((p, i) => (
          <SellRow key={p.playerId} p={p} idx={i} />
        ))}
        {userSquad.length === 0 && (
          <div className="t-small" style={{ color: "var(--muted)" }}>
            Kadronda oyuncu yok.
          </div>
        )}
      </div>
    </>
  );
}

function SellRow({ p, idx }: { p: SellRowView; idx: number }) {
  const [askingEur, setAskingEur] = useState(
    Math.round(p.marketValueEur / 1_000_000),
  );
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const list = () =>
    startTransition(async () => {
      const res = await listPlayer({
        playerId: p.playerId,
        priceEur: askingEur * 1_000_000,
      });
      if (res.ok) {
        toast({
          icon: "💰",
          title: "Listelendi",
          body: `${p.name} piyasada.`,
          accent: "var(--emerald)",
        });
      } else {
        toast({
          icon: "⚠",
          title: "Listelenmedi",
          body: res.error,
          accent: "var(--danger)",
        });
      }
    });

  return (
    <GlassCard
      pad={14}
      data-sell-row
      style={{
        display: "grid",
        gridTemplateColumns: "44px 1.6fr 100px 70px 100px 1fr 120px",
        gap: 14,
        alignItems: "center",
        animation: `slide-up 300ms ${Math.min(idx * 30, 400)}ms both var(--ease)`,
        borderColor: p.isListed
          ? "color-mix(in oklab, var(--warn) 35%, var(--border))"
          : undefined,
      }}
    >
      <div style={{ position: "relative", width: 44, height: 44 }}>
        <UserAvatar name={p.name} size={44} />
        <div
          style={{
            position: "absolute",
            bottom: -2,
            right: -2,
            border: "2px solid var(--bg)",
            borderRadius: "50%",
          }}
        >
          <PosBadge pos={p.position} size={18} />
        </div>
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 14.5,
            fontWeight: 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {p.name}
        </div>
        <div className="t-caption" style={{ fontSize: 11, marginTop: 2 }}>
          {p.role} · {p.age}y
        </div>
      </div>
      <OvrChip ovr={p.overall} size="sm" />
      <div style={{ textAlign: "center" }}>
        <div className="t-mono" style={{ fontSize: 13, fontWeight: 700 }}>
          {p.lastFormRating ? p.lastFormRating.toFixed(1) : "—"}
        </div>
        <div className="t-caption" style={{ fontSize: 10 }}>
          form
        </div>
      </div>
      <Currency value={p.marketValueEur} size={14} color="var(--emerald)" />
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span className="t-caption" style={{ fontSize: 10, whiteSpace: "nowrap" }}>
          Asking
        </span>
        <input
          type="number"
          className="input"
          value={askingEur}
          onChange={(e) => setAskingEur(Number(e.target.value))}
          style={{
            width: 70,
            padding: "6px 8px",
            fontSize: 12,
            fontFamily: "var(--font-jetbrains)",
          }}
          disabled={p.isListed || pending}
        />
        <span className="t-caption" style={{ fontSize: 10 }}>
          M€
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        {p.isListed ? (
          <span
            className="t-caption"
            style={{ fontSize: 11, color: "var(--warn)" }}
          >
            Listede
          </span>
        ) : (
          <button
            type="button"
            className="btn btn-sm btn-primary"
            disabled={pending}
            onClick={list}
          >
            {pending ? "…" : "Listele"}
          </button>
        )}
      </div>
    </GlassCard>
  );
}

function MyListRow({ listing }: { listing: MyListingView }) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  return (
    <div
      className="glass"
      style={{
        padding: 10,
        display: "grid",
        gridTemplateColumns: "auto 1fr auto auto",
        gap: 10,
        alignItems: "center",
        border: "1px solid color-mix(in oklab, var(--warn) 30%, var(--border))",
      }}
    >
      <PosBadge pos={listing.position} size={22} />
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {listing.name}
        </div>
        <div className="t-caption" style={{ fontSize: 10 }}>
          OVR {listing.overall} · {listing.age}y
        </div>
      </div>
      <Currency value={listing.priceEur} size={12} color="var(--warn)" />
      <button
        type="button"
        className="btn btn-sm btn-ghost"
        disabled={pending}
        style={{ color: "var(--danger)", padding: "4px 8px", fontSize: 11 }}
        onClick={() =>
          startTransition(async () => {
            const res = await removeListing(listing.id);
            if (res.ok) {
              toast({
                icon: "✓",
                title: "Listeden kaldırıldı",
                body: listing.name,
                accent: "var(--muted)",
              });
            } else {
              toast({
                icon: "⚠",
                title: "Kaldırılamadı",
                body: res.error,
                accent: "var(--danger)",
              });
            }
          })
        }
      >
        Kaldır
      </button>
    </div>
  );
}

function ScoutActiveCard({
  scout,
}: {
  scout: NonNullable<TransferPageData["activeScout"]>;
}) {
  const [sec, setSec] = useState(scout.returnsInSec);
  useEffect(() => {
    const i = setInterval(() => setSec((x) => Math.max(0, x - 1)), 1000);
    return () => clearInterval(i);
  }, []);
  const pct = Math.max(
    0,
    100 - (sec / scout.totalDurationSec) * 100,
  );
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (x: number) => String(x).padStart(2, "0");
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8 }}
    >
      <ProgressRing pct={pct} size={64} />
      <div style={{ flex: 1 }}>
        <div className="t-h3" style={{ fontSize: 13 }}>
          {NAT_FLAGS[scout.country] ?? "🌍"} {scout.country} · {scout.position} ·{" "}
          {scout.ageRange}
        </div>
        <div
          className="t-mono"
          style={{ fontSize: 14, color: "var(--warn)", marginTop: 4 }}
        >
          {pad(h)}:{pad(m)}:{pad(s)}
        </div>
        <div className="t-caption" style={{ fontSize: 11, marginTop: 2 }}>
          kalan süre
        </div>
      </div>
    </div>
  );
}

/**
 * The scouting desk.
 *
 * ─── What was wrong ─────────────────────────────────────────────────────
 *
 * Two dropdowns and a slider, and every one of them lied or hid something:
 *
 *   - FIVE countries, hardcoded, out of the twenty-one the pool actually
 *     covers. Most of the game's best players were unreachable because a
 *     `<select>` had never been updated.
 *   - "Kaşifi Yolla (~8 saat)". The trip has been three hours since the scout
 *     was reworked, and less with a chief scout on the payroll.
 *   - No way to know whether a brief was worth sending. You paid €500K, waited,
 *     and found out. A brief matching nobody — a 34-year-old Georgian keeper —
 *     cost exactly the same as a good one and came back with invented players.
 *   - Nothing suggested the chief scout did anything, so nobody would hire one.
 *
 * ─── What it does now ───────────────────────────────────────────────────
 *
 * It answers the brief BEFORE you commit. The pool is real data (see
 * lib/scout-pool.ts) and it is a plain module with no server dependency, so
 * this screen can run the same filter the job will run and say exactly how
 * many real footballers match, and the best rating among them — which is what
 * the €500K is actually buying.
 *
 * That turns a form into a decision: widen the ages, change country, drop the
 * position filter, and watch the number move.
 */
function ScoutModal({
  onClose,
  scoutTier,
  inField,
}: {
  onClose: () => void;
  scoutTier: number;
  inField: number;
}) {
  const toast = useToast();
  const [nat, setNat] = useState("BR");
  const [pos, setPos] = useState<Position | "ANY">("FWD");
  const [ageMin, setAgeMin] = useState(17);
  const [ageMax, setAgeMax] = useState(24);
  const [pending, startTransition] = useTransition();

  const hours = Math.max(1, 3 - scoutTier * 0.5);
  const full = inField >= 3;

  /*
    What this brief is worth.

    Runs the same reach the job runs, minus its luck term: `scoutReach` in
    lib/jobs/scout.ts widens the visible band with the chief scout's tier, so
    what is shown here is the honest ceiling of what THIS department can find
    rather than what the whole pool contains. A club with nobody in the role
    genuinely cannot see the top of the game, and the panel says so.
  */
  const preview = useMemo(() => {
    const maxOverall = Math.round(
      70 + Math.min(1, 0.34 + scoutTier * 0.11 + 0.22) * 25,
    );
    const matches = findScoutCandidates({
      nat,
      position: pos,
      ageMin,
      ageMax,
      minOverall: 0,
      maxOverall,
      exclude: new Set<string>(),
    });
    return {
      count: matches.length,
      best: matches.reduce((m, p) => Math.max(m, p.overall), 0),
      sample: matches.slice(0, 3),
    };
  }, [nat, pos, ageMin, ageMax, scoutTier]);

  const submit = () =>
    startTransition(async () => {
      const res = await sendScoutAction({
        targetNationality: nat,
        targetPosition: pos,
        ageMin,
        ageMax,
      });
      if (res.ok) {
        toast({
          icon: "🛰",
          title: "Kaşif yollandı",
          body: `${NAT_NAMES[nat] ?? nat} · ${pos} · ~${hours} saat sonra döner`,
          accent: "var(--indigo)",
        });
        onClose();
      } else {
        toast({
          icon: "⚠",
          title: "Gönderilemedi",
          body: res.error,
          accent: "var(--danger)",
        });
      }
    });

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(6px)",
        zIndex: 200,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <div
        data-modal
        data-modal-panel
        onClick={(e) => e.stopPropagation()}
        className="glass"
        style={{
          maxWidth: 560,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "var(--bg-2)",
          borderRadius: 18,
          padding: 22,
          animation: "modal-in 260ms var(--ease)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 16,
          }}
        >
          <div>
            <span className="t-label" style={{ color: "var(--indigo)" }}>
              KAŞİF
            </span>
            <div className="t-h2" style={{ marginTop: 5, fontSize: 22 }}>
              Yeni Görev
            </div>
            <div className="t-caption" style={{ fontSize: 11.5, marginTop: 4 }}>
              {inField} / 3 kaşif sahada · her rapor 3 aday getirir, birini
              imzalarsın
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={16} strokeWidth={1.6} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
          <Field label="Hedef ülke">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {SCOUT_NATIONALITIES.map((code) => (
                <button
                  key={code}
                  type="button"
                  className={`chip ${nat === code ? "active" : ""}`}
                  onClick={() => setNat(code)}
                  title={NAT_NAMES[code] ?? code}
                  style={{ cursor: "pointer", fontSize: 11.5, padding: "5px 9px" }}
                >
                  {NAT_FLAGS[code] ?? "🏳"} {code}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Mevki">
            <div style={{ display: "flex", gap: 5 }}>
              {(["GK", "DEF", "MID", "FWD", "ANY"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`chip ${pos === k ? "active" : ""}`}
                  onClick={() => setPos(k)}
                  style={{ cursor: "pointer", flex: 1, justifyContent: "center" }}
                >
                  {k === "ANY" ? "Farketmez" : k}
                </button>
              ))}
            </div>
          </Field>

          <Field label={`Yaş aralığı · ${ageMin} – ${ageMax}`}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <input
                type="range"
                min={16}
                max={38}
                value={ageMin}
                onChange={(e) => setAgeMin(Math.min(+e.target.value, ageMax))}
                style={{ accentColor: "var(--accent)", flex: 1 }}
                aria-label="En küçük yaş"
              />
              <input
                type="range"
                min={16}
                max={38}
                value={ageMax}
                onChange={(e) => setAgeMax(Math.max(+e.target.value, ageMin))}
                style={{ accentColor: "var(--accent)", flex: 1 }}
                aria-label="En büyük yaş"
              />
            </div>
          </Field>
        </div>

        <div
          style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 12,
            background: "var(--panel-2)",
            border: `1px solid ${
              preview.count > 0
                ? "color-mix(in oklab, var(--emerald) 32%, var(--border))"
                : "color-mix(in oklab, var(--warn) 38%, var(--border))"
            }`,
          }}
        >
          <span className="t-label" style={{ fontSize: 9.5 }}>
            BU BRİFE UYAN GERÇEK OYUNCU
          </span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 6 }}>
            <span
              className="t-mono"
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: preview.count > 0 ? "var(--emerald)" : "var(--warn)",
              }}
            >
              {preview.count}
            </span>
            {preview.count > 0 && (
              <span className="t-caption" style={{ fontSize: 12 }}>
                en iyisi{" "}
                <span className="t-mono" style={{ color: "var(--gold)", fontWeight: 700 }}>
                  {preview.best}
                </span>{" "}
                reyting
              </span>
            )}
          </div>
          <p className="t-caption" style={{ fontSize: 11.5, margin: "8px 0 0", lineHeight: 1.55 }}>
            {preview.count > 0 ? (
              <>
                {preview.sample.map((p) => p.name).join(", ")}
                {preview.count > 3 && ` ve ${preview.count - 3} isim daha`} —
                kaşif bunların arasından üç aday getirir.
              </>
            ) : (
              <>
                Bu tarife uyan tanınmış oyuncu yok. Kaşif yine de gider ama
                kurgusal oyuncularla döner — yaş aralığını genişlet ya da başka
                bir ülke seç.
              </>
            )}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 14,
            marginTop: 14,
            flexWrap: "wrap",
            fontSize: 11.5,
            color: "var(--muted)",
          }}
        >
          <span>
            Ücret <strong style={{ color: "var(--text-2)" }}>€500K</strong>
          </span>
          <span>
            Dönüş <strong style={{ color: "var(--text-2)" }}>~{hours} saat</strong>
          </span>
          <span>
            Baş kaşif{" "}
            <strong style={{ color: scoutTier > 0 ? "var(--emerald)" : "var(--warn)" }}>
              {scoutTier > 0 ? `T${scoutTier}` : "yok"}
            </strong>
            {scoutTier === 0 && " — oyunun en üst seviyesini göremezsin"}
          </span>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          disabled={pending || full}
          onClick={submit}
          style={{ width: "100%", justifyContent: "center", marginTop: 16 }}
        >
          {full
            ? "Üç kaşif de sahada"
            : pending
              ? "Gönderiliyor…"
              : "Kaşifi Yolla · €500K"}
        </button>
      </div>
    </div>
  );
}
