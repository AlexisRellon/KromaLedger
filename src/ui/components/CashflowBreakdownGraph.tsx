import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  endOfMonth,
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
import { AnimatedMoney, ChartFrame, ChartLegend, KabanMascot } from "../primitives";

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
  currentDate,
  selectedMonth,
}: {
  transactions: Transaction[];
  currentDate?: Date;
  selectedMonth?: string;
}) {
  const [timeframe, setTimeframe] = useState<Timeframe>("MONTHLY");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const pillContainerRef = useRef<HTMLDivElement>(null);

  const anchorDate = useMemo(() => {
    const baseDate = currentDate ?? new Date();
    if (!selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth)) {
      return baseDate;
    }
    if (format(baseDate, "yyyy-MM") === selectedMonth) {
      return baseDate;
    }
    const parsed = parseISO(`${selectedMonth}-01`);
    if (Number.isNaN(parsed.getTime())) {
      return baseDate;
    }
    return endOfMonth(parsed);
  }, [currentDate, selectedMonth]);

  useEffect(() => {
    setActiveIndex(null);
  }, [selectedMonth, currentDate]);
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
          const date = subDays(anchorDate, 6 - i);
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
          const weekDate = subWeeks(anchorDate, 4 - i);
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
          const mDate = subMonths(anchorDate, 5 - i);
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
          const qDate = subQuarters(anchorDate, 3 - i);
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
        const yDate = subYears(anchorDate, 2 - i);
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
  }, [timeframe, transactions, anchorDate]);

  const maxVal = Math.max(
    ...buckets.map((b) => Math.max(b.inflowMinor, b.outflowMinor)),
    100000 // default baseline of ₱1,000 so bars look proportional
  );

  const selectedData = activeIndex !== null ? buckets[activeIndex] : buckets[buckets.length - 1];

  return (
    <ChartFrame
      title="Cashflow breakdown"
      subtitle={
        selectedData ? (
          <div className="flex flex-wrap items-baseline gap-2.5">
            <span className="font-mono text-2xl font-black text-neutral-900 whitespace-nowrap">
              <AnimatedMoney
                minor={Math.abs(selectedData.netMinor)}
                prefix={selectedData.netMinor >= 0 ? "+" : "−"}
              />
            </span>
            <span className="inline-flex items-center rounded-md border border-neutral-900 bg-neutral-100 px-2 py-0.5 font-mono text-xs font-bold text-neutral-700 whitespace-nowrap shadow-[1px_1px_0px_#18181B]">
              {selectedData.label} ({selectedData.sublabel})
            </span>
            {selectedData.netMinor >= 0 && <KabanMascot pose="saving-up" size={64} />}
          </div>
        ) : null
      }
      headerAction={
        <div
          ref={pillContainerRef}
          role="tablist"
          aria-label="Timeframe"
          className="relative inline-flex max-w-full overflow-x-auto scrollbar-none self-start sm:self-auto items-center rounded-full border-2 border-[var(--border-ink)] bg-[var(--bg-muted)] p-1 select-none shadow-[2px_2px_0px_var(--shadow-ink)]"
        >
          {indicatorStyle.ready && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1 bottom-1 rounded-full border-1.5 border-[var(--border-ink)] bg-[var(--theme-primary)] transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[1px_1px_0px_var(--shadow-ink)]"
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
              className={`relative z-10 flex shrink-0 items-center justify-center rounded-full px-2.5 sm:px-3 py-1 text-[11px] font-bold tracking-normal transition-colors duration-200 text-center cursor-pointer ${
                timeframe === tf
                  ? `text-[var(--theme-text-on-primary)] ${!indicatorStyle.ready ? "bg-[var(--theme-primary)]" : ""}`
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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
      }
      legend={
        <ChartLegend
          items={[
            { color: "#34D399", label: "Inflows" },
            { color: "#FB7185", label: "Outflows" },
          ]}
        />
      }
      footer={
        selectedData ? (
          <div className="flex items-center gap-3 font-mono text-xs font-bold">
            <span className="text-[#047857]">
              <AnimatedMoney minor={selectedData.inflowMinor} prefix="+" />
            </span>
            <span aria-hidden="true" className="text-neutral-400">/</span>
            <span className="text-[#BE123C]">
              <AnimatedMoney minor={selectedData.outflowMinor} prefix="−" />
            </span>
          </div>
        ) : null
      }
    >
      {/* Bar Chart Visualization with Smooth Morphing Slots */}
      <div className="flex h-40 items-end justify-between gap-2 border-b-2 border-neutral-900 pb-3 sm:gap-4">
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
                {/* Inflow Bar (Mint) */}
                <div
                  className={`w-full max-w-[14px] rounded-t-md border border-neutral-900 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isSelected ? "bg-[#34D399] shadow-[1px_1px_0px_#18181B]" : "bg-[#A7F3D0] opacity-80 group-hover:opacity-100"
                  }`}
                  style={{
                    height: `${bucket ? Math.max(6, inflowPercent) : 0}%`,
                    transformOrigin: "bottom",
                  }}
                  title={bucket ? `In: ${formatCurrency(bucket.inflowMinor)}` : undefined}
                />
                {/* Outflow Bar (Pink/Coral) */}
                <div
                  className={`w-full max-w-[14px] rounded-t-md border border-neutral-900 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isSelected ? "bg-[#FB7185] shadow-[1px_1px_0px_#18181B]" : "bg-[#FECDD3] opacity-80 group-hover:opacity-100"
                  }`}
                  style={{
                    height: `${bucket ? Math.max(6, outflowPercent) : 0}%`,
                    transformOrigin: "bottom",
                  }}
                  title={bucket ? `Out: ${formatCurrency(bucket.outflowMinor)}` : undefined}
                />
              </div>

              <span
                className={`mt-2 font-mono text-xs transition-all duration-300 ${
                  isSelected ? "text-[var(--theme-accent-text)] font-black underline underline-offset-2" : "text-neutral-600 font-semibold group-hover:text-neutral-900"
                }`}
              >
                {bucket?.label ?? ""}
              </span>
            </div>
          );
        })}
      </div>
    </ChartFrame>
  );
}
