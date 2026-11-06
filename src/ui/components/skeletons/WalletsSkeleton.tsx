import { SmokedCard } from "../../primitives";
import {
  Skeleton,
  SkeletonBadge,
  SkeletonButton,
  SkeletonCircle,
} from "../../primitives/Skeleton";

export function WalletsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading wallets overview"
      className="space-y-8 pb-16 animate-entrance"
    >
      {/* 1. Wallet Overview Hero Panel Skeleton */}
      <SmokedCard className="relative overflow-hidden">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-32 rounded" />
              <SkeletonBadge className="h-4 w-20" />
            </div>
            <Skeleton className="h-10 w-56 rounded-xl sm:h-12 sm:w-64" />
            <Skeleton className="h-3.5 w-44 rounded" />
          </div>
          <SkeletonButton className="h-11 w-full sm:w-36 shrink-0" />
        </div>
      </SmokedCard>

      {/* 2. Main 2-Column Section: Stacked Deck & Active Card Inspector */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left Column: Stacked Cards Deck & All Accounts List */}
        <div className="space-y-6">
          {/* Deck Skeleton */}
          <div className="relative">
            <div className="relative aspect-[85.6/53.98] w-full overflow-hidden rounded-[22px] border-2 border-neutral-900 bg-white p-5 shadow-[4px_4px_0px_#18181B]">
              <div className="flex h-full flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded-md" />
                    <Skeleton className="h-3.5 w-28 rounded" />
                  </div>
                  <SkeletonBadge className="h-5 w-24" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-7 w-9 rounded-md border-amber-400/20 bg-amber-400/10" />
                  <Skeleton className="h-3.5 w-40 rounded" />
                </div>
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-2.5 w-16 rounded" />
                    <Skeleton className="h-4 w-32 rounded" />
                  </div>
                  <div className="space-y-1 text-right">
                    <Skeleton className="ml-auto h-2.5 w-12 rounded" />
                    <Skeleton className="ml-auto h-5 w-28 rounded-md" />
                  </div>
                </div>
              </div>
            </div>
            <div className="-mt-3 mx-auto h-4 w-[92%] rounded-b-[18px] border-2 border-neutral-900 bg-[#F4F1EA]" />
          </div>

          {/* All Accounts Grid Card */}
          <SmokedCard>
            <div className="mb-4 flex items-center justify-between">
              <Skeleton className="h-5 w-32 rounded-md" />
              <Skeleton className="h-3.5 w-24 rounded" />
            </div>

            <div className="divide-y-2 divide-neutral-200">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <SkeletonCircle size={36} className="rounded-xl" />
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-28 rounded" />
                        {i === 0 && <SkeletonBadge className="h-4 w-16" />}
                      </div>
                      <Skeleton className="h-3 w-36 rounded" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-20 rounded" />
                </div>
              ))}
            </div>
          </SmokedCard>
        </div>

        {/* Right Column: Active Card Inspector */}
        <div className="space-y-6">
          <SmokedCard>
            <div className="mb-4 flex items-center justify-between">
              <Skeleton className="h-5 w-40 rounded-md" />
              <SkeletonBadge className="h-5 w-20" />
            </div>

            <div className="space-y-4">
              {/* Detailed specs table */}
              <div className="rounded-2xl border-2 border-neutral-900 bg-[#FAF8F5] p-4 space-y-3 shadow-[2px_2px_0px_#18181B]">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-3.5 w-24 rounded" />
                    <Skeleton className="h-3.5 w-32 rounded" />
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <SkeletonButton className="h-10" />
                <SkeletonButton className="h-10" />
              </div>
            </div>
          </SmokedCard>
        </div>
      </div>
    </div>
  );
}
