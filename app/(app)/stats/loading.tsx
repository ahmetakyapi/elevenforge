import {
  Skeleton,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonChip,
} from "@/components/ui/skeleton";

export default function StatsLoading() {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 28px 60px" }}>
      <div style={{ marginBottom: 20 }}>
        <Skeleton w={100} h={10} />
        <Skeleton w={260} h={28} style={{ marginTop: 6 }} />
      </div>

      {/* Hero — gold boot + playmaker crowns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          marginBottom: 20,
        }}
      >
        {Array.from({ length: 2 }).map((_, i) => (
          <SkeletonCard key={i} pad={22} minH={160}>
            <SkeletonChip w={130} />
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
              <SkeletonAvatar size={56} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <Skeleton w={160} h={20} />
                <Skeleton w={110} h={12} />
              </div>
              <div style={{ flex: 1 }} />
              <Skeleton w={70} h={32} radius={10} />
            </div>
          </SkeletonCard>
        ))}
      </div>

      {/* Leaderboards grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}
      >
        {Array.from({ length: 4 }).map((_, c) => (
          <SkeletonCard key={c} pad={18}>
            <Skeleton w={120} h={12} />
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "24px 1fr 40px", gap: 8, alignItems: "center", padding: "6px 0" }}>
                <Skeleton w={20} h={10} />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <SkeletonAvatar size={22} />
                  <Skeleton w="70%" h={11} />
                </div>
                <Skeleton w={28} h={14} />
              </div>
            ))}
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}
