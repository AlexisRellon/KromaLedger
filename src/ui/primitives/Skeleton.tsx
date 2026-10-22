import type { HTMLAttributes, PropsWithChildren } from "react";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  rounded?: string;
  animate?: boolean;
}

export function Skeleton({
  className = "",
  rounded = "rounded-xl",
  animate = true,
  children,
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      {...props}
      className={`border border-white/[0.04] bg-white/[0.05] ${
        animate ? "skeleton-shimmer" : ""
      } ${rounded} ${className}`}
    >
      {children}
    </div>
  );
}

export function SkeletonText({
  lines = 1,
  className = "",
  lastLineWidth = "65%",
  lineHeight = "h-3.5",
}: {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
  lineHeight?: string;
}) {
  if (lines <= 1) {
    return <Skeleton className={`${lineHeight} w-full rounded-md ${className}`} />;
  }

  return (
    <div aria-hidden="true" className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => {
        const isLast = i === lines - 1;
        return (
          <Skeleton
            key={i}
            className={`${lineHeight} rounded-md`}
            style={isLast ? { width: lastLineWidth } : { width: "100%" }}
          />
        );
      })}
    </div>
  );
}

export function SkeletonCircle({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Skeleton
      rounded="rounded-full"
      style={{ width: size, height: size }}
      className={`shrink-0 ${className}`}
    />
  );
}

export function SkeletonBadge({
  className = "h-5 w-20",
  rounded = "rounded-full",
}: {
  className?: string;
  rounded?: string;
}) {
  return <Skeleton rounded={rounded} className={`border border-white/10 ${className}`} />;
}

export function SkeletonButton({
  className = "h-11 w-full",
  rounded = "rounded-2xl",
}: {
  className?: string;
  rounded?: string;
}) {
  return (
    <Skeleton
      rounded={rounded}
      className={`border border-[#D9F938]/20 bg-[#D9F938]/[0.08] ${className}`}
    />
  );
}

export function SkeletonCard({
  children,
  className = "",
}: PropsWithChildren<{ className?: string }>) {
  return (
    <section
      aria-hidden="true"
      className={`rounded-3xl border border-white/[.08] bg-white/[.035] p-5.5 shadow-2xl shadow-black/40 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] ${className}`}
    >
      {children}
    </section>
  );
}
