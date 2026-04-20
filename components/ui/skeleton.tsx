import type { CSSProperties, ReactNode } from "react";

/**
 * Base skeleton primitives used by every `loading.tsx` in the app tree.
 * Each server `page.tsx` runs async DB queries, so Next streams a loading
 * state while they resolve — making that state feel structured (rather
 * than a flash of blank page or a generic spinner) is most of the
 * perceived-smoothness win.
 *
 * All variants use the same shimmer keyframe (`skeleton-shimmer` in
 * globals.css) so the whole screen pulses in sync — reads as intentional,
 * not laggy.
 */

type BoxProps = {
  w?: CSSProperties["width"];
  h?: CSSProperties["height"];
  radius?: CSSProperties["borderRadius"];
  style?: CSSProperties;
  className?: string;
};

export function Skeleton({ w, h = 14, radius = 8, style, className }: BoxProps) {
  return (
    <div
      className={`skeleton ${className ?? ""}`}
      style={{ width: w, height: h, borderRadius: radius, ...style }}
      aria-hidden
    />
  );
}

export function SkeletonText({
  lines = 1,
  w = "100%",
  gap = 6,
  lastW,
}: {
  lines?: number;
  w?: CSSProperties["width"];
  gap?: number;
  lastW?: CSSProperties["width"];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          h={12}
          w={i === lines - 1 && lastW ? lastW : w}
          radius={6}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 44 }: { size?: number }) {
  return <Skeleton w={size} h={size} radius="50%" />;
}

export function SkeletonChip({ w = 90 }: { w?: number }) {
  return <Skeleton w={w} h={24} radius={999} />;
}

export function SkeletonCard({
  children,
  pad = 20,
  minH,
  style,
}: {
  children?: ReactNode;
  pad?: number;
  minH?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      className="glass"
      style={{
        padding: pad,
        minHeight: minH,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        ...style,
      }}
      aria-hidden
    >
      {children}
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <SkeletonCard pad={18}>
      <Skeleton w={60} h={10} />
      <Skeleton w={80} h={28} />
      <Skeleton w={120} h={10} />
    </SkeletonCard>
  );
}

export function SkeletonRow({
  cols = 6,
  gap = 10,
}: {
  cols?: number;
  gap?: number;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `32px 1fr ${Array.from({ length: cols - 2 })
          .map(() => "38px")
          .join(" ")} 60px 110px`,
        gap,
        padding: "10px 4px",
        alignItems: "center",
      }}
    >
      <Skeleton w={20} h={12} />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <SkeletonAvatar size={22} />
        <Skeleton w={110} h={12} />
      </div>
      {Array.from({ length: cols - 2 }).map((_, i) => (
        <Skeleton key={i} w={24} h={12} />
      ))}
      <Skeleton w={30} h={12} />
      <div style={{ display: "flex", gap: 3 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} w={18} h={18} radius={4} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonHeroBlock({ minH = 180 }: { minH?: number }) {
  return (
    <SkeletonCard pad={28} minH={minH}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <SkeletonChip w={120} />
        <SkeletonChip w={80} />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          marginTop: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
          }}
        >
          <SkeletonAvatar size={56} />
          <Skeleton w={48} h={12} />
        </div>
        <Skeleton w={32} h={24} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
          }}
        >
          <SkeletonAvatar size={56} />
          <Skeleton w={48} h={12} />
        </div>
      </div>
      <SkeletonText lines={2} lastW="60%" />
    </SkeletonCard>
  );
}

export function SkeletonPlayerCard() {
  return (
    <SkeletonCard pad={14} minH={168}>
      <div
        style={{ display: "flex", justifyContent: "space-between", gap: 10 }}
      >
        <Skeleton w={32} h={18} radius={6} />
        <Skeleton w={40} h={18} radius={6} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
        <Skeleton w="75%" h={16} />
        <Skeleton w="45%" h={11} />
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <SkeletonChip w={50} />
        <SkeletonChip w={40} />
        <SkeletonChip w={56} />
      </div>
    </SkeletonCard>
  );
}

export function SkeletonToolbar() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        marginTop: 20,
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonChip key={i} w={70} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Skeleton w={180} h={36} radius={10} />
        <Skeleton w={120} h={36} radius={10} />
      </div>
    </div>
  );
}
