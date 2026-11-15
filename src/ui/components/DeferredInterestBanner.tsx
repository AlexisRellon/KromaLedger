import { getTodayManila } from "../../core/engine/manilaDate";
import { useReconcileCommand } from "../../state/queries";
import { useUIStore } from "../../state/useUIStore";
import { Button } from "../primitives/controls";

export function DeferredInterestBanner() {
  const interestDeferred = useUIStore((s) => s.interestDeferred);
  const setInterestDeferred = useUIStore((s) => s.setInterestDeferred);
  const reconcileMutation = useReconcileCommand();

  if (!interestDeferred) return null;

  const handleCalculate = () => {
    setInterestDeferred(false);
    reconcileMutation.mutate({ currentDate: getTodayManila(), deferInterest: false });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-neutral-900 bg-[#FEF3C7] px-4 py-3 text-neutral-900 shadow-[2px_2px_0px_#18181B]">
      <p className="text-xs font-bold sm:text-sm">
        Automated interest catch-up is paused while you log missed entries.
      </p>
      <Button size="sm" variant="primary" onClick={handleCalculate} disabled={reconcileMutation.isPending}>
        Calculate Interest
      </Button>
    </div>
  );
}
