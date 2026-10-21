import { useEffect, useState, type ButtonHTMLAttributes, type PropsWithChildren } from "react";

export function BrandLogo() { return <div className="flex items-center gap-1 font-mono text-sm font-bold tracking-[.22em]"><span className="text-white">KROMA</span><span className="font-normal text-neutral-400">LEDGER</span><span aria-hidden className="ml-0.5 h-1.5 w-1.5 rounded-full bg-[#D9F938]" /></div>; }
export function SmokedCard({ children, className = "" }: PropsWithChildren<{ className?: string }>) { return <section className={`rounded-3xl border border-white/[.08] bg-white/[.035] p-5.5 shadow-2xl shadow-black/40 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] transition-all duration-200 hover:border-white/[.12] ${className}`}>{children}</section>; }
export function VoltButton({ children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) { return <button {...props} className={`rounded-2xl bg-[#D9F938] px-5 py-3.5 font-semibold text-[#070806] transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50 ${className}`}>{children}</button>; }

export function HatchedProgressBar({ paid, total }: { paid: number; total: number }) {
  const targetPercent = total ? Math.max(0, Math.min(100, (paid / total) * 100)) : 0;
  const [animatedPercent, setAnimatedPercent] = useState(0);

  useEffect(() => {
    // Start at 0 on mount, then animate to target
    const timer = requestAnimationFrame(() => {
      setAnimatedPercent(targetPercent);
    });
    return () => cancelAnimationFrame(timer);
  }, [targetPercent]);

  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800">
      <div
        className="h-full rounded-full bg-[#D9F938] transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
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
    // Trigger stroke fill and number count-up from 0
    let startTimestamp: number | null = null;
    const duration = 1000;
    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // cubic-bezier(0.16, 1, 0.3, 1) approximation
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
    <svg width={size} height={size} viewBox="0 0 100 100" aria-label={`${safe}% fixed subscriptions`} role="img">
      <circle cx="50" cy="50" r={radius} fill="none" stroke="#262626" strokeWidth="11" />
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="#D9F938"
        strokeWidth="11"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="54" textAnchor="middle" fill="white" fontSize="16" fontFamily="monospace" fontWeight="700">
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
    <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800">
      <div
        className="h-full rounded-full bg-[#D9F938] transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ width: `${animatedPercent}%` }}
      />
    </div>
  );
}

export function AnimatedMoney({ minor }: { minor: number }) {
  const [animatedMinor, setAnimatedMinor] = useState(0);

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

  return <span>₱{pesos}</span>;
}

export function StatusDot({ tone = "amber" }: { tone?: "amber" | "green" | "rose" }) { const color = tone === "green" ? "bg-emerald-400" : tone === "rose" ? "bg-rose-500" : "bg-amber-400"; return <span aria-hidden className={`inline-block h-2 w-2 rounded-full ${color}`} />; }
