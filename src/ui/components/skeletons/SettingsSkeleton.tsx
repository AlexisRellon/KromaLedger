import { SmokedCard } from "../../primitives";
import {
  Skeleton,
  SkeletonBadge,
  SkeletonButton,
  SkeletonCircle,
  SkeletonText,
} from "../../primitives/Skeleton";

export function SettingsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading settings and vault profile"
      className="space-y-8 pb-16 animate-entrance"
    >
      {/* 1. Local Profile Section Skeleton */}
      <SmokedCard className="relative overflow-hidden">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <SkeletonCircle size={56} className="rounded-2xl" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-36 rounded-md" />
                <SkeletonBadge className="h-4 w-14" />
              </div>
              <Skeleton className="h-3.5 w-48 rounded" />
              <Skeleton className="h-3 w-56 rounded" />
            </div>
          </div>
          <SkeletonButton className="h-10 w-full sm:w-28 shrink-0" />
        </div>
      </SmokedCard>

      {/* 2. Connected Accounts Section Skeleton */}
      <SmokedCard>
        <div className="mb-4 flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-3.5 w-56 rounded" />
          </div>
          <SkeletonButton className="h-9 w-28 shrink-0" />
        </div>

        <div className="divide-y-2 divide-neutral-200">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <SkeletonCircle size={36} className="rounded-xl" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-40 rounded" />
                </div>
              </div>
              <Skeleton className="h-4 w-20 rounded" />
            </div>
          ))}
        </div>
      </SmokedCard>

      {/* 3. Vault & Storage Section Skeleton */}
      <SmokedCard>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-36 rounded-md" />
            <SkeletonBadge className="h-5 w-24" />
          </div>
          <SkeletonText lines={2} lastLineWidth="80%" />
          <div className="grid grid-cols-2 gap-3 pt-2 sm:w-80">
            <SkeletonButton className="h-10" />
            <SkeletonButton className="h-10" />
          </div>
        </div>
      </SmokedCard>
    </div>
  );
}
