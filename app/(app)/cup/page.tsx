import { Trophy } from "lucide-react";
import { requireLeagueContext } from "@/lib/session";
import { loadCupBracket, type CupTie } from "@/lib/queries/cup";

export const dynamic = "force-dynamic";

const ROUND_LABEL: Record<number, string> = {
  1: "Son 16",
  2: "Çeyrek Final",
  3: "Yarı Final",
  4: "FİNAL",
};

export default async function CupPage() {
  const ctx = await requireLeagueContext();
  const { ties, season } = await loadCupBracket(ctx);
  const rounds: CupTie[][] = [[], [], [], []];
  for (const t of ties) rounds[t.round - 1]?.push(t);

  return (
    <div
      style={{
        maxWidth: 1400,
        margin: "0 auto",
        padding: "20px 28px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "color-mix(in oklab, var(--gold) 22%, transparent)",
            color: "var(--gold)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Trophy size={22} strokeWidth={1.6} />
        </div>
        <div>
          <span className="t-label" style={{ color: "var(--gold)" }}>
            KUPA
          </span>
          <div className="t-h1" style={{ marginTop: 4 }}>
            Sezon {season} Kupası
          </div>
          <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
            Tek-eleme, 16 takım. Beraberlik halinde uzatma + penaltı (otomatik).
          </div>
        </div>
      </div>

      {ties.length === 0 ? (
        <div
          style={{
            padding: 32,
            borderRadius: 12,
            background: "var(--panel)",
            border: "1px solid var(--border)",
            textAlign: "center",
            color: "var(--muted)",
          }}
        >
          Bu sezon için kupa eşleşmesi yok.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 18,
            alignItems: "start",
          }}
        >
          {rounds.map((round, idx) => (
            <RoundColumn
              key={idx}
              label={ROUND_LABEL[idx + 1] ?? `R${idx + 1}`}
              ties={round}
              ctxClubId={ctx.club.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RoundColumn({
  label,
  ties,
  ctxClubId,
}: {
  label: string;
  ties: CupTie[];
  ctxClubId: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <span className="t-label" style={{ textAlign: "center" }}>
        {label}
      </span>
      {ties.map((t) => (
        <Tie key={t.id} t={t} ctxClubId={ctxClubId} />
      ))}
    </div>
  );
}

function Tie({ t, ctxClubId }: { t: CupTie; ctxClubId: string }) {
  const youInTie = t.homeId === ctxClubId || t.awayId === ctxClubId;
  return (
    <div
      style={{
        background: youInTie
          ? "color-mix(in oklab, var(--accent) 14%, var(--panel))"
          : "var(--panel)",
        border: youInTie
          ? "1px solid color-mix(in oklab, var(--accent) 50%, var(--border))"
          : "1px solid var(--border)",
        borderRadius: 10,
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <Side
        name={t.homeName}
        short={t.homeShort}
        color={t.homeColor}
        score={t.homeScore}
        isWinner={t.winnerId !== null && t.winnerId === t.homeId}
        isYou={t.homeId === ctxClubId}
      />
      <Side
        name={t.awayName}
        short={t.awayShort}
        color={t.awayColor}
        score={t.awayScore}
        isWinner={t.winnerId !== null && t.winnerId === t.awayId}
        isYou={t.awayId === ctxClubId}
      />
    </div>
  );
}

function Side({
  name,
  short,
  color,
  score,
  isWinner,
  isYou,
}: {
  name: string | null;
  short: string | null;
  color: string | null;
  score: number | null;
  isWinner: boolean;
  isYou: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        opacity: name ? 1 : 0.45,
        fontWeight: isWinner ? 700 : 400,
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: 3,
          background: color ?? "var(--muted)",
          flexShrink: 0,
        }}
      />
      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13 }}>
        {name ?? "—"}
        {isYou && (
          <span
            style={{
              marginLeft: 6,
              fontSize: 9,
              padding: "1px 5px",
              borderRadius: 3,
              background: "color-mix(in oklab, var(--accent) 30%, transparent)",
              color: "var(--accent)",
            }}
          >
            SEN
          </span>
        )}
      </span>
      <span className="t-mono" style={{ fontSize: 12, minWidth: 18, textAlign: "right" }}>
        {score === null ? "—" : score}
      </span>
    </div>
  );
}
