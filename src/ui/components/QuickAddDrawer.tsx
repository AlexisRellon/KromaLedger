import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { addDays, format } from "date-fns";
import { calculateInvoice } from "../../core/engine/invoiceCalculator";
import { addLineItem } from "../../core/engine/lineItemWorkflow";
import { parseMinorInput } from "../../core/engine/moneyInput";
import { evaluateNumpad } from "../../core/engine/numpadEvaluator";
import { buildEntryDraft } from "../../state/entryDraft";
import { LineItemBuilder, type LineDraft } from "../components/LineItemBuilder";
import { formatCurrency, formatWalletLabel, ALLOWED_ATTACHMENT_MIME_TYPES, attachmentMimeTypeSchema, type AttachmentMeta, type Transaction, type TransferChannel } from "../../core/models";
import { detectTransferFee } from "../../core/engine/transferFees";
import { useUIStore, type QuickAddMode } from "../../state/useUIStore";
import { useSaveAttachment, useSaveInvoice, useSaveSubscription, useSaveTransaction, useWallets } from "../../state/queries";
import { saveEntryAndAttachment } from "../../state/entrySaveWorkflow";

const today = () => format(new Date(), "yyyy-MM-dd");
const id = () => crypto.randomUUID();

export function QuickAddDrawer({
  onClose,
  categories,
}: {
  onClose: () => void;
  categories: Array<{ id: string; name: string; type: string }>;
}) {
  const storeMode = useUIStore((s) => s.quickAddMode);
  const [mode, setMode] = useState<QuickAddMode>(storeMode);
  const [amount, setAmount] = useState("0");
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(
    categories.find((c) => c.name === "Dining")?.id ?? ""
  );
  const [date, setDate] = useState(today());
  const [cycle, setCycle] = useState<"WEEKLY" | "MONTHLY" | "YEARLY">("MONTHLY");
  const [autoLog, setAutoLog] = useState(true);
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 14), "yyyy-MM-dd"));
  const [direction, setDirection] = useState<"RECEIVABLE" | "PAYABLE">("RECEIVABLE");
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [draftLine, setDraftLine] = useState({ description: "", quantity: "1", unitPrice: "" });
  const [taxRateBps, setTaxRateBps] = useState(0);
  const [discountMinor, setDiscountMinor] = useState(0);
  const [savedId, setSavedId] = useState("");
  const [walletId, setWalletId] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [channel, setChannel] = useState<TransferChannel>("INSTAPAY");
  const [feeMinor, setFeeMinor] = useState(0);
  const [feeCustomized, setFeeCustomized] = useState(false);
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Partial<Record<QuickAddMode, HTMLButtonElement | null>>>({});
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const activeEl = tabRefs.current[mode];
    const container = tabContainerRef.current;
    if (!activeEl || !container) return;

    const updateIndicator = () => {
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
      });
    };

    updateIndicator();

    const ro = new ResizeObserver(updateIndicator);
    ro.observe(container);
    ro.observe(activeEl);
    return () => ro.disconnect();
  }, [mode]);

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
  const saveTx = useSaveTransaction();
  const saveSub = useSaveSubscription();
  const saveInv = useSaveInvoice();
  const closeStore = useUIStore((s) => s.closeQuickAdd);

  useEffect(() => {
    if ((mode === "EXPENSE" || mode === "SUBSCRIPTION" || mode === "TRANSFER") && !walletId && wallets.length > 0) {
      const def = wallets.find((w) => w.isDefault) ?? wallets[0];
      if (def) setWalletId(def.id);
    }
  }, [wallets, walletId, mode]);

  useEffect(() => {
    if (mode === "TRANSFER" && wallets.length > 1) {
      if (!toWalletId || toWalletId === walletId) {
        const other = wallets.find((w) => w.id !== walletId);
        if (other) setToWalletId(other.id);
      }
    }
  }, [mode, wallets, walletId, toWalletId]);

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

  const evaluatedCents = useMemo(() => {
    if (!amount || amount === "0") return 0;
    try {
      const evaluated = evaluateNumpad(amount);
      return Number.isFinite(evaluated) && evaluated >= 0 ? Math.round(evaluated * 100) : 0;
    } catch {
      const n = Number(amount);
      return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : 0;
    }
  }, [amount]);

  const hasMathExpression = useMemo(() => /[+\-*/]/.test(amount), [amount]);

  const previewLines = useMemo(() => {
    if (lines.length > 0) return lines;
    if (draftLine.description.trim() && draftLine.unitPrice.trim()) {
      try {
        const qty = Number(draftLine.quantity);
        const p = parseMinorInput(draftLine.unitPrice);
        if (Number.isFinite(qty) && qty > 0 && p > 0) {
          return [{ id: "preview-line", description: draftLine.description.trim(), quantity: qty, unitPriceMinor: p }];
        }
      } catch {
        return [];
      }
    }
    return [];
  }, [lines, draftLine]);

  const invoiceTotals = useMemo(() => {
    if (mode !== "INVOICE" || !previewLines.length) return null;
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

  const finalCents = mode === "INVOICE" && previewLines.length ? invoiceTotals?.totalMinor ?? 0 : evaluatedCents;
  const displayedAmount =
    mode === "INVOICE" && invoiceTotals
      ? (invoiceTotals.totalMinor / 100).toFixed(2)
      : amount;

  const filteredCategories = categories.filter((c) => c.type === "EXPENSE" || c.type === "BOTH");

  const key = (value: string) => {
    setAmount((current) => {
      if (value === "⌫") {
        if (current.length <= 1) return "0";
        const trimmed = current.trimEnd();
        if (trimmed.endsWith("+") || trimmed.endsWith("-") || trimmed.endsWith("*") || trimmed.endsWith("/")) {
          return trimmed.slice(0, -1).trimEnd();
        }
        return current.slice(0, -1);
      }
      if (value === ".") {
        return current.includes(".") && !hasMathExpression ? current : `${current}.`;
      }
      if (value === "+" || value === "-" || value === "*" || value === "/") {
        return `${current.trim()} ${value} `;
      }
      return current === "0" ? value : current + value;
    });
  };

  const close = () => {
    closeStore();
    onClose();
  };

  const saveProgress = useRef({ entrySaved: Boolean(savedId) });

  const submit = async () => {
    setError("");

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

    if (mode === "TRANSFER") {
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
        : ""
    );

    if (!effectiveTitle || !Number.isSafeInteger(calculatedFinalCents) || calculatedFinalCents <= 0) {
      setError("Add a title and a valid amount above zero.");
      return;
    }
    const entryId = savedId || id();
    const cleanAmountString = (calculatedFinalCents / 100).toFixed(2);

    try {
      const shared = {
        id: (prefix: "transaction" | "subscription" | "invoice" | "item") =>
          prefix === "item" ? id() : entryId,
        today: today(),
        date,
        title: effectiveTitle,
        amount: cleanAmountString,
        currency: "PHP",
        categoryId: categoryId || undefined,
        walletId: walletId || undefined,
      };

      const draft =
        mode === "EXPENSE"
          ? buildEntryDraft({ ...shared, mode })
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
          if (draft.kind === "EXPENSE" || draft.kind === "TRANSFER") {
            await saveTx.mutateAsync(draft.transaction);
          } else if (draft.kind === "SUBSCRIPTION") {
            await saveSub.mutateAsync({ ...draft.subscription, walletId: walletId || undefined });
          } else {
            if (walletId) {
              await saveInv.mutateAsync({ invoice: draft.invoice, items: draft.items });
              const paymentTx: Transaction = {
                id: id(),
                date,
                title: `${title} Payment`,
                amountMinor: direction === "RECEIVABLE" ? draft.invoice.totalMinor : -draft.invoice.totalMinor,
                currency: draft.invoice.currency,
                type: direction === "RECEIVABLE" ? "INCOME" : "EXPENSE",
                invoiceId: draft.invoice.id,
                walletId,
                categoryId: categoryId || undefined,
              };
              await saveTx.mutateAsync(paymentTx);
            } else {
              await saveInv.mutateAsync({ invoice: draft.invoice, items: draft.items });
            }
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
                  size: data.byteLength,
                  createdAt: new Date().toISOString(),
                  entityType: mode === "INVOICE" ? "INVOICE" : "TRANSACTION",
                  entityId: entryId,
                } satisfies AttachmentMeta,
                data,
              });
              setReceipt(null);
            }
          : undefined
      );

      close();
    } catch (e) {
      setError(
        saveProgress.current.entrySaved
          ? `Entry saved. Receipt could not be attached: ${
              e instanceof Error ? e.message : "storage error"
            }. Select Save Entry to retry the receipt.`
          : e instanceof Error
            ? e.message
            : "Could not save entry."
      );
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")) {
        return;
      }
      if (e.key >= "0" && e.key <= "9") {
        key(e.key);
      } else if (e.key === ".") {
        key(".");
      } else if (e.key === "Backspace") {
        key("⌫");
      } else if (e.key === "+" || e.key === "-" || e.key === "*" || e.key === "/") {
        key(e.key);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (mode === "INVOICE") {
          descriptionInputRef.current?.focus();
        } else {
          void submit();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Quick add entry"
        className="flex max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl sm:rounded-[2rem] border border-white/10 bg-[#10110e] shadow-2xl animate-entrance"
      >
        {/* Drawer Header (Fixed) */}
        <div className="shrink-0 flex items-center justify-between border-b border-white/[0.08] px-5 py-4 sm:px-7 sm:py-5">
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-white">New Entry</h2>
          <button
            onClick={close}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-neutral-400 hover:text-white transition hover:bg-white/10"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-7">
        {/* 4-way Segmented Mode Pill */}
        <div
          ref={tabContainerRef}
          style={{ containerType: "inline-size" }}
          className="@container relative mb-6 flex rounded-full border border-white/[0.06] bg-black/40 p-1 select-none"
        >
          <span
            aria-hidden="true"
            className="absolute inset-y-1 rounded-full bg-[#D9F938] transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
            style={{
              left: indicatorStyle
                ? `${indicatorStyle.left}px`
                : mode === "EXPENSE"
                  ? "4px"
                  : mode === "TRANSFER"
                    ? "calc(25% + 2px)"
                    : mode === "SUBSCRIPTION"
                      ? "calc(50% + 1px)"
                      : "calc(75% - 1px)",
              width: indicatorStyle
                ? `${indicatorStyle.width}px`
                : "calc((100% - 8px) / 4)",
            }}
          />
          {(["EXPENSE", "TRANSFER", "SUBSCRIPTION", "INVOICE"] as const).map((m) => (
            <button
              key={m}
              ref={(el) => {
                tabRefs.current[m] = el;
              }}
              type="button"
              onClick={() => handleModeChange(m)}
              disabled={Boolean(savedId)}
              className={`relative z-10 flex-auto rounded-full px-2.5 sm:px-3 py-2 text-xs font-semibold tracking-normal sm:tracking-wider whitespace-nowrap transition-colors duration-200 text-center ${
                mode === m
                  ? "text-[#070806]"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {m === "EXPENSE" ? "Expense" : m === "TRANSFER" ? "Transfer" : m === "SUBSCRIPTION" ? "Subscription" : "Invoice"}
            </button>
          ))}
        </div>

        {/* Amount Hero */}
        <div className="py-2 text-center">
          <p className="font-mono text-4xl font-semibold tabular-nums tracking-tight text-white sm:text-5xl">
            ₱ {displayedAmount}
          </p>
          {hasMathExpression && evaluatedCents > 0 && (
            <p className="mt-1 font-mono text-xs text-[#D9F938]">
              = ₱ {(evaluatedCents / 100).toFixed(2)}
            </p>
          )}
          <p className="mt-1.5 text-xs text-neutral-400">
            {mode === "INVOICE" && lines.length > 0
              ? `${lines.length} line item${lines.length > 1 ? "s" : ""} calculated`
              : "Tap keypad or type inline math"}
          </p>
        </div>

        {/* Transfer Configuration Zone */}
        {mode === "TRANSFER" && (
          <div className="my-4 space-y-3.5 rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Source Account */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                  Transfer From
                </label>
                <select
                  value={walletId}
                  onChange={(e) => handleOriginChange(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#141512] px-3 py-2 text-xs font-semibold text-white outline-none focus:border-[#D9F938]/60"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id} className="bg-[#141512] text-white">
                      {formatWalletLabel(w)} ({formatCurrency(w.balanceMinor, w.currency)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination Account */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                  Transfer To
                </label>
                <select
                  value={toWalletId}
                  onChange={(e) => handleDestinationChange(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#141512] px-3 py-2 text-xs font-semibold text-white outline-none focus:border-[#D9F938]/60"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id} disabled={w.id === walletId} className="bg-[#141512] text-white">
                      {formatWalletLabel(w)} ({formatCurrency(w.balanceMinor, w.currency)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-white/[0.06]">
              {/* Channel Selector */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                  Transfer Channel
                </label>
                <div className="mt-1.5 flex rounded-lg border border-white/10 bg-black/30 p-0.5">
                  {(["INSTAPAY", "PESONET"] as const).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => handleChannelChange(ch)}
                      className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
                        channel === ch
                          ? "bg-white text-black shadow-sm"
                          : "text-neutral-400 hover:text-white"
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
                  <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                    Transfer Fee (₱)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-[#D9F938]">
                      {feeDetection.reason}
                    </span>
                    {feeCustomized && (
                      <button
                        type="button"
                        onClick={() => {
                          setFeeCustomized(false);
                          setFeeMinor(feeDetection.feeMinor);
                        }}
                        className="text-[10px] text-cyan-400 hover:underline"
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
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#141512] px-3 py-1.5 text-xs font-mono font-semibold text-white outline-none focus:border-[#D9F938]/60"
                />
              </div>
            </div>

            {/* Live Transfer Calculation Summary */}
            <div className="mt-2 rounded-xl bg-white/[0.02] border border-white/[0.06] p-2.5 text-xs text-neutral-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-400">Transfer Principal:</span>
                <span className="font-mono font-medium text-white">₱{(finalCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Transfer Fee:</span>
                <span className="font-mono font-medium text-white">₱{(feeMinor / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-white/[0.06] pt-1 font-semibold">
                <span className="text-neutral-200">Total Deducted from {fromWallet?.name || "Source"}:</span>
                <span className="font-mono text-[#D9F938]">₱{((finalCents + feeMinor) / 100).toFixed(2)}</span>
              </div>
            </div>

            {/* Receipt / Screenshot Attachment for Transfer */}
            <div className="pt-1">
              <label className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-neutral-300 transition hover:border-[#D9F938]/40 hover:text-white">
                <svg className="h-3.5 w-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
          <div className="my-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {filteredCategories.map((c) => {
              const catName = c.name.toLowerCase();
              return (
                <button
                  key={c.id}
                  onClick={() => setCategoryId(c.id)}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                    categoryId === c.id
                      ? "border-[#D9F938] bg-[#D9F938] text-[#070806] font-semibold"
                      : "border-white/10 bg-white/[0.03] text-neutral-300 hover:border-white/25 hover:text-white"
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
              <label className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs text-neutral-300 transition hover:border-[#D9F938]/40 hover:text-white">
                <svg className="h-3.5 w-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

        {/* Wallet / Source Selector (Non-Transfer) */}
        {mode !== "TRANSFER" && wallets.length > 0 && (
          <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 shrink-0">
              Paid With:
            </span>
            {mode === "INVOICE" && (
              <button
                type="button"
                onClick={() => setWalletId("")}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                  !walletId
                    ? "border-[#D9F938] bg-[#D9F938]/15 text-[#D9F938] font-semibold"
                    : "border-white/10 bg-white/[0.02] text-neutral-400 hover:text-white"
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
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                  walletId === w.id
                    ? "border-[#D9F938] bg-[#D9F938]/15 text-[#D9F938] font-semibold"
                    : "border-white/10 bg-white/[0.02] text-neutral-400 hover:text-white"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: w.color || "#D9F938" }}
                />
                <span>{formatWalletLabel(w)}</span>
              </button>
            ))}
          </div>
        )}

        {/* Dynamic Morphing Middle Zone */}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-neutral-400">
            {mode === "SUBSCRIPTION"
              ? "SERVICE NAME"
              : mode === "INVOICE"
                ? "CLIENT / VENDOR"
                : mode === "TRANSFER"
                  ? "TRANSFER NOTE / TITLE"
                  : "MERCHANT / NOTE"}
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && mode === "INVOICE") {
                  e.preventDefault();
                  descriptionInputRef.current?.focus();
                }
              }}
              placeholder={
                mode === "SUBSCRIPTION"
                  ? "e.g. Netflix"
                  : mode === "INVOICE"
                    ? "e.g. Acme Corp"
                    : mode === "TRANSFER"
                      ? `e.g. ${fromWallet?.name ?? "Source"} to ${targetWallet?.name ?? "Destination"}`
                      : "e.g. GrabCar Commute"
              }
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-3 text-sm text-white outline-none transition focus:border-[#D9F938]/60 focus:ring-1 focus:ring-[#D9F938]/40"
            />
          </label>

          {mode === "INVOICE" ? (
            <label className="text-xs text-neutral-400">
              DUE DATE
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
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-3 text-sm text-white outline-none transition focus:border-[#D9F938]/60"
              />
            </label>
          ) : (
            <label className="text-xs text-neutral-400">
              {mode === "SUBSCRIPTION" ? "NEXT BILLING DATE" : "DATE"}
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-3 text-sm text-white outline-none transition focus:border-[#D9F938]/60"
              />
            </label>
          )}
        </div>

        {/* Subscription Mode Options */}
        {mode === "SUBSCRIPTION" && (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-3">
            <label className="text-xs text-neutral-400">
              BILLING CYCLE
              <select
                value={cycle}
                onChange={(e) => setCycle(e.target.value as typeof cycle)}
                className="ml-2 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white outline-none"
              >
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </label>
            <label className="ml-auto flex items-center gap-2 text-xs text-neutral-300">
              <input
                type="checkbox"
                checked={autoLog}
                onChange={(e) => setAutoLog(e.target.checked)}
                className="h-4 w-4 rounded accent-[#D9F938]"
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
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wider transition ${
                    direction === d
                      ? "border-[#D9F938] bg-[#D9F938]/10 text-[#D9F938]"
                      : "border-white/10 text-neutral-500 hover:text-white"
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

        {/* Quick math operator bar */}
        <div className="mt-4 flex items-center justify-between gap-1 rounded-xl border border-white/[0.06] bg-black/30 p-1">
          {["+", "-", "*", "/"].map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => key(op)}
              className="flex-1 rounded-lg py-1.5 font-mono text-sm text-neutral-400 transition hover:bg-white/10 hover:text-white"
            >
              {op === "*" ? "×" : op === "/" ? "÷" : op}
            </button>
          ))}
        </div>

        {/* Tactile 3x4 Numpad */}
        <div className="mt-2 grid grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => key(v)}
              className="flex items-center justify-center rounded-2xl border border-white/[.08] bg-white/[.04] py-3.5 font-mono text-xl font-medium text-white transition hover:bg-white/[.08] active:scale-[0.96] active:bg-white/[.12]"
            >
              {v === "⌫" ? (
                <svg className="h-5 w-5 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75 14.25 12m0 0 2.25 2.25M14.25 12l2.25-2.25M14.25 12 12 14.25m-2.58 4.92-6.374-6.375a1.125 1.125 0 0 1 0-1.59L9.42 4.83c.21-.211.497-.33.795-.33H19.5a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25h-9.284c-.298 0-.585-.119-.795-.33Z" />
                </svg>
              ) : (
                v
              )}
            </button>
          ))}
        </div>

        </div>

        {/* Save Entry CTA Footer (Fixed) */}
        <div className="shrink-0 border-t border-white/10 bg-[#10110e] px-5 py-3.5 sm:px-7 sm:py-4">
          {error && (
            <p role="alert" className="mb-2 text-center text-xs text-rose-400">
              {error}
            </p>
          )}
          <button
            onClick={() => void submit()}
            disabled={saveTx.isPending || saveSub.isPending || saveInv.isPending}
            className="w-full rounded-2xl bg-[#D9F938] py-3.5 sm:py-4 font-semibold text-[#070806] transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
          >
            {saveTx.isPending || saveSub.isPending || saveInv.isPending
              ? "Saving…"
              : "Save Entry"}
          </button>
        </div>
      </section>
    </div>
  );
}
