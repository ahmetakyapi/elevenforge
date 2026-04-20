import {
  Skeleton,
  SkeletonAvatar,
  SkeletonCard,
} from "@/components/ui/skeleton";

export default function NewspaperLoading() {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 28px 60px" }}>
      <div style={{ marginBottom: 20 }}>
        <Skeleton w={90} h={10} />
        <Skeleton w={240} h={28} style={{ marginTop: 6 }} />
        <Skeleton w={160} h={11} style={{ marginTop: 4 }} />
      </div>

      {/* Cover */}
      <SkeletonCard pad={28} minH={280} style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <SkeletonAvatar size={72} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            <Skeleton w="85%" h={30} />
            <Skeleton w="60%" h={14} />
          </div>
        </div>
        <Skeleton w="100%" h={6} radius={999} style={{ marginTop: 8 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Skeleton w="95%" h={12} />
          <Skeleton w="90%" h={12} />
          <Skeleton w="70%" h={12} />
        </div>
      </SkeletonCard>

      {/* Two-column: TOTW + scorers/assists */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
        <SkeletonCard pad={18}>
          <Skeleton w={120} h={12} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
              marginTop: 10,
            }}
          >
            {Array.from({ length: 11 }).map((_, i) => (
              <SkeletonCard key={i} pad={10} minH={100}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <SkeletonAvatar size={24} />
                  <Skeleton w={60} h={10} />
                </div>
                <Skeleton w="80%" h={12} />
                <Skeleton w={40} h={16} />
              </SkeletonCard>
            ))}
          </div>
        </SkeletonCard>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {Array.from({ length: 2 }).map((_, c) => (
            <SkeletonCard key={c} pad={18}>
              <Skeleton w={120} h={12} />
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 0",
                  }}
                >
                  <Skeleton w={18} h={10} />
                  <SkeletonAvatar size={22} />
                  <Skeleton w="55%" h={12} />
                  <div style={{ flex: 1 }} />
                  <Skeleton w={28} h={14} />
                </div>
              ))}
            </SkeletonCard>
          ))}
        </div>
      </div>
    </div>
  );
}
