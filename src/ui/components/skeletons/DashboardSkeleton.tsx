import { SmokedCard } from "../../primitives";
import {
  Skeleton,
  SkeletonBadge,
  SkeletonButton,
  SkeletonCircle,
  SkeletonText,
} from "../../primitives/Skeleton";

export function DashboardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading dashboard overview"
      className="grid gap-6 lg:grid-cols-[1.25fr_.75fr] animate-entrance"
    >
      {/* Left Column: Hero, Cashflow Graph, Activity Feed */}
      <div className="space-y-6">
        {/* 1. Financial Hero Card Skeleton */}
        <SmokedCard className="relative overflow-hidden">
          <div className="relative">
            {/* Header: Label & Multi-Wallet Status */}
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-5 w-36 rounded-md" />
                <SkeletonBadge className="h-4 w-16" />
              </div>
              <SkeletonBadge className="h-6 w-28" />
            </div>

            {/* Tier 1: Large Liquid Cash Amount */}
            <div className="mt-3">
              <Skeleton className="h-12 w-64 max-w-[80%] rounded-xl sm:h-14 sm:w-72" />
            </div>

            {/* Tier 2: Velocity Pill */}
            <div className="mt-2.5 flex items-center gap-2">
              <Skeleton className="h-7 w-44 rounded-full border-2 border-neutral-900" />
            </div>

            {/* Tier 3: Subscription-Predicted Cash Box */}
            <div className="mt-4 rounded-2xl border-2 border-neutral-900 bg-[#FAF8F5] p-3.5 shadow-[2px_2px_0px_#18181B]">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-3.5 w-44 rounded-md" />
                <Skeleton className="h-4 w-24 rounded-md" />
              </div>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-neutral-200 border border-neutral-900">
                <Skeleton className="h-full w-2/3 rounded-full border-none bg-neutral-400" />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <Skeleton className="h-3 w-32 rounded-md" />
                <Skeleton className="h-3 w-16 rounded-md" />
              </div>
            </div>

            {/* Quick Add Button */}
            <SkeletonButton className="mt-5 h-12" />
          </div>
        </SmokedCard>

        {/* 2. Cashflow Breakdown Graph Card Skeleton */}
        <SmokedCard>
          {/* Header & Timeframe Pills */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-6 w-44 rounded-md" />
              <Skeleton className="h-3.5 w-32 rounded-md" />
            </div>
            {/* 5 Timeframe Pills: Day, Week, Month, Quarter, Year */}
            <div className="flex items-center gap-1 rounded-full border-2 border-neutral-900 bg-[#F4F1EA] p-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-6 w-12 rounded-full sm:w-14"
                />
              ))}
            </div>
          </div>

          {/* Metrics Summary Strip: Net, Inflow, Outflow */}
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border-2 border-neutral-900 bg-[#FAF8F5] p-3 shadow-[2px_2px_0px_#18181B]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1 text-center">
                <Skeleton className="mx-auto h-3 w-12 rounded" />
                <Skeleton className="mx-auto h-4.5 w-20 rounded" />
              </div>
            ))}
          </div>

          {/* Bar Chart Slot Area */}
          <div className="mt-6 flex h-40 items-end justify-between gap-2 border-b-2 border-neutral-900 pb-3 sm:gap-4">
            {[
              { inH: "55%", outH: "40%" },
              { inH: "75%", outH: "65%" },
              { inH: "35%", outH: "80%" },
              { inH: "60%", outH: "45%" },
              { inH: "85%", outH: "70%" },
              { inH: "45%", outH: "60%" },
              { inH: "90%", outH: "35%" },
            ].map((bar, idx) => (
              <div key={idx} className="flex flex-1 flex-col items-center justify-end h-full">
                <div className="flex w-full items-end justify-center gap-1 sm:gap-1.5 h-32">
                  <Skeleton
                    className="w-full max-w-[12px] rounded-t-sm"
                    style={{ height: bar.inH }}
                  />
                  <Skeleton
                    className="w-full max-w-[12px] rounded-t-sm border-neutral-900 bg-[#FEF3C7]"
                    style={{ height: bar.outH }}
                  />
                </div>
                <Skeleton className="mt-2 h-3 w-8 rounded" />
              </div>
            ))}
          </div>
        </SmokedCard>

        {/* 3. Recent Activity Feed Skeleton */}
        <SmokedCard>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-6 w-36 rounded-md" />
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {["All", "Expenses", "Transfers", "Subs", "Invoices"].map((_, i) => (
                <Skeleton key={i} className="h-6 w-16 rounded-full" />
              ))}
            </div>
          </div>

          {/* Activity Rows */}
          <div className="divide-y-2 divide-neutral-200">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3.5">
                <div className="flex items-center gap-3">
                  {/* Category/Tx Icon */}
                  <SkeletonCircle size={40} className="rounded-2xl" />
                  <div className="space-y-1.5">
                    {/* Merchant / Title */}
                    <Skeleton className="h-4 w-32 rounded sm:w-44" />
                    {/* Date / Metadata */}
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 w-20 rounded" />
                      <SkeletonBadge className="h-4 w-14" />
                    </div>
                  </div>
                </div>
                {/* Amount on Right */}
                <div className="space-y-1 text-right">
                  <Skeleton className="ml-auto h-4 w-20 rounded sm:w-24" />
                  <Skeleton className="ml-auto h-3 w-12 rounded" />
                </div>
              </div>
            ))}
          </div>
        </SmokedCard>
      </div>

      {/* Right Column: Stacked Wallet Deck, Monthly Burn, Top Categories */}
      <div className="space-y-6">
        {/* 1. Stacked Wallet Deck Skeleton */}
        <div className="relative">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-36 rounded" />
              <SkeletonBadge className="h-4 w-12" />
            </div>
            <Skeleton className="h-3.5 w-14 rounded" />
          </div>

          {/* Main Card */}
          <div className="relative aspect-[85.6/53.98] w-full overflow-hidden rounded-[20px] sm:rounded-[22px] border-2 border-neutral-900 bg-white p-4.5 sm:p-5 shadow-[4px_4px_0px_#18181B]">
            {/* Card Content Skeleton */}
            <div className="flex h-full flex-col justify-between">
              {/* Top Row: Institution + Network Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded-md" />
                  <Skeleton className="h-3.5 w-24 rounded" />
                </div>
                <SkeletonBadge className="h-5 w-20" />
              </div>

              {/* Middle Row: EMV Chip + Masked Digits */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-7 w-9 rounded-md border-2 border-neutral-900 bg-[#FEF3C7]" />
                <Skeleton className="h-3.5 w-36 rounded font-mono" />
              </div>

              {/* Bottom Row: Holder Name + Balance */}
              <div className="flex items-end justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-2.5 w-16 rounded" />
                  <Skeleton className="h-3.5 w-28 rounded" />
                </div>
                <div className="space-y-1 text-right">
                  <Skeleton className="ml-auto h-2.5 w-12 rounded" />
                  <Skeleton className="ml-auto h-5 w-28 rounded-md" />
                </div>
              </div>
            </div>
          </div>

          {/* Stacked Under-card Peek */}
          <div className="-mt-3 mx-auto h-4 w-[92%] rounded-b-[18px] border-2 border-neutral-900 bg-[#F4F1EA]" />
        </div>

        {/* 2. Monthly Burn Donut Skeleton */}
        <SmokedCard>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32 rounded-md" />
              <SkeletonText lines={2} className="w-40 sm:w-48" lastLineWidth="80%" />
            </div>
            {/* Donut Ring Skeleton */}
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-[10px] border-neutral-200 bg-transparent">
              <Skeleton className="h-6 w-10 rounded" />
            </div>
          </div>
        </SmokedCard>

        {/* 3. Top Categories Skeleton */}
        <SmokedCard>
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-6 w-36 rounded-md" />
            <Skeleton className="h-3.5 w-14 rounded" />
          </div>

          <div className="space-y-4">
            {[
              { width: "88%", labelW: "w-24", amountW: "w-16" },
              { width: "64%", labelW: "w-32", amountW: "w-20" },
              { width: "42%", labelW: "w-20", amountW: "w-14" },
              { width: "26%", labelW: "w-28", amountW: "w-16" },
            ].map((cat, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <Skeleton className={`h-3.5 ${cat.labelW} rounded`} />
                  <Skeleton className={`h-3.5 ${cat.amountW} rounded`} />
                </div>
                <div className="h-2 overflow-hidden rounded-full border border-neutral-900 bg-neutral-200">
                  <Skeleton
                    className="h-full rounded-full border-none bg-[#4A154B]"
                    style={{ width: cat.width }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SmokedCard>
      </div>
    </div>
  );
}
