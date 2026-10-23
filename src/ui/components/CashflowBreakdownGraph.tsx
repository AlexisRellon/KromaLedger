import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isSameQuarter,
  isSameWeek,
  isSameYear,
  parseISO,
  startOfWeek,
  subDays,
  subMonths,
  subQuarters,
  subWeeks,
  subYears,
} from "date-fns";
import type { Transaction } from "../../core/models";
import { formatCurrency } from "../../core/models";
import { SmokedCard } from "../primitives";

export type Timeframe = "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";

interface ChartBarData {
  label: string;
  sublabel?: string;
  inflowMinor: number;
  outflowMinor: number;
  netMinor: number;
}

export function CashflowBreakdownGraph({
  transactions,
  currentDate = new Date(),
}: {
  transactions: Transaction[];
  currentDate?: Date;
}) {
  const [timeframe, setTimeframe] = useState<Timeframe>("MONTHLY");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const pillContainerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
    ready: boolean;
  }>({ left: 0, width: 0, ready: false });

  const updateIndicator = () => {
    const container = pillContainerRef.current;
    if (!container) return;
    const activeBtn = container.querySelector<HTMLButtonElement>('[data-active="true"]');
    if (activeBtn) {
      setIndicatorStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
        ready: true,
      });
    }
  };

  useLayoutEffect(() => {
    updateIndicator();
  }, [timeframe]);

  useEffect(() => {
    updateIndicator();
    const frame = requestAnimationFrame(updateIndicator);
    document.fonts?.ready?.then(updateIndicator);

    const container = pillContainerRef.current;
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && container) {
      observer = new ResizeObserver(() => {
        updateIndicator();
      });
      observer.observe(container);
    }
    window.addEventListener("resize", updateIndicator);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", updateIndicator);
    };
  }, [timeframe]);

  const buckets = useMemo((): ChartBarData[] => {
    const getInflow = (txs: Transaction[]) =>
      txs.reduce((sum, t) => sum + (t.type === "TRANSFER" ? 0 : (t.amountMinor > 0 ? t.amountMinor : 0)), 0);
    const getOutflow = (txs: Transaction[]) =>
      txs.reduce((sum, t) => sum + (t.type === "TRANSFER" ? (t.feeMinor ?? 0) : (t.amountMinor < 0 ? -t.amountMinor : 0)), 0);

    if (timeframe === "DAILY") {
      // Last 7 days
      return Array.from({ length: 7 })
        .map((_, i) => {
          const date = subDays(currentDate, 6 - i);
          const dayTx = transactions.filter((t) => isSameDay(parseISO(t.date), date));
          const inflow = getInflow(dayTx);
          const outflow = getOutflow(dayTx);
          return {
            label: format(date, "EEE"),
            sublabel: format(date, "MMM d"),
            inflowMinor: inflow,
            outflowMinor: outflow,
            netMinor: inflow - outflow,
          };
        });
    }

    if (timeframe === "WEEKLY") {
      // Last 5 weeks
      return Array.from({ length: 5 })
        .map((_, i) => {
          const weekDate = subWeeks(currentDate, 4 - i);
          const wStart = startOfWeek(weekDate, { weekStartsOn: 1 });
          const wEnd = endOfWeek(weekDate, { weekStartsOn: 1 });
          const weekTx = transactions.filter((t) => {
            const d = parseISO(t.date);
            return isSameWeek(d, weekDate, { weekStartsOn: 1 });
          });
          const inflow = getInflow(weekTx);
          const outflow = getOutflow(weekTx);
          return {
            label: `W${format(weekDate, "w")}`,
            sublabel: `${format(wStart, "MMM d")} - ${format(wEnd, "d")}`,
            inflowMinor: inflow,
            outflowMinor: outflow,
            netMinor: inflow - outflow,
          };
        });
    }

    if (timeframe === "MONTHLY") {
      // Last 6 months
      return Array.from({ length: 6 })
        .map((_, i) => {
          const mDate = subMonths(currentDate, 5 - i);
          const monthTx = transactions.filter((t) => isSameMonth(parseISO(t.date), mDate));
          const inflow = getInflow(monthTx);
          const outflow = getOutflow(monthTx);
          return {
            label: format(mDate, "MMM"),
            sublabel: format(mDate, "yyyy"),
            inflowMinor: inflow,
            outflowMinor: outflow,
            netMinor: inflow - outflow,
          };
        });
    }

    if (timeframe === "QUARTERLY") {
      // Last 4 quarters
      return Array.from({ length: 4 })
        .map((_, i) => {
          const qDate = subQuarters(currentDate, 3 - i);
          const qTx = transactions.filter((t) => isSameQuarter(parseISO(t.date), qDate));
          const inflow = getInflow(qTx);
          const outflow = getOutflow(qTx);
          return {
            label: `Q${Math.floor(qDate.getMonth() / 3) + 1}`,
            sublabel: format(qDate, "yyyy"),
            inflowMinor: inflow,
            outflowMinor: outflow,
            netMinor: inflow - outflow,
          };
        });
    }

    // YEARLY (Last 3 years)
    return Array.from({ length: 3 })
      .map((_, i) => {
        const yDate = subYears(currentDate, 2 - i);
        const yTx = transactions.filter((t) => isSameYear(parseISO(t.date), yDate));
        const inflow = getInflow(yTx);
        const outflow = getOutflow(yTx);
        return {
          label: format(yDate, "yyyy"),
          sublabel: "Annual",
          inflowMinor: inflow,
          outflowMinor: outflow,
          netMinor: inflow - outflow,
        };
      });
  }, [timeframe, transactions, currentDate]);

  const maxVal = Math.max(
    ...buckets.map((b) => Math.max(b.inflowMinor, b.outflowMinor)),
    100000 // default baseline of ₱1,000 so bars look proportional
  );

  const selectedData = activeIndex !== null ? buckets[activeIndex] : buckets[buckets.length - 1];

  return (
    <SmokedCard>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-white">Cashflow breakdown</h2>
          {selectedData && (
            <div className="mt-1 flex items-baseline gap-3">
              <span className="font-mono text-2xl font-extrabold text-white">
                {selectedData.netMinor >= 0 ? "+" : "−"}
                {formatCurrency(Math.abs(selectedData.netMinor))}
              </span>
              <span className="text-xs text-neutral-400">
                {selectedData.label} ({selectedData.sublabel})
              </span>
            </div>
          )}
        </div>

        {/* Timeframe Selector Pill */}
        <div
          ref={pillContainerRef}
          role="tablist"
          aria-label="Timeframe"
          className="relative inline-flex max-w-full overflow-x-auto scrollbar-none self-start sm:self-auto items-center rounded-full bg-black/40 p-0.5 select-none"
        >
          {indicatorStyle.ready && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-0.5 bottom-0.5 rounded-full bg-[#D9F938] transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-sm shadow-black/40"
              style={{
                left: `${indicatorStyle.left}px`,
                width: `${indicatorStyle.width}px`,
              }}
            />
          )}
          {(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"] as const).map((tf) => (
            <button
              key={tf}
              type="button"
              role="tab"
              aria-selected={timeframe === tf}
              data-active={timeframe === tf}
              onClick={() => {
                setTimeframe(tf);
                setActiveIndex(null);
              }}
              className={`relative z-10 flex shrink-0 items-center justify-center rounded-full px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold tracking-normal transition-colors duration-200 text-center ${
                timeframe === tf
                  ? `text-[#070806] ${!indicatorStyle.ready ? "bg-[#D9F938]" : ""}`
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {tf === "DAILY"
                ? "Day"
                : tf === "WEEKLY"
                ? "Week"
                : tf === "MONTHLY"
                ? "Month"
                : tf === "QUARTERLY"
                ? "Quarter"
                : "Year"}
            </button>
          ))}
        </div>
      </div>


      {/* Bar Chart Visualization with Smooth Morphing Slots */}
      <div className="mt-6 flex h-40 items-end justify-between gap-2 border-b border-white/[0.08] pb-3 sm:gap-4">
        {Array.from({ length: 7 }).map((_, slotIdx) => {
          // If fewer buckets (e.g. 3, 4, 5, 6, 7), align them smoothly
          const bucket = buckets[slotIdx];
          const isSelected = bucket && (activeIndex === slotIdx || (activeIndex === null && slotIdx === buckets.length - 1));
          const inflowPercent = bucket ? Math.min(100, (bucket.inflowMinor / maxVal) * 100) : 0;
          const outflowPercent = bucket ? Math.min(100, (bucket.outflowMinor / maxVal) * 100) : 0;

          return (
            <div
              key={`slot-${slotIdx}`}
              onMouseEnter={() => bucket && setActiveIndex(slotIdx)}
              onClick={() => bucket && setActiveIndex(slotIdx)}
              className={`group flex flex-1 flex-col items-center justify-end h-full transition-opacity duration-300 ${
                bucket ? "cursor-pointer opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <div className="flex w-full items-end justify-center gap-1 sm:gap-1.5 h-32">
                {/* Inflow Bar (White) */}
                <div
                  className={`w-full max-w-[12px] rounded-t-sm transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isSelected ? "bg-white opacity-100" : "bg-white/40 opacity-70 group-hover:opacity-90"
                  }`}
                  style={{
                    height: `${bucket ? Math.max(4, inflowPercent) : 0}%`,
                    transformOrigin: "bottom",
                  }}
                  title={bucket ? `In: ${formatCurrency(bucket.inflowMinor)}` : undefined}
                />
                {/* Outflow Bar (Electric Volt) */}
                <div
                  className={`w-full max-w-[12px] rounded-t-sm transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isSelected ? "bg-[#D9F938] opacity-100" : "bg-[#D9F938]/40 opacity-70 group-hover:opacity-90"
                  }`}
                  style={{
                    height: `${bucket ? Math.max(4, outflowPercent) : 0}%`,
                    transformOrigin: "bottom",
                  }}
                  title={bucket ? `Out: ${formatCurrency(bucket.outflowMinor)}` : undefined}
                />
              </div>

              <span
                className={`mt-2 font-mono text-xs font-medium transition-all duration-300 ${
                  isSelected ? "text-[#D9F938] font-bold" : "text-neutral-400 group-hover:text-neutral-200"
                }`}
              >
                {bucket?.label ?? ""}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend & Summary Details */}
      <div className="mt-3 flex items-center justify-between text-xs text-neutral-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-xs bg-white" />
            <span>Inflows</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-xs bg-[#D9F938]" />
            <span>Outflows</span>
          </div>
        </div>
        {selectedData && (
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="text-white">+{formatCurrency(selectedData.inflowMinor)}</span>
            <span className="text-neutral-400">/</span>
            <span className="text-neutral-200">−{formatCurrency(selectedData.outflowMinor)}</span>
          </div>
        )}
      </div>

    </SmokedCard>
  );
}
