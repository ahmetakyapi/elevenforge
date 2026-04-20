import {
  Skeleton,
  SkeletonCard,
  SkeletonRow,
} from "@/components/ui/skeleton";

export default function StandingsLoading() {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 28px 60px" }}>
      <div style={{ marginBottom: 20 }}>
        <Skeleton w={100} h={10} />
        <Skeleton w={220} h={28} style={{ marginTop: 6 }} />
      </div>
      <SkeletonCard pad={18}>
        {Array.from({ length: 16 }).map((_, i) => (
          <SkeletonRow key={i} cols={7} />
        ))}
      </SkeletonCard>
    </div>
  );
}
