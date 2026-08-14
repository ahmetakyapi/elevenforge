import { LiveRefresh } from "@/components/dashboard-auto-refresh";
import { Trophy } from "lucide-react";
import { Crest } from "@/components/ui/primitives";
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
      <LiveRefresh intervalMs={60_000} />
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
          data-cup-bracket
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 26,
            alignItems: "stretch",
            // Eight ties at ~86px plus their gaps. Fixing the height is what
            // lets every later round spread evenly across the same span, so a
            // quarter-final sits level with the two ties that feed it.
            minHeight: 8 * 86,
          }}
        >
          {rounds.map((round, idx) => (
            <RoundColumn
              key={idx}
              label={ROUND_LABEL[idx + 1] ?? `R${idx + 1}`}
              ties={round}
              ctxClubId={ctx.club.id}
              isFinal={idx === rounds.length - 1}
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
  isFinal,
}: {
  label: string;
  ties: CupTie[];
  ctxClubId: string;
  isFinal: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span
        className="t-label"
        style={{
          textAlign: "center",
          marginBottom: 14,
          color: isFinal ? "var(--gold)" : undefined,
        }}
      >
        {label}
      </span>
      <div
        className="cup-round"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
          flex: 1,
        }}
      >
        {ties.map((t) => (
          <Tie key={t.id} t={t} ctxClubId={ctxClubId} isFinal={isFinal} />
        ))}
      </div>
    </div>
  );
}

function Tie({
  t,
  ctxClubId,
  isFinal,
}: {
  t: CupTie;
  ctxClubId: string;
  isFinal: boolean;
}) {
  const youInTie = t.homeId === ctxClubId || t.awayId === ctxClubId;
  const decided = t.winnerId !== null;
  return (
    <div
      className="cup-tie"
      data-decided={decided || undefined}
      style={{
        position: "relative",
        background: youInTie
          ? "color-mix(in oklab, var(--accent) 14%, var(--panel))"
          : isFinal && decided
            ? "linear-gradient(150deg, color-mix(in oklab, var(--gold) 18%, var(--panel)), var(--panel))"
            : "var(--panel)",
        border: youInTie
          ? "1px solid color-mix(in oklab, var(--accent) 50%, var(--border))"
          : isFinal
            ? "1px solid color-mix(in oklab, var(--gold) 35%, var(--border))"
            : "1px solid var(--border)",
        borderRadius: 12,
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 5,
      }}
    >
      <Side
        clubId={t.homeId}
        name={t.homeName}
        short={t.homeShort}
        color={t.homeColor}
        color2={t.homeColor2}
        score={t.homeScore}
        isWinner={decided && t.winnerId === t.homeId}
        isLoser={decided && t.winnerId !== t.homeId}
        isYou={t.homeId === ctxClubId}
      />
      <Side
        clubId={t.awayId}
        name={t.awayName}
        short={t.awayShort}
        color={t.awayColor}
        color2={t.awayColor2}
        score={t.awayScore}
        isWinner={decided && t.winnerId === t.awayId}
        isLoser={decided && t.winnerId !== t.awayId}
        isYou={t.awayId === ctxClubId}
      />
    </div>
  );
}

function Side({
  clubId,
  name,
  short,
  color,
  color2,
  score,
  isWinner,
  isLoser,
  isYou,
}: {
  clubId: string | null;
  name: string | null;
  short: string | null;
  color: string | null;
  color2: string | null;
  score: number | null;
  isWinner: boolean;
  isLoser: boolean;
  isYou: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        // A knocked-out club stays legible but stops competing for attention
        // with the one that went through — the bracket should read as a
        // narrowing field, which a uniform list of names cannot.
        opacity: !name ? 0.45 : isLoser ? 0.5 : 1,
        fontWeight: isWinner ? 700 : 500,
      }}
    >
      {clubId && color ? (
        <Crest
          clubId={clubId}
          size={20}
          club={{ color, color2: color2 ?? color, short: short ?? "" }}
        />
      ) : (
        // An undecided slot is waiting on a result, not missing data. A
        // dashed outline read as a rendering fault; a muted question mark
        // reads as "to be confirmed", which is what it is.
        <span
          className="t-mono"
          aria-label="Henüz belli değil"
          style={{
            width: 20,
            height: 20,
            minWidth: 20,
            borderRadius: 6,
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            color: "var(--muted-2)",
            background: "color-mix(in oklab, var(--muted) 12%, transparent)",
          }}
        >
          ?
        </span>
      )}
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
      <span
        className="t-mono"
        style={{
          fontSize: 13,
          minWidth: 18,
          textAlign: "right",
          fontWeight: isWinner ? 800 : 600,
          color: isWinner ? "var(--emerald)" : undefined,
        }}
      >
        {score === null ? "—" : score}
      </span>
    </div>
  );
}
