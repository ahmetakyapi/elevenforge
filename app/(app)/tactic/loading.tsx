import {
  Skeleton,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonChip,
} from "@/components/ui/skeleton";

export default function TacticLoading() {
  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 28px 60px" }}>
      <div style={{ marginBottom: 20 }}>
        <Skeleton w={90} h={10} />
        <Skeleton w={180} h={28} style={{ marginTop: 6 }} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: 18,
        }}
      >
        {/* Pitch + players */}
        <SkeletonCard pad={18} minH={520}>
          {/* Formation picker */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonChip key={i} w={68} />
            ))}
          </div>

          {/* Pitch canvas */}
          <div
            style={{
              position: "relative",
              height: 420,
              marginTop: 14,
              borderRadius: 14,
              background:
                "radial-gradient(ellipse at center, color-mix(in oklab, var(--emerald) 12%, var(--panel-2)), var(--panel-2))",
              border: "1px solid var(--border)",
              overflow: "hidden",
            }}
          >
            {/* 11 player positions faked across the pitch */}
            {[
              { top: "82%", left: "50%" },
              { top: "65%", left: "15%" },
              { top: "65%", left: "38%" },
              { top: "65%", left: "62%" },
              { top: "65%", left: "85%" },
              { top: "42%", left: "25%" },
              { top: "42%", left: "50%" },
              { top: "42%", left: "75%" },
              { top: "18%", left: "22%" },
              { top: "12%", left: "50%" },
              { top: "18%", left: "78%" },
            ].map((pos, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: pos.top,
                  left: pos.left,
                  transform: "translate(-50%,-50%)",
                }}
              >
                <SkeletonAvatar size={46} />
              </div>
            ))}
          </div>

          {/* Dial row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
              marginTop: 12,
            }}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <Skeleton w={70} h={10} />
                <Skeleton w="100%" h={8} radius={999} />
              </div>
            ))}
          </div>
        </SkeletonCard>

        {/* Bench + presets */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <SkeletonCard pad={16} minH={160}>
            <Skeleton w={90} h={10} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <SkeletonAvatar size={28} />
                  <Skeleton w="60%" h={11} />
                  <div style={{ flex: 1 }} />
                  <SkeletonChip w={30} />
                </div>
              ))}
            </div>
          </SkeletonCard>
          <SkeletonCard pad={16} minH={180}>
            <Skeleton w={120} h={10} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <Skeleton w={110} h={13} />
                  <Skeleton w={48} h={22} radius={6} />
                </div>
              ))}
            </div>
          </SkeletonCard>
        </div>
      </div>
    </div>
  );
}
