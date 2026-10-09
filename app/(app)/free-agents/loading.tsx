import {
  Skeleton,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonChip,
} from "@/components/ui/skeleton";

export default function FreeAgentsLoading() {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 28px 60px" }}>
      <div style={{ marginBottom: 20 }}>
        <Skeleton w={120} h={10} />
        <Skeleton w={240} h={28} style={{ marginTop: 6 }} />
        <Skeleton w="70%" h={11} style={{ marginTop: 4 }} />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 14,
        }}
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <SkeletonCard key={i} pad={14} minH={150}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <SkeletonAvatar size={38} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                <Skeleton w="70%" h={14} />
                <Skeleton w="40%" h={10} />
              </div>
              <SkeletonChip w={38} />
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <SkeletonChip w={42} />
              <SkeletonChip w={42} />
              <SkeletonChip w={52} />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 8,
              }}
            >
              <Skeleton w={88} h={18} />
              <Skeleton w={80} h={32} radius={8} />
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}
