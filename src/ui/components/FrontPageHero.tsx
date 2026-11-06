import { KabanMascot } from '../primitives/KabanMascot';

interface FrontPageHeroProps {
  userName?: string;
  safeToSpendPhp: number;
  dailyAllowancePhp: number;
  onQuickAdd: () => void;
}

export function FrontPageHero({
  userName = 'Alexis',
  safeToSpendPhp,
  dailyAllowancePhp,
  onQuickAdd,
}: FrontPageHeroProps) {
  const isHealthy = safeToSpendPhp >= 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-[#18181B] bg-[#FAF6F0] p-5 shadow-[4px_4px_0px_#18181B]">
      {/* Subtle Yakan Diamond Weave Watermark */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full text-[#18181B] opacity-[0.03]"
      >
        <rect width="100%" height="100%" fill="url(#pattern-yakan-diamond)" />
      </svg>

      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[#18181B] bg-[#F4C95D] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#18181B]">
              {isHealthy ? '● Kaban Vault Ready' : '● Shortfall Alert'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18181B]">
            Mabuhay, {userName}!
          </h2>

          <p className="text-xs text-neutral-700 max-w-md leading-relaxed">
            {isHealthy ? (
              <>
                Baulito is guarding your ledger. You have{' '}
                <span className="font-mono font-bold text-[#15803D]">
                  ₱{safeToSpendPhp.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>{' '}
                safe to spend (
                <span className="font-mono font-semibold text-[#18181B]">
                  ₱{dailyAllowancePhp.toLocaleString('en-PH', { minimumFractionDigits: 2 })}/day
                </span>
                ) after upcoming commitments.
              </>
            ) : (
              <>
                Heads up! Your scheduled obligations exceed liquid cash by{' '}
                <span className="font-mono font-bold text-[#B91C1C]">
                  ₱{Math.abs(safeToSpendPhp).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
                . Review your wallet runways below.
              </>
            )}
          </p>

          <button
            type="button"
            onClick={onQuickAdd}
            className="mt-1 rounded-full border-2 border-[#18181B] bg-[#18181B] px-3 py-1 font-mono text-[11px] font-bold text-[#FAF6F0] shadow-[2px_2px_0px_#F4C95D] hover:bg-[#27272A] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition cursor-pointer"
          >
            + Log Entry
          </button>
        </div>

        {/* Baulito Front-Page Mascot (Switches between welcome & spent-stop) */}
        <div className="shrink-0 pr-1">
          <KabanMascot pose={isHealthy ? 'welcome' : 'spent-stop'} size={144} />
        </div>
      </div>
    </div>
  );
}
