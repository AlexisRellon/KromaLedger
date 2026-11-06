import { useMemo } from "react";
import { format } from "date-fns";
import {
  calculateCommittedWaterfall,
  analyzeWalletLiquidity,
  calculateFeeLeakage,
  evaluatePayoffHorizon,
  analyzeInvoiceAging,
} from "../../core/engine/cashflowAnalytics";
import type { Invoice, Subscription, Transaction, Wallet } from "../../core/models";
import {
  useInvoices,
  useSubscriptions,
  useTransactions,
  useWallets,
} from "../../state/queries";
import { useUIStore } from "../../state/useUIStore";
import { CommittedWaterfallCard } from "../components/analytics/CommittedWaterfallCard";
import { WalletShortfallAlertCard } from "../components/analytics/WalletShortfallAlertCard";
import { FeeLeakageAndPayoffRow } from "../components/analytics/FeeLeakageAndPayoffRow";
import { InvoiceAgingAndTaxCard } from "../components/analytics/InvoiceAgingAndTaxCard";

export {
  CommittedWaterfallCard,
  WalletShortfallAlertCard,
  FeeLeakageAndPayoffRow,
  InvoiceAgingAndTaxCard,
};

function getRemainingDaysInMonth(monthStr: string): number {
  const now = new Date();
  const currentMonthStr = format(now, "yyyy-MM");
  if (monthStr !== currentMonthStr) {
    const [y, m] = monthStr.split("-").map(Number);
    if (!y || !m) return 1;
    const lastDay = new Date(y, m, 0).getDate();
    return Math.max(1, lastDay);
  }
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  return Math.max(1, lastDay - currentDay + 1);
}

export function useAnalyticsInsightsData({
  month: propMonth,
  wallets: propWallets,
  transactions: propTransactions,
  subscriptions: propSubscriptions,
  invoices: propInvoices,
}: {
  month?: string;
  wallets?: Wallet[];
  transactions?: Transaction[];
  subscriptions?: Subscription[];
  invoices?: Invoice[];
} = {}) {
  const storeMonth = useUIStore((s) => s.selectedMonth);
  const month = propMonth ?? storeMonth;

  // React Query queries (fallback if props not explicitly passed)
  const walletsQuery = useWallets();
  const txQuery = useTransactions(month);
  const subsQuery = useSubscriptions();
  const invoicesQuery = useInvoices();

  const wallets = propWallets ?? walletsQuery.data ?? [];
  const transactions = propTransactions ?? txQuery.data ?? [];
  const subscriptions = propSubscriptions ?? subsQuery.data ?? [];
  const invoices = propInvoices ?? invoicesQuery.data ?? [];

  // =========================================================================
  // 1. MODULE 1: Friction & Fee Leakage Data
  // =========================================================================
  const feeReport = useMemo(() => {
    const feeEntries = transactions
      .filter((t) => t.type === "TRANSFER" || t.cashIn === true)
      .map((t) => ({
        kind: (t.cashIn ? "EWALLET_CASH_IN" : "TRANSFER") as "TRANSFER" | "EWALLET_CASH_IN",
        channel: t.channel,
        feeMinor: t.feeMinor ?? 0,
      }));

    return calculateFeeLeakage(feeEntries);
  }, [transactions]);

  // =========================================================================
  // 2. MODULE 2: Committed Cashflow Waterfall Data
  // =========================================================================
  const waterfall = useMemo(() => {
    const totalLiquidPhp = wallets.reduce((sum, w) => sum + w.balanceMinor, 0) / 100;

    const paidSubIds = new Set(
      transactions
        .filter((t) => t.type === "SUBSCRIPTION_PAYMENT" && t.subscriptionId)
        .map((t) => t.subscriptionId)
    );

    // Unpaid active subscriptions due by month end
    const unpaidSubsMinor = subscriptions
      .filter(
        (s) =>
          s.active &&
          s.nextBillingDate <= `${month}-31` &&
          !paidSubIds.has(s.id)
      )
      .reduce((sum, s) => sum + s.amountMinor, 0);

    // Scheduled loan and installment cutoffs unpaid this month
    const unpaidDebtMinor = invoices
      .filter((i) => Boolean(i.obligation) && i.status !== "PAID")
      .reduce((sum, i) => {
        const obligation = i.obligation!;
        const remaining = i.totalMinor - i.paidMinor;
        const slice = Math.min(obligation.paymentMinor, remaining);
        return sum + Math.max(0, slice);
      }, 0);

    // Unpaid regular payable invoices (non-obligation) due by month end
    const unpaidPayablesMinor = invoices
      .filter(
        (i) =>
          !i.obligation &&
          i.direction === "PAYABLE" &&
          i.status !== "PAID" &&
          i.dueDate <= `${month}-31`
      )
      .reduce((sum, i) => sum + Math.max(0, i.totalMinor - i.paidMinor), 0);

    return calculateCommittedWaterfall({
      totalLiquidPhp,
      unpaidSubscriptionsThisMonthPhp: unpaidSubsMinor / 100,
      unpaidLoanAndInstallmentSlicesPhp: unpaidDebtMinor / 100,
      unpaidPayableInvoicesThisMonthPhp: unpaidPayablesMinor / 100,
      remainingDaysInMonth: getRemainingDaysInMonth(month),
    });
  }, [wallets, subscriptions, invoices, transactions, month]);

  // =========================================================================
  // 3. MODULE 3: Debt & Installment Payoff Horizon Data
  // =========================================================================
  const payoffPlans = useMemo(() => {
    return invoices
      .filter((i) => Boolean(i.obligation) && i.status !== "PAID")
      .map((i) =>
        evaluatePayoffHorizon({
          id: i.id,
          title: i.title,
          kind: i.obligation!.kind,
          repaymentWalletId: i.obligation!.walletId ?? "",
          totalObligationPhp: i.totalMinor / 100,
          amountPaidPhp: i.paidMinor / 100,
          scheduledPaymentPhp: i.obligation!.paymentMinor / 100,
        })
      );
  }, [invoices]);

  // =========================================================================
  // 4. MODULE 4: Per-Wallet Liquidity & Shortfall Radar Data
  // =========================================================================
  const walletLiquidity = useMemo(() => {
    const walletInputs = wallets.map((w) => ({
      id: w.id,
      name: w.name,
      balancePhp: w.balanceMinor / 100,
    }));

    const paidSubIds = new Set(
      transactions
        .filter((t) => t.type === "SUBSCRIPTION_PAYMENT" && t.subscriptionId)
        .map((t) => t.subscriptionId)
    );

    const commitments: Array<{ walletId: string; amountPhp: number }> = [];

    // Subscriptions assigned to a wallet
    for (const sub of subscriptions) {
      if (
        sub.active &&
        sub.walletId &&
        sub.nextBillingDate <= `${month}-31` &&
        !paidSubIds.has(sub.id)
      ) {
        commitments.push({
          walletId: sub.walletId,
          amountPhp: sub.amountMinor / 100,
        });
      }
    }

    // Loans and installments assigned to a wallet
    for (const inv of invoices) {
      if (inv.obligation?.walletId && inv.status !== "PAID") {
        const remaining = inv.totalMinor - inv.paidMinor;
        const slice = Math.min(inv.obligation.paymentMinor, remaining);
        commitments.push({
          walletId: inv.obligation.walletId,
          amountPhp: slice / 100,
        });
      }
    }

    return analyzeWalletLiquidity(walletInputs, commitments);
  }, [wallets, subscriptions, invoices, transactions, month]);

  // =========================================================================
  // 5. MODULE 5: Invoice Aging & Tax Ledger Data
  // =========================================================================
  const agingReport = useMemo(() => {
    const inputItems = invoices.map((inv) => ({
      id: inv.id,
      title: inv.title,
      direction: inv.direction,
      dueDate: inv.dueDate,
      status: inv.status,
      totalMinor: inv.totalMinor,
      paidMinor: inv.paidMinor,
      taxMinor: inv.taxMinor,
      discountMinor: inv.discountMinor,
    }));

    return analyzeInvoiceAging(inputItems);
  }, [invoices]);

  return {
    month,
    wallets,
    transactions,
    subscriptions,
    invoices,
    feeReport,
    waterfall,
    payoffPlans,
    walletLiquidity,
    agingReport,
  };
}

export function AnalyticsInsightsSection({
  month,
  wallets,
  transactions,
  subscriptions,
  invoices,
  className = "",
}: {
  month?: string;
  wallets?: Wallet[];
  transactions?: Transaction[];
  subscriptions?: Subscription[];
  invoices?: Invoice[];
  className?: string;
}) {
  const {
    feeReport,
    waterfall,
    payoffPlans,
    walletLiquidity,
    agingReport,
    invoices: effectiveInvoices,
  } = useAnalyticsInsightsData({
    month,
    wallets,
    transactions,
    subscriptions,
    invoices,
  });

  return (
    <section
      aria-label="Financial Intelligence and Analytics Bento Grid"
      className={`space-y-6 ${className}`}
    >
      {/* Module 2: Committed Waterfall Card */}
      <CommittedWaterfallCard waterfall={waterfall} />

      {/* Module 4: Per-Wallet Liquidity & Shortfall Radar */}
      <WalletShortfallAlertCard wallets={walletLiquidity} />

      {/* Modules 1 & 3: Fee Leakage & Payoff Horizon Split Row */}
      <FeeLeakageAndPayoffRow
        feeReport={feeReport}
        payoffPlans={payoffPlans}
      />

      {/* Module 5: Invoice Aging, Tax & Discount Card */}
      <InvoiceAgingAndTaxCard
        report={agingReport}
        totalInvoiceCount={effectiveInvoices.length}
      />
    </section>
  );
}
