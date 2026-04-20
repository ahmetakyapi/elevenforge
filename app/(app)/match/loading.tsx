import {
  Skeleton,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonChip,
} from "@/components/ui/skeleton";

export default function MatchLoading() {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 28px 60px" }}>
      <SkeletonCard pad={26} minH={220}>
        {/* Score header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <SkeletonAvatar size={72} />
            <Skeleton w={110} h={14} />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Skeleton w={120} h={50} radius={12} />
            <Skeleton w={80} h={10} />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <SkeletonAvatar size={72} />
            <Skeleton w={110} h={14} />
          </div>
        </div>

        {/* Stat bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "40px 1fr 90px 1fr 40px", gap: 8, alignItems: "center" }}>
              <Skeleton w={30} h={11} />
              <Skeleton w="100%" h={6} radius={999} />
              <Skeleton w={80} h={10} />
              <Skeleton w="100%" h={6} radius={999} />
              <Skeleton w={30} h={11} />
            </div>
          ))}
        </div>
      </SkeletonCard>

      {/* Commentary feed */}
      <SkeletonCard pad={18} style={{ marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Skeleton w={140} h={14} />
          <SkeletonChip w={90} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Skeleton w={36} h={20} radius={6} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                <Skeleton w={i % 3 === 0 ? "80%" : "95%"} h={12} />
                <Skeleton w={i % 2 === 0 ? "50%" : "65%"} h={10} />
              </div>
            </div>
          ))}
        </div>
      </SkeletonCard>
    </div>
  );
}
