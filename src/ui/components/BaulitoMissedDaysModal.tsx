import { getTodayManila } from "../../core/engine/manilaDate";
import { useReconcileCommand } from "../../state/queries";
import { useUIStore } from "../../state/useUIStore";
import { Button } from "../primitives/controls";
import { KabanMascot } from "../primitives/KabanMascot";
import { ModalShell } from "../primitives/Modal";

export function BaulitoMissedDaysModal() {
  const missedDays = useUIStore((s) => s.missedInterestDays);
  const setMissedInterestDays = useUIStore((s) => s.setMissedInterestDays);
  const setInterestDeferred = useUIStore((s) => s.setInterestDeferred);
  const openQuickAdd = useUIStore((s) => s.openQuickAdd);
  const reconcileMutation = useReconcileCommand();

  if (missedDays <= 0) return null;

  const handleLogFirst = () => {
    setInterestDeferred(true);
    setMissedInterestDays(0);
    openQuickAdd("INCOME");
  };

  const handlePostNow = () => {
    setInterestDeferred(false);
    setMissedInterestDays(0);
    reconcileMutation.mutate({ currentDate: getTodayManila(), deferInterest: false });
  };

  return (
    <ModalShell
      isOpen={missedDays > 0}
      onClose={handleLogFirst}
      title="Baulito Catch-Up Reminder"
      subtitle={`You missed ${missedDays} ${missedDays === 1 ? "day" : "days"} of activity`}
      maxWidth="md"
    >
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <KabanMascot pose="alert-peek" className="h-20 w-20 shrink-0" />
        <p className="text-sm text-[var(--text-secondary)]">
          Log any missed deposits, transfers, or withdrawals before automated interest runs so your
          estimated daily interest reflects your updated wallet balances.
        </p>
      </div>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={handleLogFirst}>
          Log missed entries first
        </Button>
        <Button variant="primary" onClick={handlePostNow} disabled={reconcileMutation.isPending}>
          Post estimated interest now
        </Button>
      </div>
    </ModalShell>
  );
}
