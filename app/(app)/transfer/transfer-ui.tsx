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
import { NAT_FLAGS, NAT_NAMES, fmtEUR } from "@/lib/utils";
import type { Position } from "@/types";
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
          {data.activeScout && (
            <GlassCard pad={16} hover={false}>
              <SectionHead
                label="AKTİF KAŞİF"
                title={<span style={{ fontSize: 16 }}>1 görevde</span>}
              />
              <ScoutActiveCard scout={data.activeScout} />
            </GlassCard>
          )}
        </div>
      </div>

      {showScout && <ScoutModal onClose={() => setShowScout(false)} />}
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
          {scouts.reduce((s, x) => s + x.candidates.length, 0)} aday ·{" "}
          {scouts.length} görev
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
                  >
                    {c.name}
                  </div>
                  <div className="t-caption" style={{ fontSize: 11, marginTop: 2 }}>
                    {c.role} · {c.age}y · {c.nat}
                  </div>
                </div>
                <OvrChip ovr={c.overall} size="sm" />
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
              transition: "all 200ms",
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
}: {
  listing: TransferListingView;
  idx: number;
  crestLookup: CrestLookup;
  balanceEur: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const trending = listing.trending;
  const priceColor =
    listing.priceEur > 40_000_000
      ? "var(--warn)"
      : listing.priceEur > 20_000_000
        ? "var(--text)"
        : "var(--emerald)";
  const canAfford = balanceEur >= listing.priceEur;

  const onBuy = () =>
    startTransition(async () => {
      const res = await buyListing(listing.id);
      if (res.ok) {
        toast({
          icon: "⚽",
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
      style={{
        padding: 0,
        overflow: "hidden",
        transition: "all 200ms var(--ease)",
        borderColor: open
          ? "color-mix(in oklab, var(--accent) 40%, var(--border))"
          : undefined,
        animation: `slide-up 300ms ${Math.min(idx * 40, 600)}ms both var(--ease)`,
      }}
    >
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: "grid",
          gridTemplateColumns: "44px 1.8fr 1.2fr 70px 70px 90px 150px",
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
          <div className="t-caption" style={{ fontSize: 10 }}>
            yaş
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <span
            className="t-mono"
            style={{
              fontSize: 12,
              color: trending ? "var(--emerald)" : "var(--muted)",
              fontWeight: 600,
            }}
          >
            {listing.decay}
          </span>
          <span className="t-caption" style={{ fontSize: 10 }}>
            {listing.hoursOn} saat önce
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
            marketValueEur={listing.marketValueEur}
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

function ScoutModal({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [nat, setNat] = useState("BR");
  const [pos, setPos] = useState<Position | "ANY">("FWD");
  const [ageMax, setAgeMax] = useState(24);
  const [pending, startTransition] = useTransition();

  const submit = () =>
    startTransition(async () => {
      const res = await sendScoutAction({
        targetNationality: nat,
        targetPosition: pos,
        ageMin: 17,
        ageMax,
      });
      if (res.ok) {
        toast({
          icon: "🛰",
          title: "Kaşif yollandı",
          body: `${nat} · ${pos} · ~8 saat`,
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
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        zIndex: 200,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass"
        style={{
          maxWidth: 480,
          width: "100%",
          background: "var(--bg-2)",
          borderRadius: 16,
          padding: 24,
          animation: "slide-up 260ms var(--ease)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div>
            <span className="t-label" style={{ color: "var(--indigo)" }}>
              KAŞİF
            </span>
            <div className="t-h2" style={{ marginTop: 6 }}>
              Yeni Görev
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
          >
            <X size={16} strokeWidth={1.6} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Hedef ülke">
            <select
              className="input"
              value={nat}
              onChange={(e) => setNat(e.target.value)}
            >
              <option value="BR">🇧🇷 Brezilya</option>
              <option value="AR">🇦🇷 Arjantin</option>
              <option value="DE">🇩🇪 Almanya</option>
              <option value="FR">🇫🇷 Fransa</option>
              <option value="TR">🇹🇷 Türkiye</option>
            </select>
          </Field>
          <Field label="Mevki">
            <select
              className="input"
              value={pos}
              onChange={(e) => setPos(e.target.value as Position | "ANY")}
            >
              <option value="GK">GK</option>
              <option value="DEF">DEF</option>
              <option value="MID">MID</option>
              <option value="FWD">FWD</option>
              <option value="ANY">Herhangi</option>
            </select>
          </Field>
          <Field label={`Yaş aralığı · 17-${ageMax}`}>
            <input
              type="range"
              min={20}
              max={35}
              value={ageMax}
              onChange={(e) => setAgeMax(+e.target.value)}
              style={{ accentColor: "var(--accent)" }}
            />
          </Field>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 0",
            }}
          >
            <span style={{ color: "var(--muted)" }}>Maliyet</span>
            <Currency value={500_000} size={14} color="var(--warn)" />
          </div>
          <button
            type="button"
            className="btn btn-primary"
            style={{ justifyContent: "center" }}
            disabled={pending}
            onClick={submit}
          >
            {pending ? "Gönderiliyor…" : "Kaşifi Yolla (~8 saat)"}
          </button>
        </div>
      </div>
    </div>
  );
}
