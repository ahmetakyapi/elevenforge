import {
  Skeleton,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonChip,
} from "@/components/ui/skeleton";

export default function TransferLoading() {
  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 28px 60px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <div>
          <Skeleton w={90} h={10} />
          <Skeleton w={200} h={28} style={{ marginTop: 6 }} />
          <Skeleton w={260} h={11} style={{ marginTop: 4 }} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <SkeletonChip w={110} />
          <SkeletonChip w={120} />
        </div>
      </div>

      {/* Filter row */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonChip key={i} w={70 + (i % 3) * 20} />
        ))}
      </div>

      {/* Listings grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 14,
        }}
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonCard key={i} pad={16} minH={180}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <SkeletonAvatar size={40} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                <Skeleton w="70%" h={15} />
                <Skeleton w="40%" h={10} />
              </div>
              <SkeletonChip w={42} />
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <SkeletonChip w={50} />
              <SkeletonChip w={50} />
              <SkeletonChip w={60} />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 8,
              }}
            >
              <Skeleton w={90} h={22} />
              <Skeleton w={70} h={32} radius={8} />
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}
