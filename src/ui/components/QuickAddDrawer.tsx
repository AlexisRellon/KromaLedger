import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { addDays, format } from "date-fns";
import { calculateInvoice } from "../../core/engine/invoiceCalculator";
import { calculateInstallmentPlan } from "../../core/engine/installmentCalc";
import { KabanMascot } from "../primitives/KabanMascot";
import { addLineItem } from "../../core/engine/lineItemWorkflow";
import { parseMinorInput } from "../../core/engine/moneyInput";
import { convenienceFeeMinor } from "../../core/engine/convenienceFee";
import { buildEntryDraft, ENTRY_FIELD_META } from "../../state/entryDraft";
import { LineItemBuilder, type LineDraft } from "../components/LineItemBuilder";
import { formatCurrency, formatWalletLabel, ALLOWED_ATTACHMENT_MIME_TYPES, attachmentMimeTypeSchema, type TransferChannel } from "../../core/models";
import { detectTransferFee } from "../../core/engine/transferFees";
import { useUIStore, type QuickAddMode, type QuickAddPrefill } from "../../state/useUIStore";
import { useCategories, useSaveCategory, useSaveAttachment, useSaveInvoice, useSaveSubscription, useSaveTransaction, useWallets } from "../../state/queries";
import { saveEntryAndAttachment } from "../../state/entrySaveWorkflow";

const today = () => format(new Date(), "yyyy-MM-dd");
const id = () => crypto.randomUUID();
const TENOR_PRESETS = [3, 6, 9, 12, 24] as const;

export function QuickAddDrawer({
  onClose,
  categories: propCategories,
  prefill: propPrefill,
}: {
  onClose: () => void;
  categories?: Array<{ id: string; name: string; type: string }>;
  prefill?: QuickAddPrefill;
}) {
  const categoriesQuery = useCategories();
  const categories = propCategories ?? categoriesQuery.data ?? [];
  const storeMode = useUIStore((s) => s.quickAddMode);
  const storePrefill = useUIStore((s) => s.quickAddPrefill);
  const currentStore = useUIStore.getState();
  const quickAddPrefill = propPrefill ?? storePrefill ?? currentStore.quickAddPrefill;
  const activeMode: QuickAddMode = quickAddPrefill
    ? "TRANSFER"
    : (storeMode !== "EXPENSE" ? storeMode : currentStore.quickAddMode);
  const [mode, setMode] = useState<QuickAddMode>(activeMode);
  const [amount, setAmount] = useState(
    quickAddPrefill?.amountPhp !== undefined ? quickAddPrefill.amountPhp.toFixed(2) : ""
  );
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [tenorMonths, setTenorMonths] = useState<number>(6);
  const [downpayment, setDownpayment] = useState<number>(0);
  const [manualMonthlyOverride, setManualMonthlyOverride] = useState<number | undefined>(undefined);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(
    storeMode === "INCOME" ? categories.find((c) => c.type === "INCOME" || c.type === "BOTH")?.id ?? "" : categories.find((c) => c.name === "Dining")?.id ?? ""
  );
  const [date, setDate] = useState(today());
  const [cycle, setCycle] = useState<"WEEKLY" | "MONTHLY" | "YEARLY">("MONTHLY");
  const [autoLog, setAutoLog] = useState(true);
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 14), "yyyy-MM-dd"));
  const [direction, setDirection] = useState<"RECEIVABLE" | "PAYABLE">("RECEIVABLE");
  const [error, setError] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [draftLine, setDraftLine] = useState({ description: "", quantity: "1", unitPrice: "" });
  const [taxRateBps, setTaxRateBps] = useState(0);
  const [discountMinor, setDiscountMinor] = useState(0);
  const [savedId, setSavedId] = useState("");
  const [walletId, setWalletId] = useState("");
  const [toWalletId, setToWalletId] = useState(quickAddPrefill?.toWalletId ?? "");
  const [channel, setChannel] = useState<TransferChannel>("INSTAPAY");
  const [feeMinor, setFeeMinor] = useState(0);
  const [feeCustomized, setFeeCustomized] = useState(false);
  const [provider, setProvider] = useState("");
  const [feeMode, setFeeMode] = useState<"FIXED" | "PERCENT">("PERCENT");
  const [feeValue, setFeeValue] = useState("0");
  const [paymentAmount, setPaymentAmount] = useState("");
  const submitting = useRef(false);
  const descriptionInputRef = useRef<HTMLInputElement>(null);

  const walletsQuery = useWallets();
  const wallets = walletsQuery.data ?? [];

  const fromWallet = wallets.find((w) => w.id === walletId);
  const targetWallet = wallets.find((w) => w.id === toWalletId);

  const feeDetection = useMemo(() => {
    return detectTransferFee({
      origin: fromWallet?.institution || fromWallet?.name,
      destination: targetWallet?.institution || targetWallet?.name,
      channel,
    });
  }, [fromWallet, targetWallet, channel]);

  const saveAttachment = useSaveAttachment();
  const saveCategory = useSaveCategory();
  const saveTx = useSaveTransaction();
  const saveSub = useSaveSubscription();
  const saveInv = useSaveInvoice();
  const closeStore = useUIStore((s) => s.closeQuickAdd);

  useEffect(() => {
    return () => {
      useUIStore.setState({ quickAddPrefill: undefined });
    };
  }, []);

  useEffect(() => {
    if (mode !== "INVOICE" && !walletId && wallets.length > 0) {
      const eligible = mode === "CASH_IN" ? wallets.filter((w) => w.type === "CASH") : wallets;
      const targetId = toWalletId || quickAddPrefill?.toWalletId;
      const filtered = targetId && eligible.length > 1 ? eligible.filter((w) => w.id !== targetId) : eligible;
      const def = filtered.find((w) => w.isDefault) ?? filtered[0];
      if (def) setWalletId(def.id);
    }
  }, [wallets, walletId, mode, toWalletId, quickAddPrefill]);

  useEffect(() => {
    if (mode === "TRANSFER" && wallets.length > 1) {
      if (quickAddPrefill?.toWalletId) {
        if (toWalletId !== quickAddPrefill.toWalletId) {
          setToWalletId(quickAddPrefill.toWalletId);
        }
        if (!walletId || walletId === quickAddPrefill.toWalletId) {
          const other = wallets.find((w) => w.id !== quickAddPrefill.toWalletId && w.isDefault)
            ?? wallets.find((w) => w.id !== quickAddPrefill.toWalletId);
          if (other) setWalletId(other.id);
        }
      } else if (!toWalletId || toWalletId === walletId) {
        const other = wallets.find((w) => w.id !== walletId);
        if (other) setToWalletId(other.id);
      }
    }
  }, [mode, wallets, walletId, toWalletId, quickAddPrefill]);

  // Auto-detect and auto-apply transfer fee charge by checking origin to destination
  useEffect(() => {
    if (mode === "TRANSFER" && !feeCustomized) {
      setFeeMinor(feeDetection.feeMinor);
    }
  }, [mode, feeDetection, feeCustomized]);

  // When origin or destination wallet changes, re-arm auto-apply
  const handleOriginChange = (newOriginId: string) => {
    setWalletId(newOriginId);
    setFeeCustomized(false);
  };

  const handleDestinationChange = (newDestId: string) => {
    setToWalletId(newDestId);
    setFeeCustomized(false);
  };

  const handleChannelChange = (newChannel: TransferChannel) => {
    setChannel(newChannel);
    setFeeCustomized(false);
  };

  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      const dining = categories.find((c) => c.name === "Dining")?.id;
      setCategoryId(dining ?? categories[0]?.id ?? "");
    }
  }, [categories, categoryId]);

  const handleModeChange = (m: QuickAddMode) => {
    setMode(m);
    setCategoryId(categories.find((c) => c.type === (m === "INCOME" ? "INCOME" : "EXPENSE") || c.type === "BOTH")?.id ?? "");
    if (m === "CASH_IN") {
      setWalletId(wallets.find((w) => w.type === "CASH")?.id ?? "");
      setToWalletId(wallets.find((w) => w.type === "E_WALLET")?.id ?? "");
      return;
    }
    if (m === "INVOICE") {
      setWalletId("");
    } else if (m === "TRANSFER") {
      if (!walletId && wallets.length > 0) {
        const def = wallets.find((w) => w.isDefault) ?? wallets[0];
        if (def) setWalletId(def.id);
      }
      if (!toWalletId && wallets.length > 1) {
        const other = wallets.find((w) => w.id !== (walletId || wallets[0]?.id));
        if (other) setToWalletId(other.id);
      }
    } else if (wallets.length > 0) {
      const def = wallets.find((w) => w.isDefault) ?? wallets[0];
      if (def) setWalletId(def.id);
    }
  };

  const parsedAmountCents = Math.round((parseFloat(amount) || 0) * 100);
  const previewLines = useMemo(() => {
    if (mode !== "INVOICE") return [];
    if (lines.length > 0) return lines;
    if (draftLine.description.trim() && draftLine.unitPrice.trim()) {
      try {
        const qty = Number(draftLine.quantity);
        const p = parseMinorInput(draftLine.unitPrice);
        if (Number.isFinite(qty) && qty > 0 && p > 0) {
          return [{
            id: "draft-preview",
            description: draftLine.description.trim(),
            quantity: qty,
            unitPriceMinor: p,
          }];
        }
      } catch {
        return [];
      }
    }
    return [];
  }, [mode, lines, draftLine]);

  const invoiceTotals = useMemo(() => {
    if (mode !== "INVOICE" || previewLines.length === 0) return null;
    try {
      return calculateInvoice({
        items: previewLines,
        taxRateBps,
        discountMinor,
        paidMinor: 0,
        dueDate,
        currentDate: today(),
        draft: false,
      });
    } catch {
      return null;
    }
  }, [mode, previewLines, taxRateBps, discountMinor, dueDate]);

  const installmentBreakdown = useMemo(() => {
    const totalAmount = parseFloat(amount) || 0;
    return calculateInstallmentPlan(totalAmount, downpayment, tenorMonths, manualMonthlyOverride);
  }, [amount, downpayment, tenorMonths, manualMonthlyOverride]);

  const isAmountLockedByInvoiceLines = mode === "INVOICE" && previewLines.length > 0;
  const finalCents = mode === "INVOICE" && invoiceTotals ? invoiceTotals.totalMinor : parsedAmountCents;
  const displayedAmount = isAmountLockedByInvoiceLines ? (finalCents / 100).toFixed(2) : amount;

  const filteredCategories = categories.filter((c) => c.type === (mode === "INCOME" ? "INCOME" : "EXPENSE") || c.type === "BOTH");
  const isObligation = mode === "LOAN" || mode === "INSTALLMENT";
  let cashInFee = 0;
  try { cashInFee = convenienceFeeMinor(finalCents, feeMode, feeValue); } catch { /* Submit shows invalid fee errors. */ }

  const close = () => {
    closeStore();
    onClose();
  };

  const saveProgress = useRef({ entrySaved: Boolean(savedId) });

  const submit = async () => {
    if (submitting.current) return;
    setError("");
    setAttempted(true);

    // Auto-commit draft line item if user filled description and price but forgot to click '+'
    let effectiveLines = [...lines];
    if (mode === "INVOICE" && draftLine.description.trim() && draftLine.unitPrice.trim()) {
      try {
        const qty = Number(draftLine.quantity);
        const p = parseMinorInput(draftLine.unitPrice);
        if (Number.isFinite(qty) && qty > 0 && p > 0) {
          effectiveLines = addLineItem(
            effectiveLines,
            {
              description: draftLine.description.trim(),
              quantity: qty,
              unitPriceMinor: p,
            },
            () => crypto.randomUUID()
          );
          setLines(effectiveLines);
          setDraftLine({ description: "", quantity: "1", unitPrice: "" });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Invalid line item entry.");
        return;
      }
    }

    let calculatedFinalCents = finalCents;
    if (mode === "INVOICE" && effectiveLines.length > 0) {
      try {
        const totals = calculateInvoice({
          items: effectiveLines,
          taxRateBps,
          discountMinor,
          paidMinor: 0,
          dueDate,
          currentDate: today(),
          draft: false,
        });
        calculatedFinalCents = totals.totalMinor;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invoice calculation failed.");
        return;
      }
    }

    if (mode === "TRANSFER" || mode === "CASH_IN") {
      if (!walletId || !toWalletId) {
        setError("Select both source and destination accounts.");
        return;
      }
      if (walletId === toWalletId) {
        setError("Source and destination accounts must be different.");
        return;
      }
    }

    const fromWallet = wallets.find((w) => w.id === walletId);
    const targetWallet = wallets.find((w) => w.id === toWalletId);
    const effectiveTitle = title.trim() || (
      mode === "TRANSFER"
        ? `Transfer: ${fromWallet?.name ?? "Account"} → ${targetWallet?.name ?? "Account"}`
        : mode === "CASH_IN" ? `Cash-in: ${provider.trim() || "Cash"} → ${targetWallet?.name ?? "E-wallet"}` : ""
    );

    if (!effectiveTitle || !Number.isSafeInteger(calculatedFinalCents) || calculatedFinalCents <= 0) {
      setError("Add a title and a valid amount above zero.");
      return;
    }
    const entryId = savedId || id();
    const cleanAmountString = (calculatedFinalCents / 100).toFixed(2);

    submitting.current = true;
    try {
      if (mode === "INCOME" && (!fromWallet || fromWallet.currency !== "PHP")) throw new Error("Select a PHP wallet to receive incoming cash.");
      const installmentObligationPhp = Math.max(0, installmentBreakdown.totalPayable - downpayment);
      const installmentMonthlyPhp = Math.min(installmentBreakdown.monthlyAmortization, installmentObligationPhp);

      let effectiveCategoryId = categoryId;
      const categoryName = mode !== "TRANSFER" ? customCategory.trim() : "";
      if (categoryName && !saveProgress.current.entrySaved) {
        const existing = categories.find((category) => category.name.toLowerCase() === categoryName.toLowerCase());
        const category = existing ? { ...existing, type: "BOTH" as const } : { id: id(), name: categoryName, type: "BOTH" as const };
        if (!existing || existing.type !== "BOTH") await saveCategory.mutateAsync(category);
        effectiveCategoryId = category.id;
        setCategoryId(category.id);
        setCustomCategory("");
      }
      const shared = {
        id: (prefix: "transaction" | "subscription" | "invoice" | "item") =>
          prefix === "item" ? id() : entryId,
        today: today(),
        date,
        title: effectiveTitle,
        amount: cleanAmountString,
        currency: "PHP",
        categoryId: effectiveCategoryId || undefined,
        walletId: walletId || undefined,
      };

      const draft =
        mode === "EXPENSE" || mode === "INCOME"
          ? buildEntryDraft({ ...shared, mode })
          : mode === "CASH_IN"
            ? buildEntryDraft({ ...shared, mode, toWalletId, provider, feeMode, feeValue })
          : mode === "LOAN"
            ? buildEntryDraft({ ...shared, mode, paymentAmount, cycle })
          : mode === "INSTALLMENT"
            ? buildEntryDraft({
                ...shared,
                mode,
                amount: installmentObligationPhp.toFixed(2),
                paymentAmount: installmentMonthlyPhp.toFixed(2),
                cycle: "MONTHLY",
              })
          : mode === "TRANSFER"
            ? buildEntryDraft({
                ...shared,
                mode,
                toWalletId,
                feeMinor,
                channel,
              })
            : mode === "SUBSCRIPTION"
              ? buildEntryDraft({ ...shared, mode, cycle, autoLog })
              : buildEntryDraft({
                  ...shared,
                  mode,
                  direction,
                  dueDate,
                  lines: effectiveLines,
                  taxRateBps,
                  discountMinor,
                });

      await saveEntryAndAttachment(
        saveProgress.current,
        async () => {
          if ("transaction" in draft) {
            await saveTx.mutateAsync(draft.transaction);
          } else if ("subscription" in draft) {
            await saveSub.mutateAsync({ ...draft.subscription, walletId: walletId || undefined });
          } else if ("invoice" in draft) {
            await saveInv.mutateAsync({ invoice: draft.invoice, items: draft.items });
          }
          setSavedId(entryId);
        },
        receipt && mode !== "SUBSCRIPTION"
          ? async () => {
              const mimeResult = attachmentMimeTypeSchema.safeParse(receipt.type);
              if (!mimeResult.success) {
                throw new Error("Disallowed file type. Only PNG, JPEG, WEBP, GIF, and PDF are supported.");
              }
              const data = new Uint8Array(await receipt.arrayBuffer());
              await saveAttachment.mutateAsync({
                meta: {
                  id: id(),
                  filename: receipt.name,
                  mimeType: mimeResult.data,
                  size: receipt.size,
                  createdAt: new Date().toISOString(),
                  entityType: mode === "INVOICE" ? "INVOICE" : "TRANSACTION",
                  entityId: entryId,
                },
                data,
              });
            }
          : undefined
      );

      close();
    } catch (e) {
      if (saveProgress.current.entrySaved) setSavedId(entryId);
      setError(
        saveProgress.current.entrySaved
          ? `Entry saved. Receipt could not be attached: ${
              e instanceof Error ? e.message : "storage error"
            }. Select Save Entry to retry the receipt.`
          : e instanceof Error
            ? e.message
            : "Could not save entry."
      );
    } finally {
      submitting.current = false;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const drawerContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/45 p-3 sm:p-4 backdrop-blur-xs"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Quick add entry"
        className="flex max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border-2 border-neutral-900 bg-white shadow-[6px_6px_0px_#18181B] animate-entrance"
      >
        {/* Drawer Header (Fixed) */}
        <div className="shrink-0 flex items-center justify-between border-b-2 border-neutral-900 bg-[#FAF8F5] px-5 py-4 sm:px-7 sm:py-5">
          <h2 className="font-display text-xl sm:text-2xl font-extrabold text-neutral-900">New Entry</h2>
          <button
            onClick={close}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-neutral-900 bg-white text-neutral-900 shadow-[2px_2px_0px_#18181B] transition hover:bg-[#FEF3C7] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#18181B] cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-7">
        {/* Entry modes */}
        <div
          className="mb-6 grid grid-cols-2 gap-1.5 rounded-2xl border-2 border-neutral-900 bg-[#F4F1EA] p-1.5 shadow-[2px_2px_0px_#18181B] sm:grid-cols-4"
        >
          {(["EXPENSE", "INCOME", "TRANSFER", "CASH_IN", "SUBSCRIPTION", "INVOICE", "LOAN", "INSTALLMENT"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleModeChange(m)}
              disabled={Boolean(savedId)}
              aria-pressed={mode === m}
              className={`rounded-xl px-2 py-2 text-xs font-semibold transition-colors text-center cursor-pointer ${
                mode === m
                  ? "border-2 border-[var(--border-ink)] bg-[var(--theme-primary)] text-[var(--theme-text-on-primary)] shadow-[1px_1px_0px_var(--shadow-ink)] font-bold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold hover:bg-[var(--bg-muted)]"
              }`}
            >
              {{ EXPENSE: "Expense", INCOME: "Incoming cash", TRANSFER: "Transfer", CASH_IN: "E-wallet cash-in", SUBSCRIPTION: "Subscription", INVOICE: "Invoice", LOAN: "Loan", INSTALLMENT: "Installment" }[m]}
            </button>
          ))}
        </div>

        {/* Amount Hero */}
        <div className="py-2 text-center">
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-800">
            Amount (PHP) <span className="text-[#BE123C]" aria-hidden="true">*</span>
            <span
              className={`mt-2 flex items-center gap-2 rounded-2xl border-2 px-4 shadow-[3px_3px_0px_#18181B] ${attempted && finalCents <= 0 ? "border-[#BE123C]" : "border-neutral-900"} ${
                isAmountLockedByInvoiceLines
                  ? "bg-[#F7F3EB] cursor-not-allowed"
                  : "bg-[#FAF8F5] focus-within:bg-white focus-within:shadow-[4px_4px_0px_#18181B]"
              }`}
            >
              <span aria-hidden="true" className="text-2xl font-black text-[var(--theme-accent-text)]">₱</span>
              <input
                type="number"
                aria-required="true"
                aria-invalid={attempted && finalCents <= 0}
                inputMode="decimal"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={displayedAmount}
                readOnly={isAmountLockedByInvoiceLines}
                onChange={(e) => !isAmountLockedByInvoiceLines && setAmount(e.target.value)}
                className={`min-w-0 w-full bg-transparent py-3 font-mono text-3xl font-extrabold tabular-nums text-neutral-900 placeholder:text-neutral-600 outline-none sm:text-4xl ${
                  isAmountLockedByInvoiceLines ? "cursor-not-allowed" : ""
                }`}
              />
              {isAmountLockedByInvoiceLines && (
                <span className="shrink-0 rounded-full border border-[#18181B] bg-[#F4C95D] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#18181B]">
                  AUTO-SUMMED ({previewLines.length} {previewLines.length === 1 ? "LINE" : "LINES"})
                </span>
              )}
            </span>
          </label>
          <p className="mt-1.5 text-xs font-bold uppercase tracking-wider text-neutral-700">
            {mode === "INVOICE" && lines.length > 0
              ? `${lines.length} line item${lines.length > 1 ? "s" : ""} calculated`
               : "Enter the amount"}
          </p>
        </div>

        {/* Transfer Configuration Zone */}
        {mode === "CASH_IN" && (
          <div className="my-4 space-y-3 rounded-2xl border-2 border-neutral-900 bg-[#FAF8F5] p-4 text-xs text-neutral-800">
            <p className="font-medium text-neutral-700">The e-wallet receives the amount above. Your cash wallet pays that amount plus the fee.</p>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900">Cash source wallet
              <select aria-label="Cash source wallet" value={walletId} onChange={(e) => setWalletId(e.target.value)} className="mt-1 w-full rounded-xl border-2 border-neutral-900 bg-white p-2.5 text-sm font-medium text-neutral-900 shadow-[2px_2px_0px_#18181B]">
                <option value="">Select cash wallet</option>
                {wallets.filter((w) => w.type === "CASH").map((w) => <option key={w.id} value={w.id}>{formatWalletLabel(w)}</option>)}
              </select>
            </label>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900">E-wallet destination
              <select aria-label="E-wallet destination" value={toWalletId} onChange={(e) => setToWalletId(e.target.value)} className="mt-1 w-full rounded-xl border-2 border-neutral-900 bg-white p-2.5 text-sm font-medium text-neutral-900 shadow-[2px_2px_0px_#18181B]">
                <option value="">Select e-wallet</option>
                {wallets.filter((w) => w.type === "E_WALLET").map((w) => <option key={w.id} value={w.id}>{formatWalletLabel(w)}</option>)}
              </select>
            </label>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900">Cash-in provider
              <input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="e.g. 7-Eleven" className="mt-1 w-full rounded-xl border-2 border-neutral-900 bg-white p-2.5 text-sm font-medium text-neutral-900 placeholder:text-neutral-600 shadow-[2px_2px_0px_#18181B]" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900">Convenience fee
                <select aria-label="Convenience fee type" value={feeMode} onChange={(e) => setFeeMode(e.target.value as typeof feeMode)} className="mt-1 w-full rounded-xl border-2 border-neutral-900 bg-white p-2.5 text-sm font-medium text-neutral-900 shadow-[2px_2px_0px_#18181B]">
                  <option value="PERCENT">Percentage (%)</option><option value="FIXED">Fixed (₱)</option>
                </select>
              </label>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900">{feeMode === "PERCENT" ? "Fee (%)" : "Fee (₱)"}
                <input aria-label="Convenience fee value" inputMode="decimal" value={feeValue} onChange={(e) => setFeeValue(e.target.value)} className="mt-1 w-full rounded-xl border-2 border-neutral-900 bg-white p-2.5 text-sm font-medium text-neutral-900 placeholder:text-neutral-600 shadow-[2px_2px_0px_#18181B]" />
              </label>
            </div>
            <p className="font-bold text-neutral-800">Fee: {formatCurrency(cashInFee)} · Cash paid: {formatCurrency(finalCents + cashInFee)}</p>
          </div>
        )}
        {mode === "LOAN" && (
          <div className="my-4 space-y-3 rounded-2xl border-2 border-neutral-900 bg-[#FAF8F5] p-4 text-xs text-neutral-800">
            <p className="font-medium text-neutral-700">Enter the total outstanding debt above, including any agreed interest. Creating a schedule does not charge your wallet. Record loan funds received separately with Incoming cash.</p>
            <div className="flex items-center gap-2">
              <KabanMascot pose="calculating" size={64} />
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                Baulito is checking the math
              </span>
            </div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900">Scheduled payment (₱)
              <input inputMode="decimal" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="0.00" className="mt-1 w-full rounded-xl border-2 border-neutral-900 bg-white p-2.5 text-sm font-medium text-neutral-900 placeholder:text-neutral-600 shadow-[2px_2px_0px_#18181B]" />
            </label>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900">Payment frequency
              <select value={cycle} onChange={(e) => setCycle(e.target.value as typeof cycle)} className="mt-1 w-full rounded-xl border-2 border-neutral-900 bg-white p-2.5 text-sm font-medium text-neutral-900 shadow-[2px_2px_0px_#18181B]">
                <option value="WEEKLY">Weekly</option><option value="MONTHLY">Monthly</option><option value="YEARLY">Yearly</option>
              </select>
            </label>
            <p className="font-medium text-neutral-700">Record each payment in Pending. The final payment is capped at the remaining balance.</p>
          </div>
        )}
        {mode === "INSTALLMENT" && (
          <div className="my-4 rounded-2xl border-2 border-[#18181B] bg-[#F7F3EB] p-4 space-y-4">
            <p className="text-xs leading-relaxed text-neutral-700 font-medium">
              Enter the total purchase price (or total installment payable) above. If a downpayment is entered, it is deducted immediately and the remaining principal is split across your chosen tenor.
            </p>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#18181B] mb-2">
                TENOR (MONTHS)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {TENOR_PRESETS.map((months) => {
                  const isActive = tenorMonths === months;
                  return (
                    <button
                      key={months}
                      type="button"
                      onClick={() => {
                        setTenorMonths(months);
                        setManualMonthlyOverride(undefined);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl border-2 border-[#18181B] font-mono text-xs font-semibold transition cursor-pointer ${
                        isActive
                          ? "bg-[#B85028] text-white shadow-[2px_2px_0px_#18181B]"
                          : "bg-white text-[#18181B] shadow-[2px_2px_0px_#18181B] hover:bg-neutral-100"
                      }`}
                    >
                      {months}m
                    </button>
                  );
                })}
                <input
                  type="number"
                  min="1"
                  placeholder="Custom"
                  value={TENOR_PRESETS.includes(tenorMonths as (typeof TENOR_PRESETS)[number]) ? "" : tenorMonths || ""}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (Number.isFinite(val) && val > 0) {
                      setTenorMonths(val);
                    } else if (e.target.value === "") {
                      setTenorMonths(0);
                    }
                    setManualMonthlyOverride(undefined);
                  }}
                  className={`w-20 px-2.5 py-1.5 rounded-xl border-2 border-[#18181B] font-mono text-xs font-semibold outline-none shadow-[2px_2px_0px_#18181B] ${
                    !TENOR_PRESETS.includes(tenorMonths as (typeof TENOR_PRESETS)[number]) && tenorMonths > 0
                      ? "bg-[#B85028] text-white placeholder:text-neutral-200"
                      : "bg-white text-[#18181B] placeholder:text-neutral-500"
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#18181B] mb-1">
                  DOWNPAYMENT (₱)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={downpayment || ""}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setDownpayment(Number.isFinite(val) && val >= 0 ? val : 0);
                  }}
                  placeholder="0.00"
                  className="w-full rounded-xl border-2 border-[#18181B] bg-white px-3 py-2 font-mono tabular-nums text-sm text-[#18181B] shadow-[2px_2px_0px_#18181B] outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#18181B] mb-1">
                  MONTHLY AMORTIZATION (₱)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={manualMonthlyOverride !== undefined ? manualMonthlyOverride : (installmentBreakdown.monthlyAmortization || "")}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setManualMonthlyOverride(Number.isFinite(val) && val >= 0 ? val : undefined);
                  }}
                  placeholder="0.00"
                  className="w-full rounded-xl border-2 border-[#18181B] bg-white px-3 py-2 font-mono tabular-nums text-sm text-[#18181B] shadow-[2px_2px_0px_#18181B] outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <KabanMascot pose="calculating" size={64} />
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                Baulito is checking the math
              </span>
            </div>
            <div className="rounded-xl border-2 border-[#18181B] bg-white p-3 space-y-1.5 text-xs shadow-[2px_2px_0px_#18181B]">
              <div className="flex justify-between text-neutral-600 font-semibold">
                <span>Financed Principal:</span>
                <span className="font-mono tabular-nums text-[#18181B]">₱{installmentBreakdown.financedPrincipal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-600 font-semibold">
                <span>Monthly Cutoff (x {tenorMonths} mos):</span>
                <span className="font-mono tabular-nums text-[#18181B]">₱{installmentBreakdown.monthlyAmortization.toFixed(2)} × {tenorMonths} mos</span>
              </div>
              {installmentBreakdown.impliedInterest > 0 && (
                <div className="flex justify-between text-amber-800 font-bold">
                  <span>Implied Interest:</span>
                  <span className="font-mono tabular-nums">+₱{installmentBreakdown.impliedInterest.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-neutral-200 pt-1.5 flex justify-between font-extrabold text-[#18181B]">
                <span>Total Installment Cost:</span>
                <span className="font-mono tabular-nums text-[var(--theme-accent-text)]">₱{installmentBreakdown.totalPayable.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
        {mode === "TRANSFER" && (
          <div className="my-4 space-y-3.5 rounded-2xl border-2 border-neutral-900 bg-[#FAF8F5] p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Source Account */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-900">
                  Transfer From
                </label>
                <select
                  value={walletId}
                  onChange={(e) => handleOriginChange(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border-2 border-neutral-900 bg-white px-3 py-2 text-xs font-semibold text-neutral-900 shadow-[2px_2px_0px_#18181B] outline-none"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id} className="bg-white text-neutral-900">
                      {formatWalletLabel(w)} ({formatCurrency(w.balanceMinor, w.currency)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination Account */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-900">
                  Transfer To
                </label>
                <select
                  value={toWalletId}
                  onChange={(e) => handleDestinationChange(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border-2 border-neutral-900 bg-white px-3 py-2 text-xs font-semibold text-neutral-900 shadow-[2px_2px_0px_#18181B] outline-none"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id} disabled={w.id === walletId} className="bg-white text-neutral-900">
                      {formatWalletLabel(w)} ({formatCurrency(w.balanceMinor, w.currency)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-neutral-200">
              {/* Channel Selector */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-900">
                  Transfer Channel
                </label>
                <div className="mt-1.5 flex rounded-lg border-2 border-neutral-900 bg-[#F4F1EA] p-1 shadow-[1px_1px_0px_#18181B]">
                  {(["INSTAPAY", "PESONET"] as const).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => handleChannelChange(ch)}
                      className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition cursor-pointer ${
                        channel === ch
                          ? "border border-[var(--border-ink)] bg-[var(--bg-card)] text-[var(--text-primary)] shadow-[1px_1px_0px_var(--shadow-ink)]"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold hover:bg-[var(--bg-muted)]"
                      }`}
                    >
                      {ch === "INSTAPAY" ? "InstaPay" : "PESONet"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transfer Fee */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-900">
                    Transfer Fee (₱)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-[var(--theme-accent-text)]">
                      {feeDetection.reason}
                    </span>
                    {feeCustomized && (
                      <button
                        type="button"
                        onClick={() => {
                          setFeeCustomized(false);
                          setFeeMinor(feeDetection.feeMinor);
                        }}
                        className="text-[10px] font-bold text-[#0369A1] hover:underline cursor-pointer"
                        title="Re-apply auto-detected fee"
                      >
                        (Reset)
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={(feeMinor / 100).toString()}
                  onChange={(e) => {
                    setFeeCustomized(true);
                    const val = parseFloat(e.target.value);
                    setFeeMinor(Number.isFinite(val) && val >= 0 ? Math.round(val * 100) : 0);
                  }}
                  className="mt-1.5 w-full rounded-xl border-2 border-neutral-900 bg-white px-3 py-1.5 text-xs font-mono font-semibold text-neutral-900 shadow-[2px_2px_0px_#18181B] outline-none"
                />
              </div>
            </div>

            {/* Live Transfer Calculation Summary */}
            <div className="mt-2 rounded-xl bg-white border-2 border-neutral-900 p-3 text-xs text-neutral-800 shadow-[2px_2px_0px_#18181B] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-neutral-600 font-semibold">Transfer Principal:</span>
                <span className="font-mono font-bold text-neutral-900">₱{(finalCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 font-semibold">Transfer Fee:</span>
                <span className="font-mono font-bold text-neutral-900">₱{(feeMinor / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-1 font-semibold">
                <span className="text-neutral-900 font-extrabold">Total Deducted from {fromWallet?.name || "Source"}:</span>
                <span className="font-mono text-[var(--theme-accent-text)] text-base font-extrabold">₱{((finalCents + feeMinor) / 100).toFixed(2)}</span>
              </div>
            </div>

            {/* Receipt / Screenshot Attachment for Transfer */}
            <div className="pt-1 flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl border-2 border-neutral-900 bg-white px-3.5 py-2 text-xs font-bold text-neutral-900 shadow-[2px_2px_0px_#18181B] transition hover:bg-[#FAF8F5]">
                <svg className="h-3.5 w-3.5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.373L8.557 18.315a1.5 1.5 0 1 1-2.121-2.121l9.879-9.879" />
                </svg>
                <span>{receipt ? receipt.name : "Attach transfer receipt / screenshot"}</span>
                <input
                  type="file"
                  accept={ALLOWED_ATTACHMENT_MIME_TYPES.join(",")}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) {
                      setReceipt(null);
                      return;
                    }
                    if (!attachmentMimeTypeSchema.safeParse(file.type).success) {
                      setError("Only PNG, JPEG, WEBP, GIF, and PDF files are supported.");
                      e.target.value = "";
                      setReceipt(null);
                      return;
                    }
                    setReceipt(file);
                  }}
                />
              </label>
            </div>
          </div>
        )}

        {/* Category & Receipt Pills (Expense & Invoice) */}
        {mode !== "TRANSFER" && (
          <div className="my-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {filteredCategories.map((c) => {
              const catName = c.name.toLowerCase();
              return (
                <button
                  key={c.id}
                  onClick={() => { setCategoryId(c.id); setCustomCategory(""); }}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                    categoryId === c.id
                      ? "border-2 border-neutral-900 bg-[var(--theme-primary)] text-[var(--theme-text-on-primary)] font-bold shadow-[2px_2px_0px_#18181B]"
                      : "border-2 border-neutral-900 bg-white text-neutral-800 font-bold shadow-[2px_2px_0px_#18181B] hover:bg-[#FAF8F5]"
                  }`}
                >
                  {catName.includes("dining") || catName.includes("food") ? (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                    </svg>
                  ) : catName.includes("util") || catName.includes("power") ? (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                    </svg>
                  ) : catName.includes("service") || catName.includes("work") ? (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
                    </svg>
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                    </svg>
                  )}
                  <span>{c.name}</span>
                </button>
              );
            })}
            {mode !== "SUBSCRIPTION" && (
              <label className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-neutral-900 bg-white px-3.5 py-1.5 text-xs font-bold text-neutral-800 shadow-[2px_2px_0px_#18181B] transition hover:bg-[#FAF8F5]">
                <svg className="h-3.5 w-3.5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.373L8.557 18.315a1.5 1.5 0 1 1-2.121-2.121l9.879-9.879" />
                </svg>
                <span>{receipt ? receipt.name : "Attach receipt"}</span>
                <input
                  type="file"
                  accept={ALLOWED_ATTACHMENT_MIME_TYPES.join(",")}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) {
                      setReceipt(null);
                      return;
                    }
                    if (!attachmentMimeTypeSchema.safeParse(file.type).success) {
                      setError("Only PNG, JPEG, WEBP, GIF, and PDF files are supported.");
                      e.target.value = "";
                      setReceipt(null);
                      return;
                    }
                    setReceipt(file);
                  }}
                />
              </label>
            )}
          </div>
        )}

        {mode !== "TRANSFER" && (
          <div className="my-4">
            {showCustomCategory ? (
              <input aria-label="New custom category" placeholder="e.g. SavingInterest" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} disabled={Boolean(savedId)} className="rounded-xl border-2 border-neutral-900 bg-white px-3 py-2 text-xs shadow-[2px_2px_0px_#18181B]" />
            ) : (
              <button type="button" disabled={Boolean(savedId)} onClick={() => setShowCustomCategory(true)} className="rounded-full border-2 border-[#18181B] bg-[var(--theme-subtle)] px-3.5 py-1.5 text-xs font-bold text-[var(--theme-subtle-text)] shadow-[2px_2px_0px_#18181B]">+ Custom Category</button>
            )}
          </div>
        )}

        {/* Wallet / Source Selector (Non-Transfer) */}
        {mode !== "TRANSFER" && mode !== "CASH_IN" && wallets.length > 0 && (
          <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 shrink-0">
              {mode === "INCOME" ? "Credit to:" : isObligation ? "Repayment wallet:" : "Paid with:"}
            </span>
            {mode === "INVOICE" && (
              <button
                type="button"
                onClick={() => setWalletId("")}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                  !walletId
                    ? "border-2 border-neutral-900 bg-[var(--theme-primary)] text-[var(--theme-text-on-primary)] font-bold shadow-[2px_2px_0px_#18181B]"
                    : "border-2 border-neutral-900 bg-white text-neutral-800 font-bold shadow-[2px_2px_0px_#18181B] hover:bg-[#FAF8F5]"
                }`}
              >
                <span>Unpaid (Due Later)</span>
              </button>
            )}
            {wallets.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => setWalletId(w.id)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                  walletId === w.id
                    ? "border-2 border-neutral-900 bg-[var(--theme-primary)] text-[var(--theme-text-on-primary)] font-bold shadow-[2px_2px_0px_#18181B]"
                    : "border-2 border-neutral-900 bg-white text-neutral-800 font-bold shadow-[2px_2px_0px_#18181B] hover:bg-[#FAF8F5]"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full border border-neutral-900"
                  style={{ backgroundColor: w.color || "#F59E0B" }}
                />
                <span>{formatWalletLabel(w)}</span>
              </button>
            ))}
          </div>
        )}

        {/* Dynamic Morphing Middle Zone */}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-900">
            {ENTRY_FIELD_META[mode].titleLabel} {mode !== "TRANSFER" && mode !== "CASH_IN" && <span className="text-[#BE123C]" aria-hidden="true">*</span>}
            <input
              aria-required={mode !== "TRANSFER" && mode !== "CASH_IN"}
              aria-invalid={attempted && mode !== "TRANSFER" && mode !== "CASH_IN" && !title.trim()}
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && mode === "INVOICE") {
                  e.preventDefault();
                  descriptionInputRef.current?.focus();
                }
              }}
              placeholder={ENTRY_FIELD_META[mode].titlePlaceholder}
              className="mt-1.5 w-full rounded-xl border-2 border-neutral-900 bg-white px-3.5 py-3 text-sm text-neutral-900 placeholder:text-neutral-600 outline-none transition focus:border-[#4A154B] focus:ring-1 focus:ring-[#4A154B] aria-[invalid=true]:border-[#BE123C]"
            />
          </label>

          {mode === "INVOICE" ? (
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              {ENTRY_FIELD_META[mode].dateLabel}
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    descriptionInputRef.current?.focus();
                  }
                }}
                className="mt-1.5 w-full rounded-xl border-2 border-neutral-900 bg-white px-3.5 py-3 text-sm text-neutral-900 placeholder:text-neutral-600 outline-none transition focus:border-[#4A154B]"
              />
            </label>
          ) : (
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              {ENTRY_FIELD_META[mode].dateLabel}
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border-2 border-neutral-900 bg-white px-3.5 py-3 text-sm text-neutral-900 placeholder:text-neutral-600 outline-none transition focus:border-[#4A154B]"
              />
            </label>
          )}
        </div>

        {/* Subscription Mode Options */}
        {mode === "SUBSCRIPTION" && (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border-2 border-neutral-900 bg-[#F4F1EA] p-3 shadow-[1px_1px_0px_#18181B]">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              BILLING CYCLE
              <select
                value={cycle}
                onChange={(e) => setCycle(e.target.value as typeof cycle)}
                className="ml-2 rounded-lg border-2 border-neutral-900 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 outline-none shadow-[1px_1px_0px_#18181B]"
              >
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </label>
            <label className="ml-auto flex items-center gap-2 text-xs font-bold text-neutral-800">
              <input
                type="checkbox"
                checked={autoLog}
                onChange={(e) => setAutoLog(e.target.checked)}
                className="h-4 w-4 rounded border-2 border-neutral-900 accent-[var(--theme-primary)]"
              />
              Auto-log on due date
            </label>
          </div>
        )}

        {/* Invoice Mode Options */}
        {mode === "INVOICE" && (
          <div className="mt-3 space-y-3">
            <div className="flex gap-2">
              {(["RECEIVABLE", "PAYABLE"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDirection(d)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wider transition cursor-pointer ${
                    direction === d
                      ? "border-2 border-neutral-900 bg-[var(--theme-primary)] text-[var(--theme-text-on-primary)] font-bold shadow-[2px_2px_0px_#18181B]"
                      : "border-2 border-neutral-900 bg-white text-neutral-800 font-bold shadow-[2px_2px_0px_#18181B] hover:bg-[#FAF8F5]"
                  }`}
                >
                  {d === "RECEIVABLE" ? "Receivable (+)" : "Payable (−)"}
                </button>
              ))}
            </div>

            <LineItemBuilder
              lines={lines}
              onChange={setLines}
              taxRateBps={taxRateBps}
              discountMinor={discountMinor}
              onTaxChange={setTaxRateBps}
              onDiscountChange={setDiscountMinor}
              dueDate={dueDate}
              draft={draftLine}
              onDraftChange={setDraftLine}
              descriptionInputRef={descriptionInputRef}
            />
          </div>
        )}

        </div>

        {/* Save Entry CTA Footer (Fixed) */}
        <div className="shrink-0 border-t-2 border-neutral-900 bg-[#FAF8F5] px-5 py-3.5 sm:px-7 sm:py-4">
          {error && (
            <p role="alert" className="mb-2 text-center text-xs font-bold text-[#BE123C]">
              {error}
            </p>
          )}
          <button
            onClick={() => void submit()}
            disabled={saveTx.isPending || saveSub.isPending || saveInv.isPending || saveCategory.isPending}
            className="w-full rounded-2xl border-2 border-neutral-900 bg-[var(--theme-primary)] py-3.5 sm:py-4 font-extrabold text-[var(--theme-text-on-primary)] shadow-[3px_3px_0px_#18181B] neo-btn-interactive hover:bg-[var(--theme-primary-hover)] disabled:opacity-50 disabled:shadow-none cursor-pointer"
          >
            {saveTx.isPending || saveSub.isPending || saveInv.isPending
              ? "Saving…"
              : "Save Entry"}
          </button>
        </div>
      </section>
    </div>
  );

  if (typeof document === "undefined") {
    return drawerContent;
  }

  return createPortal(drawerContent, document.body);
}
