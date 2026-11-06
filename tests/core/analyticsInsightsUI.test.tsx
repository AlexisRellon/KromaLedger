import "fake-indexeddb/auto";
import { createElement } from "react";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { KromaLedgerDB } from "../../src/adapters/web-dexie/db";
import { DexieStorageRepo } from "../../src/adapters/web-dexie/DexieStorageRepo";
import { DexieFileStore } from "../../src/adapters/web-dexie/DexieFileStore";
import { StorageProvider, type StorageServices } from "../../src/state/StorageContext";
import { useUIStore } from "../../src/state/useUIStore";
import { CommittedWaterfallCard } from "../../src/ui/components/analytics/CommittedWaterfallCard";
import { WalletShortfallAlertCard } from "../../src/ui/components/analytics/WalletShortfallAlertCard";
import { FeeLeakageAndPayoffRow } from "../../src/ui/components/analytics/FeeLeakageAndPayoffRow";
import { InvoiceAgingAndTaxCard } from "../../src/ui/components/analytics/InvoiceAgingAndTaxCard";
import { AnalyticsInsightsSection } from "../../src/ui/screens/AnalyticsInsightsSection";
import { QuickAddDrawer } from "../../src/ui/components/QuickAddDrawer";
import { queryKeys } from "../../src/state/queries";
import type { Wallet, Invoice, Subscription, Transaction } from "../../src/core/models";

let db: KromaLedgerDB;
let services: StorageServices;

beforeEach(async () => {
  db = new KromaLedgerDB();
  await db.delete();
  db = new KromaLedgerDB();
  services = {
    repo: new DexieStorageRepo(db),
    files: new DexieFileStore(db),
    vault: {
      export: async () => ({ filename: "vault.zip", data: new Uint8Array() }),
      restore: async () => {},
    },
    storageStatus: async () => ({ persistent: true, usage: 1024, quota: 1024 * 1024 }),
  };
  useUIStore.setState({
    quickAddOpen: false,
    quickAddMode: "EXPENSE",
    quickAddPrefill: undefined,
  });
});

afterEach(() => {
  db.close();
});

function wrap(client: QueryClient, node: React.ReactNode) {
  return createElement(
    QueryClientProvider,
    { client },
    createElement(StorageProvider, { value: services }, node)
  );
}

describe("useUIStore & QuickAddDrawer prefill support", () => {
  it("stores and clears quickAddPrefill when opening and closing QuickAddDrawer", () => {
    useUIStore.getState().openQuickAdd("TRANSFER", {
      amountPhp: 2500,
      toWalletId: "wallet-gotyme",
    });

    const state = useUIStore.getState();
    expect(state.quickAddOpen).toBe(true);
    expect(state.quickAddMode).toBe("TRANSFER");
    expect(state.quickAddPrefill).toEqual({
      amountPhp: 2500,
      toWalletId: "wallet-gotyme",
    });

    useUIStore.getState().closeQuickAdd();
    const closed = useUIStore.getState();
    expect(closed.quickAddOpen).toBe(false);
    expect(closed.quickAddPrefill).toBeUndefined();
  });

  it("QuickAddDrawer initializes mode to TRANSFER, amount to 2500.00, and destination wallet", () => {
    useUIStore.getState().openQuickAdd("TRANSFER", {
      amountPhp: 2500,
      toWalletId: "w-dest",
    });

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData<Wallet[]>(queryKeys.wallets, [
      {
        id: "w-src",
        name: "MariBank",
        type: "BANK",
        currency: "PHP",
        balanceMinor: 500000,
        color: "#D9F938",
        isDefault: true,
      },
      {
        id: "w-dest",
        name: "GoTyme Vault",
        type: "BANK",
        currency: "PHP",
        balanceMinor: 10000,
        color: "#10B981",
        isDefault: false,
      },
    ]);
    client.setQueryData(queryKeys.categories, []);

    const html = renderToStaticMarkup(
      wrap(client, createElement(QuickAddDrawer, { onClose: () => {} }))
    );

    // Should render input with pre-filled amount 2500.00
    expect(html).toContain('value="2500.00"');
    // Mode should be Transfer
    expect(html).toContain("Transfer From");
    expect(html).toContain("Transfer To");
    expect(html).toContain("Transfer Channel");
  });
});

describe("CommittedWaterfallCard Neobrutalist UI", () => {
  it("renders segmented waterfall bar with solid fills, daily burn allowance, and breakdown", () => {
    const waterfall = {
      totalLiquidPhp: 50000,
      lockedSubscriptionsPhp: 5000,
      lockedDebtAndInstallmentsPhp: 10000,
      lockedPayableInvoicesPhp: 15000,
      totalCommittedPhp: 30000,
      trueSafeToSpendPhp: 20000,
      dailySafeAllowancePhp: 1000,
      commitmentRatioPercent: 60,
    };

    const html = renderToStaticMarkup(
      createElement(CommittedWaterfallCard, { waterfall })
    );

    expect(html).toContain("Committed Cashflow Waterfall");
    expect(html).toContain("60% committed");
    expect(html).toContain("₱1,000.00");
    expect(html).toContain("/ day safe allowance");
    expect(html).toContain("Liquid Cash");
    expect(html).not.toContain("Total Liquid Cash");
    expect(html).toContain("Subscriptions");
    expect(html).toContain("Loans &amp; Installments");
    expect(html).toContain("Payable Invoices");
    expect(html).toContain("Safe-to-Spend");
    expect(html).toContain("₱50,000.00");
    expect(html).toContain("₱30,000.00");
    expect(html).toContain("₱20,000.00");
    // Colors for the 4 segments: Ochre (#F4C95D), Terracotta (#B85028), Plum (#4A154B), Mint (#86EFAC)
    expect(html).toContain("background-color:#F4C95D");
    expect(html).toContain("background-color:#B85028");
    expect(html).toContain("background-color:#4A154B");
    expect(html).toContain("background-color:#86EFAC");
  });

  it("handles deficit state gracefully when commitments exceed total liquid cash", () => {
    const waterfall = {
      totalLiquidPhp: 10000,
      lockedSubscriptionsPhp: 5000,
      lockedDebtAndInstallmentsPhp: 10000,
      lockedPayableInvoicesPhp: 5000,
      totalCommittedPhp: 20000,
      trueSafeToSpendPhp: -10000,
      dailySafeAllowancePhp: 0,
      commitmentRatioPercent: 100,
    };

    const html = renderToStaticMarkup(
      createElement(CommittedWaterfallCard, { waterfall })
    );

    expect(html).toContain("Liquidity Shortfall");
    expect(html).toContain("10,000.00");
    expect(html).toContain("₱0.00");
    expect(html).toContain("/ day safe allowance");
  });
});

describe("WalletShortfallAlertCard Neobrutalist UI", () => {
  it("renders shortfall warning with rose-tinted pill and Top Up action", () => {
    const wallets = [
      {
        walletId: "w-mari",
        walletName: "MariBank",
        availableBalancePhp: 2000,
        scheduledOutflowsPhp: 5000,
        projectedEndingBalancePhp: -3000,
        shortfallPhp: 3000,
        status: "SHORTFALL_WARNING" as const,
      },
      {
        walletId: "w-gotyme",
        walletName: "GoTyme",
        availableBalancePhp: 20000,
        scheduledOutflowsPhp: 1000,
        projectedEndingBalancePhp: 19000,
        shortfallPhp: 0,
        status: "HEALTHY" as const,
      },
    ];

    const html = renderToStaticMarkup(
      createElement(WalletShortfallAlertCard, { wallets })
    );

    expect(html).toContain("MariBank");
    expect(html).toContain("Shortfall: −₱3,000.00 • Top up wallet");
    expect(html).toContain("Top Up");
    expect(html).toContain("GoTyme");
    expect(html).toContain("Healthy");
  });

  it("renders EmptyStateWatermark when wallets list is empty", () => {
    const html = renderToStaticMarkup(
      createElement(WalletShortfallAlertCard, { wallets: [] })
    );

    expect(html).toContain('data-empty-state-watermark="true"');
    expect(html).toContain("No liquid wallets registered in your vault yet.");
  });
});

describe("FeeLeakageAndPayoffRow Neobrutalist UI", () => {
  it("renders fee leakage card and active payoff plans with capped final payment badges", () => {
    const feeReport = {
      totalFeesLostPhp: 30,
      transferFeesPhp: 15,
      cashInFeesPhp: 15,
      freeTransferCount: 4,
      estimatedSavingsPhp: 60,
      byChannel: {
        INSTAPAY: 15,
        PESONET: 0,
        OTC_CASH_IN: 15,
      },
    };

    const payoffPlans = [
      {
        id: "inv-macbook",
        title: "MacBook Air M3",
        kind: "INSTALLMENT" as const,
        repaymentWalletId: "w-mari",
        totalObligationPhp: 60000,
        amountPaidPhp: 55000,
        remainingBalancePhp: 5000,
        nextInstallmentChargePhp: 5000,
        remainingInstallmentsCount: 1,
        progressPercent: 92,
      },
    ];

    const html = renderToStaticMarkup(
      createElement(FeeLeakageAndPayoffRow, { feeReport, payoffPlans })
    );

    // Friction card
    expect(html).toContain("Transfer &amp; Cash-In Friction");
    expect(html).toContain("Saved ₱60.00 via Free Transfers");
    expect(html).toContain("₱30.00");
    expect(html).toContain("4 transfers");

    // Payoff horizon card
    expect(html).toContain("Installment &amp; Loan Horizon");
    expect(html).toContain("MacBook Air M3");
    expect(html).toContain("1 cutoff left");
    expect(html).toContain("92%");
    expect(html).toContain("Final cutoff: ₱5,000.00 (capped)");
  });

  it("renders EmptyStateWatermark when fees and payoff plans are empty", () => {
    const feeReport = {
      totalFeesLostPhp: 0,
      transferFeesPhp: 0,
      cashInFeesPhp: 0,
      freeTransferCount: 0,
      estimatedSavingsPhp: 0,
      byChannel: { INSTAPAY: 0, PESONET: 0, OTC_CASH_IN: 0 },
    };

    const html = renderToStaticMarkup(
      createElement(FeeLeakageAndPayoffRow, { feeReport, payoffPlans: [] })
    );

    expect(html).toContain("No transfer or cash-in fees recorded for this period.");
    expect(html).toContain("No active loans or installments found.");
    expect(html.match(/data-empty-state-watermark="true"/g)?.length).toBe(2);
    // Vertical stacking check
    expect(html).toContain("grid-cols-1 gap-5");
    expect(html).not.toContain("xl:grid-cols-2");
    // Horizontal 3-pill summary bar is visible even when fees are 0
    expect(html).toContain("InstaPay Fees");
    expect(html).toContain("OTC Cash-In");
    expect(html).toContain("Free Transfers Saved");
    // TactileEmptyState action triggers
    expect(html).toContain("+ Log Transfer / Cash-in");
    expect(html).toContain("+ Add Loan or Installment");
  });
});

describe("InvoiceAgingAndTaxCard Neobrutalist UI", () => {
  it("renders 4 aging buckets alongside tax, discount, and net uncollected figures with dynamic overdue status pill", () => {
    const report = {
      totalReceivablesPhp: 125000,
      uncollectedReceivablesPhp: 75000,
      totalUncollectedReceivablesPhp: 75000,
      totalPayablesPhp: 25000,
      unpaidPayablesPhp: 10000,
      totalUnpaidPayablesPhp: 10000,
      netUncollectedPhp: 65000,
      byAgingBucket: {
        CURRENT: 25000,
        OVERDUE_1_15: 20000,
        OVERDUE_16_30: 15000,
        OVERDUE_30_PLUS: 15000,
      },
      receivablesByAging: {
        CURRENT: 25000,
        OVERDUE_1_15: 20000,
        OVERDUE_16_30: 15000,
        OVERDUE_30_PLUS: 15000,
      },
      payablesByAging: {
        CURRENT: 10000,
        OVERDUE_1_15: 0,
        OVERDUE_16_30: 0,
        OVERDUE_30_PLUS: 0,
      },
      totalTaxPhp: 7500,
      taxPhp: 7500,
      totalDiscountPhp: 2000,
      discountPhp: 2000,
    };

    const html = renderToStaticMarkup(
      createElement(InvoiceAgingAndTaxCard, { report, totalInvoiceCount: 5 })
    );

    expect(html).toContain("Invoice Aging &amp; Tax Ledger");
    expect(html).not.toContain("Module 5");
    expect(html).not.toContain("Module 4");
    expect(html).toContain("Overdue");
    expect(html).toContain("Uncollected: ₱75,000.00");
    expect(html).toContain("₱25,000.00"); // Current
    expect(html).toContain("₱20,000.00"); // 1-15 days
    expect(html).toContain("₱15,000.00"); // 16-30 & 30+ days
    expect(html).toContain("₱7,500.00");  // Tax
    expect(html).toContain("₱2,000.00");  // Discount
    expect(html).toContain("+₱65,000.00"); // Net Uncollected Position
  });

  it("renders 100% Current status pill when receivables are open but none are overdue", () => {
    const report = {
      totalReceivablesPhp: 30000,
      uncollectedReceivablesPhp: 30000,
      totalUncollectedReceivablesPhp: 30000,
      totalPayablesPhp: 0,
      unpaidPayablesPhp: 0,
      totalUnpaidPayablesPhp: 0,
      netUncollectedPhp: 30000,
      byAgingBucket: { CURRENT: 30000, OVERDUE_1_15: 0, OVERDUE_16_30: 0, OVERDUE_30_PLUS: 0 },
      receivablesByAging: { CURRENT: 30000, OVERDUE_1_15: 0, OVERDUE_16_30: 0, OVERDUE_30_PLUS: 0 },
      payablesByAging: { CURRENT: 0, OVERDUE_1_15: 0, OVERDUE_16_30: 0, OVERDUE_30_PLUS: 0 },
      totalTaxPhp: 0,
      taxPhp: 0,
      totalDiscountPhp: 0,
      discountPhp: 0,
    };

    const html = renderToStaticMarkup(
      createElement(InvoiceAgingAndTaxCard, { report, totalInvoiceCount: 2 })
    );

    expect(html).toContain("100% Current");
    expect(html).not.toContain("Module 5");
  });

  it("renders EmptyStateWatermark and 0 Open pill when there are no invoices", () => {
    const report = {
      totalReceivablesPhp: 0,
      uncollectedReceivablesPhp: 0,
      totalUncollectedReceivablesPhp: 0,
      totalPayablesPhp: 0,
      unpaidPayablesPhp: 0,
      totalUnpaidPayablesPhp: 0,
      netUncollectedPhp: 0,
      byAgingBucket: { CURRENT: 0, OVERDUE_1_15: 0, OVERDUE_16_30: 0, OVERDUE_30_PLUS: 0 },
      receivablesByAging: { CURRENT: 0, OVERDUE_1_15: 0, OVERDUE_16_30: 0, OVERDUE_30_PLUS: 0 },
      payablesByAging: { CURRENT: 0, OVERDUE_1_15: 0, OVERDUE_16_30: 0, OVERDUE_30_PLUS: 0 },
      totalTaxPhp: 0,
      taxPhp: 0,
      totalDiscountPhp: 0,
      discountPhp: 0,
    };

    const html = renderToStaticMarkup(
      createElement(InvoiceAgingAndTaxCard, { report, totalInvoiceCount: 0 })
    );

    expect(html).toContain('data-empty-state-watermark="true"');
    expect(html).toContain("No invoices recorded in your ledger yet.");
    expect(html).toContain("0 Open");
    expect(html).not.toContain("Module 5");
  });
});

describe("AnalyticsInsightsSection integration", () => {
  it("wires live props into the Neobrutalist Bento Grid without errors", () => {
    const wallets: Wallet[] = [
      {
        id: "w-mari",
        name: "MariBank",
        type: "BANK",
        currency: "PHP",
        balanceMinor: 2000000,
        color: "#D9F938",
        isDefault: true,
      },
      {
        id: "w-gotyme",
        name: "GoTyme",
        type: "BANK",
        currency: "PHP",
        balanceMinor: 1000000,
        color: "#10B981",
        isDefault: false,
      },
    ];

    const subscriptions: Subscription[] = [
      {
        id: "sub-netflix",
        title: "Netflix Premium",
        amountMinor: 54900,
        currency: "PHP",
        billingCycle: "MONTHLY",
        nextBillingDate: "2026-11-15",
        active: true,
        autoLog: true,
        walletId: "w-mari",
      },
    ];

    const invoices: Invoice[] = [
      {
        id: "inv-loan",
        title: "Equipment Financing",
        direction: "PAYABLE",
        dueDate: "2026-11-20",
        status: "PENDING",
        subtotalMinor: 1000000,
        taxMinor: 120000,
        discountMinor: 0,
        totalMinor: 1120000,
        paidMinor: 200000,
        currency: "PHP",
        itemIds: [],
        obligation: {
          kind: "LOAN",
          paymentMinor: 100000,
          cycle: "MONTHLY",
          firstDueDate: "2026-10-20",
          walletId: "w-mari",
        },
      },
    ];

    const transactions: Transaction[] = [
      {
        id: "tx-transfer",
        date: "2026-11-05",
        title: "Fund GoTyme",
        amountMinor: -500000,
        currency: "PHP",
        type: "TRANSFER",
        walletId: "w-mari",
        toWalletId: "w-gotyme",
        feeMinor: 0,
      },
    ];

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(queryKeys.wallets, wallets);
    client.setQueryData(queryKeys.subscriptions, subscriptions);
    client.setQueryData(queryKeys.invoices, invoices);
    client.setQueryData(queryKeys.transactionMonth("2026-11"), transactions);

    const html = renderToStaticMarkup(
      wrap(
        client,
        createElement(AnalyticsInsightsSection, {
          month: "2026-11",
          wallets,
          subscriptions,
          invoices,
          transactions,
        })
      )
    );

    expect(html).toContain("Committed Cashflow Waterfall");
    expect(html).toContain("Per-Wallet Liquidity &amp; Shortfall Radar");
    expect(html).toContain("Transfer &amp; Cash-In Friction");
    expect(html).toContain("Installment &amp; Loan Horizon");
    expect(html).toContain("Invoice Aging &amp; Tax Ledger");
    expect(html).toContain("MariBank");
    expect(html).toContain("Equipment Financing");
    expect(html).toContain("Saved ₱15.00 via Free Transfers");
  });
});
