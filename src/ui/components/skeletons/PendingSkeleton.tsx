import { SmokedCard } from "../../primitives";
import {
  Skeleton,
  SkeletonBadge,
  SkeletonCircle,
  SkeletonText,
} from "../../primitives/Skeleton";

export function PendingSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading commitments and pending obligations"
      className="space-y-6 animate-entrance"
    >
      {/* 1. Upcoming 7-day Alert Card Skeleton */}
      <SmokedCard>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Skeleton className="h-7 w-48 rounded-md" />
            <Skeleton className="h-3.5 w-32 rounded" />
          </div>
          <SkeletonBadge className="h-7 w-24" />
        </div>

        <div className="mt-4 divide-y divide-white/[0.06]">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <SkeletonCircle size={32} className="rounded-lg" />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-32 rounded" />
                    <SkeletonBadge className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-3 w-28 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-20 rounded" />
                <SkeletonCircle size={28} className="rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </SmokedCard>

      {/* 2. Bento Row: Fixed Subs Donut + Open Invoices */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left: Fixed Commitments Donut & Active Subs */}
        <SmokedCard className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1.5">
                <Skeleton className="h-7 w-48 rounded-md" />
                <SkeletonText lines={2} className="w-44" lastLineWidth="75%" />
              </div>
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-[10px] border-white/[0.07] bg-transparent">
                <Skeleton className="h-6 w-10 rounded" />
              </div>
            </div>

            <div className="mt-5 border-t border-white/[0.06] pt-4">
              <div className="mb-3 flex items-center justify-between">
                <Skeleton className="h-3.5 w-36 rounded" />
              </div>

              <div className="space-y-2.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5">
                    <div className="space-y-1">
                      <Skeleton className="h-3.5 w-32 rounded" />
                      <Skeleton className="h-2.5 w-24 rounded" />
                    </div>
                    <Skeleton className="h-3.5 w-16 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SmokedCard>

        {/* Right: Open Invoices with Progress Bars */}
        <SmokedCard>
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-40 rounded-md" />
            <div className="flex items-center gap-2">
              <SkeletonBadge className="h-5 w-16" />
              <SkeletonBadge className="h-6 w-24" />
            </div>
          </div>

          <div className="mt-4 divide-y divide-white/[0.06]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="py-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-36 rounded" />
                  <Skeleton className="h-3.5 w-24 rounded" />
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800">
                  <Skeleton
                    className="h-full rounded-full border-none bg-neutral-700/60"
                    style={{ width: `${(i + 1) * 30}%` }}
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <Skeleton className="h-3 w-28 rounded" />
                  <SkeletonCircle size={24} className="rounded" />
                </div>
              </div>
            ))}
          </div>
        </SmokedCard>
      </div>
    </div>
  );
}
