import { LATEST_RELEASE, markAppUpdateSeen } from "../../core/engine/appChangelog";
import { useUIStore } from "../../state/useUIStore";
import { Button } from "../primitives/controls";
import { KabanMascot } from "../primitives/KabanMascot";
import { ModalShell } from "../primitives/Modal";

export function AppUpdateModal({ onReloadUpdate }: { onReloadUpdate?: () => void }) {
  const isOpen = useUIStore((s) => s.appUpdateOpen);
  const swUpdateReady = useUIStore((s) => s.swUpdateReady);
  const closeAppUpdate = useUIStore((s) => s.closeAppUpdate);
  const setTab = useUIStore((s) => s.setTab);

  if (!isOpen) return null;

  const markSeen = () => {
    try {
      markAppUpdateSeen(localStorage, LATEST_RELEASE.version);
    } catch {}
  };

  const handleDismiss = () => {
    markSeen();
    closeAppUpdate();
  };

  const handlePrimaryAction = () => {
    markSeen();
    closeAppUpdate();
    if (swUpdateReady) {
      if (onReloadUpdate) {
        onReloadUpdate();
      } else if (typeof window !== "undefined") {
        window.location.reload();
      }
      return;
    }
    setTab(LATEST_RELEASE.targetTab);
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleDismiss}
      title={`What's New in v${LATEST_RELEASE.version}`}
      subtitle={LATEST_RELEASE.title}
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <KabanMascot pose="celebrate-peso" className="h-20 w-20 shrink-0" />
          <div className="space-y-2">
            <span className="inline-flex items-center rounded-full border border-[var(--border-ink)] bg-[var(--theme-subtle)] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[var(--theme-accent-text)]">
              v{LATEST_RELEASE.version}
            </span>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {LATEST_RELEASE.summary}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] p-3.5 shadow-[2px_2px_0px_var(--shadow-ink)]">
          <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Changelog Highlights
          </p>
          <ul className="space-y-1.5 text-xs text-[var(--text-primary)]">
            {LATEST_RELEASE.highlights.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--theme-accent-text)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={handleDismiss}>
            Dismiss
          </Button>
          <Button type="button" variant="primary" onClick={handlePrimaryAction}>
            {swUpdateReady ? "Reload & Apply Update" : LATEST_RELEASE.ctaLabel}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
