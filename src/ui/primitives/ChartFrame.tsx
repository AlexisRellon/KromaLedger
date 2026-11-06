import type { PropsWithChildren, ReactNode } from "react";
import { SmokedCard } from "./index";

export interface ChartLegendItem {
  color: string;
  label: string;
  border?: string;
}

export function ChartLegend({ items, className = "" }: { items: ChartLegendItem[]; className?: string }) {
  return (
    <div className={`flex items-center gap-4 text-xs ${className}`}>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-xs border border-[var(--border-ink)] shadow-[1px_1px_0px_var(--shadow-ink)]"
            style={{ backgroundColor: item.color, borderColor: item.border || "var(--border-ink)" }}
          />
          <span className="font-bold text-[var(--text-secondary)]">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export interface ChartFrameProps extends PropsWithChildren {
  title: string;
  subtitle?: ReactNode;
  headerAction?: ReactNode;
  legend?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function ChartFrame({
  title,
  subtitle,
  headerAction,
  legend,
  footer,
  className = "",
  children,
}: ChartFrameProps) {
  return (
    <SmokedCard className={`relative overflow-hidden ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <h2 className="font-display text-lg font-black tracking-tight text-[var(--text-primary)] whitespace-nowrap">
          {title}
        </h2>
        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>

      {subtitle && (
        <div className="mt-2 text-xs font-medium text-[var(--text-tertiary)]">
          {subtitle}
        </div>
      )}

      <div className="mt-4">{children}</div>

      {(legend || footer) && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-divider)] pt-3">
          {legend && <div>{legend}</div>}
          {footer && <div>{footer}</div>}
        </div>
      )}
    </SmokedCard>
  );
}
