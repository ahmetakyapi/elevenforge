import {
  Skeleton,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonChip,
} from "@/components/ui/skeleton";

export default function LobbyLoading() {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>
      <Skeleton w={60} h={10} />
      <Skeleton w={220} h={34} style={{ marginTop: 8 }} />
      <Skeleton w="70%" h={12} style={{ marginTop: 6 }} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginTop: 36,
        }}
      >
        {Array.from({ length: 2 }).map((_, i) => (
          <SkeletonCard key={i} pad={28} minH={220}>
            <Skeleton w={54} h={54} radius={14} />
            <Skeleton w={180} h={22} style={{ marginTop: 14 }} />
            <Skeleton w="90%" h={11} />
            <Skeleton w="70%" h={11} />
          </SkeletonCard>
        ))}
      </div>

      <Skeleton w={80} h={10} style={{ marginTop: 32, marginBottom: 12 }} />
      {Array.from({ length: 2 }).map((_, i) => (
        <SkeletonCard key={i} pad={16} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <SkeletonAvatar size={40} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              <Skeleton w={240} h={15} />
              <Skeleton w={180} h={11} />
              <Skeleton w={260} h={10} />
            </div>
            <SkeletonChip w={90} />
            <Skeleton w={90} h={32} radius={8} />
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}
