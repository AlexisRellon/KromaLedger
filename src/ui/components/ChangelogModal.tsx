import { APP_VERSION, RELEASES } from "../../core/engine/appChangelog";
import { useUIStore } from "../../state/useUIStore";
import { Button } from "../primitives/controls";
import { ModalShell } from "../primitives/Modal";

export function ChangelogModal({ onClose }: { onClose: () => void }) {
  const setTab = useUIStore((s) => s.setTab);

  return (
    <ModalShell
      isOpen={true}
      onClose={onClose}
      title="Full Changelog"
      subtitle={`Kaban (KromaLedger) · Current v${APP_VERSION}`}
      maxWidth="lg"
      footer={
        <div className="flex justify-end">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {RELEASES.map((release, idx) => (
          <section
            key={release.version}
            className="rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] p-4 shadow-[2px_2px_0px_var(--shadow-ink)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-[var(--border-ink)] bg-[var(--theme-subtle)] px-2.5 py-0.5 font-mono text-xs font-bold text-[var(--theme-accent-text)]">
                  v{release.version}
                </span>
                {idx === 0 && (
                  <span className="inline-flex items-center rounded-full border border-[var(--border-ink)] bg-[#D9F938] px-2 py-0.5 font-mono text-[10px] font-extrabold uppercase text-neutral-900">
                    Latest
                  </span>
                )}
              </div>
              {release.date && (
                <span className="font-mono text-xs text-[var(--text-muted)]">{release.date}</span>
              )}
            </div>

            <div className="mt-3 space-y-3">
              {release.sections.map((section) => (
                <div key={section.heading}>
                  <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    {section.heading}
                  </p>
                  <ul className="mt-1.5 space-y-1.5 text-xs text-[var(--text-primary)] leading-relaxed">
                    {section.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--theme-accent-text)]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {idx === 0 && (
              <div className="mt-3 flex justify-end border-t border-[var(--border-divider)] pt-3">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onClose();
                    setTab(release.targetTab);
                  }}
                >
                  {release.ctaLabel}
                </Button>
              </div>
            )}
          </section>
        ))}
      </div>
    </ModalShell>
  );
}
