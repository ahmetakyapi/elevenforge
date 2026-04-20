import {
  Skeleton,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonChip,
  SkeletonPlayerCard,
} from "@/components/ui/skeleton";

export default function SquadLoading() {
  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 28px 60px" }}>
      {/* SquadHero */}
      <SkeletonCard pad={22} minH={150}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <SkeletonAvatar size={56} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
            <Skeleton w={200} h={22} />
            <Skeleton w={140} h={11} />
          </div>
          <SkeletonChip w={80} />
          <SkeletonChip w={80} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 8 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Skeleton w={60} h={10} />
              <Skeleton w={100} h={22} />
            </div>
          ))}
        </div>
      </SkeletonCard>

      {/* Training slot row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 14px",
          marginTop: 10,
          marginBottom: 12,
          borderRadius: 10,
          background: "color-mix(in oklab, var(--panel-2) 60%, transparent)",
          border: "1px solid var(--border)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 200 }}>
          <Skeleton w={160} h={14} />
          <Skeleton w={220} h={10} />
        </div>
        <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonChip key={i} w={72} />
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginTop: 32,
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonChip key={i} w={80} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Skeleton w={170} h={36} radius={10} />
          <Skeleton w={130} h={36} radius={10} />
          <Skeleton w={70} h={36} radius={10} />
        </div>
      </div>

      {/* Card grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 14,
        }}
      >
        {Array.from({ length: 16 }).map((_, i) => (
          <SkeletonPlayerCard key={i} />
        ))}
      </div>
    </div>
  );
}
