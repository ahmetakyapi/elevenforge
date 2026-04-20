import {
  Skeleton,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonChip,
} from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 28px 60px" }}>
      {/* Hero */}
      <SkeletonCard pad={24} minH={180}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <SkeletonAvatar size={72} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <Skeleton w={220} h={26} />
            <Skeleton w={150} h={12} />
          </div>
          <SkeletonChip w={120} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginTop: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} pad={14}>
              <Skeleton w={70} h={10} />
              <Skeleton w={80} h={22} />
            </SkeletonCard>
          ))}
        </div>
      </SkeletonCard>

      {/* Trophies */}
      <SkeletonCard pad={18} style={{ marginTop: 14 }}>
        <Skeleton w={140} h={12} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} pad={10} style={{ minWidth: 140 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Skeleton w={34} h={34} radius={8} />
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                  <Skeleton w="70%" h={12} />
                  <Skeleton w="50%" h={10} />
                </div>
              </div>
            </SkeletonCard>
          ))}
        </div>
      </SkeletonCard>

      {/* Owned leagues */}
      <SkeletonCard pad={18} style={{ marginTop: 14 }}>
        <Skeleton w={180} h={12} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <SkeletonAvatar size={32} />
              <Skeleton w="45%" h={13} />
              <div style={{ flex: 1 }} />
              <SkeletonChip w={70} />
              <SkeletonChip w={60} />
            </div>
          ))}
        </div>
      </SkeletonCard>
    </div>
  );
}
