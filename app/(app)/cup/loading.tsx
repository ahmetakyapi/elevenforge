import {
  Skeleton,
  SkeletonAvatar,
  SkeletonCard,
} from "@/components/ui/skeleton";

export default function CupLoading() {
  const roundCols: Array<{ matches: number; label: string }> = [
    { matches: 8, label: "R16" },
    { matches: 4, label: "Çeyrek" },
    { matches: 2, label: "Yarı" },
    { matches: 1, label: "Final" },
  ];
  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 28px 60px" }}>
      <div style={{ marginBottom: 20 }}>
        <Skeleton w={100} h={10} />
        <Skeleton w={200} h={28} style={{ marginTop: 6 }} />
        <Skeleton w={260} h={11} style={{ marginTop: 4 }} />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 18,
          alignItems: "start",
        }}
      >
        {roundCols.map((col, ci) => (
          <div key={ci} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Skeleton w={80} h={10} />
            {Array.from({ length: col.matches }).map((_, i) => (
              <SkeletonCard key={i} pad={12} minH={86}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <SkeletonAvatar size={24} />
                  <Skeleton w={80} h={12} />
                  <div style={{ flex: 1 }} />
                  <Skeleton w={24} h={14} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <SkeletonAvatar size={24} />
                  <Skeleton w={80} h={12} />
                  <div style={{ flex: 1 }} />
                  <Skeleton w={24} h={14} />
                </div>
              </SkeletonCard>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
