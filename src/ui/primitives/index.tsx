import { useEffect, useState, type PropsWithChildren } from "react";
export * from "./Skeleton";
export * from "./controls";
export * from "./forms";
export * from "./Modal";
export * from "./ChartFrame";
export * from "./avatarColors";
export * from "./TactileEmptyState";
export * from "./KabanMascot";

import { Button, type ButtonProps } from "./controls";

export function VoltButton({ children, className = "", ...props }: ButtonProps) {
  return (
    <Button
      variant="primary"
      size="md"
      className={`rounded-2xl px-5 py-3.5 font-bold ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
}

export function BrandLogo({
  badgeColor = "gold",
  variant = "color",
  className = "",
}: {
  badgeColor?: "gold" | "plum" | "chestnut" | "white";
  variant?: "color" | "ivory" | "black" | "white";
  className?: string;
} = {}) {
  const isForcedExplicit = variant === "ivory" || variant === "white" || variant === "black";
  const isDark = variant === "ivory" || variant === "white";

  // Neobrutalist emblem badge background & symbol fill
  let badgeClasses = "bg-[#F59E0B] border-[var(--border-ink)] text-[#18181B] shadow-[2px_2px_0px_var(--shadow-ink)]";
  let symbolFill = "#18181B";

  if (badgeColor === "plum") {
    badgeClasses = "bg-[#4A154B] border-[var(--border-ink)] text-[#F5EEDD] shadow-[2px_2px_0px_var(--shadow-ink)]";
    symbolFill = "#F5EEDD";
  } else if (badgeColor === "chestnut") {
    badgeClasses = "bg-[#71452E] border-[var(--border-ink)] text-[#F5EEDD] shadow-[2px_2px_0px_var(--shadow-ink)]";
    symbolFill = "#F5EEDD";
  } else if (badgeColor === "white") {
    badgeClasses = "bg-[var(--bg-card)] border-[var(--border-ink)] text-[var(--text-primary)] shadow-[2px_2px_0px_var(--shadow-ink)]";
    symbolFill = "currentColor";
  }

  if (isDark) {
    badgeClasses = "bg-[#4A154B] border-white/40 text-white shadow-[2px_2px_0px_#000000]";
    symbolFill = "#F5EEDD";
  }

  const wordmarkSrc = isDark
    ? "/kaban-wordmark-ivory.svg"
    : "/kaban-wordmark-black.svg";

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Baulito / Curious Chest */}
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl border-2 ${badgeClasses} transition-all duration-150 shrink-0`}
        aria-hidden="true"
      >
        <span
          className="h-7 w-7"
          style={{
            backgroundColor: symbolFill,
            mask: "url('/kaban-symbol-small.svg') center / contain no-repeat",
            WebkitMask: "url('/kaban-symbol-small.svg') center / contain no-repeat",
          }}
          aria-hidden="true"
        />
      </div>

      {/* 2. Official Bantayog Wordmark from Logo Kit */}
      <div className="flex items-center">
        {isForcedExplicit ? (
          <img
            src={wordmarkSrc}
            alt="Kaban"
            className="h-6 w-auto block select-none pointer-events-none"
            loading="eager"
            decoding="async"
          />
        ) : (
          <>
            <img
              src="/kaban-wordmark-black.svg"
              alt="Kaban"
              className="h-6 w-auto block select-none pointer-events-none dark-hidden"
              loading="eager"
              decoding="async"
            />
            <img
              src="/kaban-wordmark-ivory.svg"
              alt="Kaban"
              className="h-6 w-auto hidden select-none pointer-events-none dark-block"
              loading="eager"
              decoding="async"
            />
          </>
        )}
      </div>
    </div>
  );
}

export function SmokedCard({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return (
    <section className={`rounded-2xl sm:rounded-3xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] p-5.5 shadow-[3px_3px_0px_var(--shadow-ink)] transition-all duration-200 ${className}`}>
      {children}
    </section>
  );
}



export function HatchedProgressBar({ paid, total }: { paid: number; total: number }) {
  const targetPercent = total ? Math.max(0, Math.min(100, (paid / total) * 100)) : 0;
  const [animatedPercent, setAnimatedPercent] = useState(0);

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setAnimatedPercent(targetPercent);
    });
    return () => cancelAnimationFrame(timer);
  }, [targetPercent]);

  return (
    <div className="h-2.5 overflow-hidden rounded-full border-1.5 border-[var(--border-ink)] bg-[var(--bg-muted)]">
      <div
        className="h-full rounded-full bg-[#10B981] transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ width: `${animatedPercent}%` }}
      />
    </div>
  );
}

export function DonutChartSVG({ percent, size = 96 }: { percent: number; size?: number }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const safe = Math.max(0, Math.min(100, percent));
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1000;
    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(ease * safe);
      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [safe]);

  const strokeDashoffset = circumference - (circumference * animatedValue) / 100;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-label={`${safe}% fixed subscriptions`}
      role="img"
    >
      {/* Neobrutalist hard offset shadow ring */}
      <circle cx="52" cy="52" r="44" fill="var(--shadow-ink, #18181B)" />
      {/* Outer & inner crisp ink borders + paper ring track */}
      <circle cx="50" cy="50" r="44" fill="var(--bg-card, #FFFFFF)" stroke="var(--border-ink, #18181B)" strokeWidth="2" />
      <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--bg-muted, #F4F1EA)" strokeWidth="10" />
      {animatedValue > 0.5 && (
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="var(--theme-primary, #4A154B)"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
      )}
      <circle cx="50" cy="50" r="32" fill="var(--bg-card, #FFFFFF)" stroke="var(--border-ink, #18181B)" strokeWidth="2" />
      <text
        x="50"
        y="55"
        textAnchor="middle"
        fill="var(--text-primary, #18181B)"
        fontSize="16"
        className="font-mono font-black tabular-nums"
        fontWeight="900"
      >
        {Math.round(animatedValue)}%
      </text>
    </svg>
  );
}

export function AnimatedProgressBar({ percent }: { percent: number }) {
  const [animatedPercent, setAnimatedPercent] = useState(0);

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setAnimatedPercent(percent);
    });
    return () => cancelAnimationFrame(timer);
  }, [percent]);

  return (
    <div className="h-2.5 overflow-hidden rounded-full border-1.5 border-[var(--border-ink)] bg-[var(--bg-muted)]">
      <div
        className="h-full rounded-full bg-[#10B981] transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ width: `${animatedPercent}%` }}
      />
    </div>
  );
}

export function AnimatedMoney({
  minor,
  prefix = "",
  className = "",
}: {
  minor: number;
  prefix?: string;
  className?: string;
}) {
  const [animatedMinor, setAnimatedMinor] = useState(minor);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1000;
    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimatedMinor(Math.round(ease * minor));
      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [minor]);

  const pesos = (Math.abs(animatedMinor) / 100).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <span className={`font-mono tabular-nums ${className}`.trim()}>
      {prefix}₱{pesos}
    </span>
  );
}

export function StatusDot({ tone = "amber" }: { tone?: "amber" | "green" | "rose" }) {
  const color = tone === "green" ? "bg-[#10B981]" : tone === "rose" ? "bg-[#F43F5E]" : "bg-[#F59E0B]";
  return <span aria-hidden className={`inline-block h-2.5 w-2.5 rounded-full border border-neutral-900 ${color}`} />;
}
