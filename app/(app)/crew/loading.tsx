import {
  Skeleton,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonChip,
} from "@/components/ui/skeleton";

export default function CrewLoading() {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 28px 60px" }}>
      <div style={{ marginBottom: 20 }}>
        <Skeleton w={100} h={10} />
        <Skeleton w={200} h={28} style={{ marginTop: 6 }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}>
        {/* Chat */}
        <SkeletonCard pad={18} minH={520}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  flexDirection: i % 2 === 0 ? "row" : "row-reverse",
                }}
              >
                <SkeletonAvatar size={28} />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    maxWidth: "70%",
                  }}
                >
                  <Skeleton w={70} h={9} />
                  <Skeleton w={140 + (i * 23) % 180} h={38} radius={10} />
                </div>
              </div>
            ))}
          </div>
        </SkeletonCard>

        {/* Feed */}
        <SkeletonCard pad={18} minH={520}>
          <Skeleton w={110} h={12} />
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 10 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{ display: "flex", gap: 10 }}>
                <SkeletonAvatar size={22} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                  <Skeleton w="95%" h={11} />
                  <Skeleton w="35%" h={9} />
                </div>
              </div>
            ))}
          </div>
          <SkeletonChip w={140} />
        </SkeletonCard>
      </div>
    </div>
  );
}
