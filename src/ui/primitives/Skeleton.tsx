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
      className={`border border-neutral-900/20 bg-[#F4F1EA] ${
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
  return <Skeleton rounded={rounded} className={`border border-neutral-900/20 ${className}`} />;
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
      className={`border-2 border-neutral-900 bg-[#FEF3C7] shadow-[2px_2px_0px_#18181B] ${className}`}
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
      className={`rounded-2xl sm:rounded-3xl border-2 border-neutral-900 bg-white p-5.5 shadow-[3px_3px_0px_#18181B] ${className}`}
    >
      {children}
    </section>
  );
}
