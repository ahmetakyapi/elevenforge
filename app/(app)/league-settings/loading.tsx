import {
  Skeleton,
  SkeletonCard,
  SkeletonChip,
} from "@/components/ui/skeleton";

export default function LeagueSettingsLoading() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 28px 60px" }}>
      <div style={{ marginBottom: 20 }}>
        <Skeleton w={100} h={10} />
        <Skeleton w={220} h={28} style={{ marginTop: 6 }} />
      </div>

      <SkeletonCard pad={24}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 18 }}>
            <Skeleton w={140} h={11} />
            <Skeleton w="100%" h={40} radius={10} />
            <Skeleton w="75%" h={10} />
          </div>
        ))}
        <div style={{ display: "flex", gap: 8 }}>
          <SkeletonChip w={100} />
          <SkeletonChip w={90} />
        </div>
      </SkeletonCard>
    </div>
  );
}
