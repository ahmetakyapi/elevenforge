import {
  Skeleton,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonChip,
} from "@/components/ui/skeleton";

export default function PlayerLoading() {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 28px 60px" }}>
      <SkeletonCard pad={22} minH={220}>
        <div style={{ display: "flex", gap: 18 }}>
          <SkeletonAvatar size={84} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <Skeleton w={260} h={28} />
            <Skeleton w={180} h={13} />
            <div style={{ display: "flex", gap: 8 }}>
              <SkeletonChip w={56} />
              <SkeletonChip w={52} />
              <SkeletonChip w={62} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
            <Skeleton w={90} h={32} radius={8} />
            <Skeleton w={120} h={10} />
          </div>
        </div>
      </SkeletonCard>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
        {/* Radar placeholder */}
        <SkeletonCard pad={22} minH={320}>
          <Skeleton w={120} h={12} />
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: 8 }}>
            <Skeleton w={260} h={260} radius="50%" />
          </div>
        </SkeletonCard>
        {/* Attrs list */}
        <SkeletonCard pad={22} minH={320}>
          <Skeleton w={100} h={12} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Skeleton w={80} h={11} />
                <Skeleton w="100%" h={6} radius={999} />
                <Skeleton w={30} h={14} />
              </div>
            ))}
          </div>
        </SkeletonCard>
      </div>
    </div>
  );
}
