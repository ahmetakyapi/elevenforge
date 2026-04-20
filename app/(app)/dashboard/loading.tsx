import {
  Skeleton,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonChip,
  SkeletonHeroBlock,
  SkeletonRow,
  SkeletonStatCard,
  SkeletonText,
} from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        padding: "20px 28px",
        maxWidth: 1400,
        margin: "0 auto",
      }}
    >
      {/* Board + sponsor row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <SkeletonCard pad={18} minH={120}>
          <Skeleton w={80} h={10} />
          <Skeleton w="70%" h={20} />
          <Skeleton w="100%" h={6} radius={999} />
          <SkeletonText lines={1} w="85%" />
        </SkeletonCard>
        <SkeletonCard pad={18} minH={120}>
          <Skeleton w={80} h={10} />
          <Skeleton w="60%" h={20} />
          <SkeletonText lines={1} w="90%" />
        </SkeletonCard>
      </div>

      {/* Staff + upgrade row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <SkeletonCard pad={18} minH={120}>
          <Skeleton w={80} h={10} />
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <SkeletonChip w={40} />
                <Skeleton w="100%" h={10} />
              </div>
            ))}
          </div>
        </SkeletonCard>
        <SkeletonCard pad={18} minH={120}>
          <Skeleton w={80} h={10} />
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} pad={12} style={{ flex: 1 }}>
                <Skeleton w={40} h={10} />
                <Skeleton w={32} h={16} />
              </SkeletonCard>
            ))}
          </div>
        </SkeletonCard>
      </div>

      {/* Press widget */}
      <SkeletonCard pad={18} minH={96}>
        <Skeleton w={100} h={10} />
        <SkeletonText lines={2} lastW="70%" />
        <div style={{ display: "flex", gap: 6 }}>
          <SkeletonChip w={110} />
          <SkeletonChip w={140} />
        </div>
      </SkeletonCard>

      {/* Top ribbon */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <SkeletonAvatar size={44} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Skeleton w={160} h={18} />
            <Skeleton w={120} h={11} />
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <SkeletonChip w={110} />
        <SkeletonChip w={80} />
        <SkeletonChip w={90} />
      </div>

      {/* Hero: next match */}
      <SkeletonHeroBlock minH={240} />

      {/* 4 stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 16,
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* Standings table + feed */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)",
          gap: 16,
        }}
      >
        <SkeletonCard pad={20}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div>
              <Skeleton w={90} h={10} />
              <Skeleton w={170} h={16} style={{ marginTop: 6 }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <SkeletonChip w={100} />
              <SkeletonChip w={80} />
            </div>
          </div>
          <div>
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonRow key={i} cols={6} />
            ))}
          </div>
        </SkeletonCard>
        <SkeletonCard pad={20}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Skeleton w={110} h={14} />
            <SkeletonChip w={80} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ display: "flex", gap: 10 }}>
                <SkeletonAvatar size={22} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                  <Skeleton w="90%" h={11} />
                  <Skeleton w="40%" h={9} />
                </div>
              </div>
            ))}
          </div>
        </SkeletonCard>
      </div>
    </div>
  );
}
