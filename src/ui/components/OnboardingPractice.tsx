import { useState } from "react";
import { format } from "date-fns";
import { buildEntryDraft } from "../../state/entryDraft";

type Mode = "EXPENSE" | "TRANSFER" | "SUBSCRIPTION" | "INVOICE";
const field = "mt-1 w-full rounded-xl border-2 border-[#352437] bg-white px-3 py-2 text-base text-[#241927] focus-visible:outline-2 focus-visible:outline-[#4A154B]";

export function OnboardingPractice({ mode, guidance, onCancel, onComplete }: { mode: Mode; guidance: string; onCancel: () => void; onComplete: () => void }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [walletId, setWalletId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [cycle, setCycle] = useState<"WEEKLY" | "MONTHLY" | "YEARLY">("MONTHLY");
  const [direction, setDirection] = useState<"RECEIVABLE" | "PAYABLE">("RECEIVABLE");
  const [error, setError] = useState("");
  const availableWallets = [{ id: "sample-cash", name: "Sample cash wallet" }, { id: "sample-bank", name: "Sample bank wallet" }];
  const needsWallet = mode === "EXPENSE" || mode === "TRANSFER";

  return <form className="mt-4 space-y-3 rounded-xl border-2 border-[#D6C7B9] bg-white p-4" onSubmit={(event) => {
    event.preventDefault();
    setError("");
    try {
      if (needsWallet && !walletId) throw new Error("Choose a wallet.");
      const today = format(new Date(), "yyyy-MM-dd");
      const common = { id: (prefix: string) => `practice-${prefix}`, today, date, title: mode === "TRANSFER" ? "Transfer" : title, amount, currency: "PHP", walletId: needsWallet ? walletId : undefined };
      if (mode === "EXPENSE") buildEntryDraft({ ...common, mode });
      else if (mode === "TRANSFER") buildEntryDraft({ ...common, mode, toWalletId: targetId, channel: "MANUAL" });
      else if (mode === "SUBSCRIPTION") buildEntryDraft({ ...common, mode, cycle, autoLog: false });
      else buildEntryDraft({ ...common, mode, direction, dueDate: date, lines: [], taxRateBps: 0, discountMinor: 0 });
      onComplete();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Check your details and try again."); }
  }}>
    <p className="text-sm font-semibold leading-relaxed text-[#4A154B]">{guidance}</p>
    <p className="text-sm text-[#5f4860]">Practice only: no data or balances will be saved.</p>
    {mode !== "TRANSFER" && <label className="block text-sm font-bold">{mode === "EXPENSE" ? "Description" : mode === "SUBSCRIPTION" ? "Service name" : "Invoice title"}<input className={field} value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={100} /></label>}
    <label className="block text-sm font-bold">Amount (PHP)<input className={field} value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" required placeholder="100.00" /></label>
    <label className="block text-sm font-bold">{mode === "SUBSCRIPTION" ? "Next billing date" : mode === "INVOICE" ? "Due date" : "Date"}<input className={field} type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
    {needsWallet && <label className="block text-sm font-bold">{mode === "TRANSFER" ? "From wallet" : "Paid from"}<select className={field} value={walletId} onChange={(event) => setWalletId(event.target.value)} required><option value="">Choose a PHP wallet</option>{availableWallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}</select></label>}
    {mode === "TRANSFER" && <label className="block text-sm font-bold">To wallet<select className={field} value={targetId} onChange={(event) => setTargetId(event.target.value)} required><option value="">Choose a PHP wallet</option>{availableWallets.filter((wallet) => wallet.id !== walletId).map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}</select></label>}
    {mode === "SUBSCRIPTION" && <label className="block text-sm font-bold">Billing cycle<select className={field} value={cycle} onChange={(event) => setCycle(event.target.value as typeof cycle)}><option value="WEEKLY">Weekly</option><option value="MONTHLY">Monthly</option><option value="YEARLY">Yearly</option></select></label>}
    {mode === "INVOICE" && <label className="block text-sm font-bold">Direction<select className={field} value={direction} onChange={(event) => setDirection(event.target.value as typeof direction)}><option value="RECEIVABLE">Money owed to me</option><option value="PAYABLE">Money I owe</option></select></label>}
    {error && <p role="alert" className="text-sm font-semibold text-[#BE123C]">{error}</p>}
    <div className="flex flex-wrap gap-2"><button type="submit" className="rounded-xl bg-[var(--theme-primary)] px-4 py-2 text-sm font-bold text-[var(--theme-text-on-primary)]">Complete practice</button><button type="button" onClick={onCancel} className="rounded-xl px-4 py-2 text-sm font-bold text-[var(--theme-accent-text)] underline">Cancel</button></div>
  </form>;
}
