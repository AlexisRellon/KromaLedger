import { KabanMascot, type MascotVariant } from "./KabanMascot";

export interface TactileEmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  mascotVariant?: MascotVariant;
}

export function TactileEmptyState({
  message,
  actionLabel,
  onAction,
  mascotVariant = "idle-sleep",
}: TactileEmptyStateProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-[var(--border-subtle)] bg-[var(--bg-subtle)]/75 px-4 py-6 text-center">
      {/* Subtle heritage background watermark */}
      <svg
        aria-hidden="true"
        data-empty-state-watermark="true"
        className="pointer-events-none absolute inset-0 h-full w-full text-[var(--text-primary)] opacity-[0.05]"
      >
        <rect width="100%" height="100%" fill="url(#pattern-tnalak-circuit)" />
      </svg>

      <div className="relative z-10 flex flex-col items-center gap-2.5">
        <KabanMascot variant={mascotVariant} size={88} />
        <p className="text-xs font-medium text-[var(--text-secondary)]">{message}</p>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="rounded-full border-2 border-[var(--border-ink)] bg-[var(--bg-card)] px-3.5 py-1 font-mono text-[11px] font-bold text-[var(--text-primary)] shadow-[2px_2px_0px_var(--shadow-ink)] hover:bg-[var(--bg-muted)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition cursor-pointer"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
