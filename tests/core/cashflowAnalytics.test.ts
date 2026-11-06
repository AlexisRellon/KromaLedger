import { describe, expect, it } from "vitest";
import {
  calculateCashflow,
  calculateCashForecast,
  calculateFeeLeakage,
  calculateCommittedWaterfall,
  evaluatePayoffHorizon,
  analyzeWalletLiquidity,
  analyzeInvoiceAging,
  getAgingBucket,
} from "../../src/core/engine/cashflowAnalytics";

describe("cashflowAnalytics", () => {
  describe("calculateCashflow & calculateCashForecast", () => {
    it("returns month outflow, fixed burn share, category totals, and partial invoice progress", () => {
      const result = calculateCashflow({
        month: "2026-10",
        transactions: [
          { date: "2026-10-01", amountMinor: -10000, categoryId: "food" },
          { date: "2026-10-02", amountMinor: 200000 },
          { date: "2026-09-30", amountMinor: -99999 },
        ],
        subscriptions: [{ amountMinor: 4000, billingCycle: "MONTHLY", active: true }],
        invoices: [
          { id: "i", totalMinor: 10000, paidMinor: 2500, status: "PARTIAL" },
          { id: "late", totalMinor: 10000, paidMinor: 500, status: "OVERDUE" },
        ],
      });
      expect(result).toMatchObject({
        netOutflowMinor: -190000,
        fixedBurnPercent: 40,
        categories: [{ categoryId: "food", amountMinor: 10000 }],
        partialInvoices: [
          { invoiceId: "i", paidMinor: 2500, totalMinor: 10000, percentPaid: 25 },
          { invoiceId: "late", paidMinor: 500, totalMinor: 10000, percentPaid: 5 },
        ],
      });
    });

    it("calculates 3-tier metrics: total cash, net gain/loss, and subscription-predicted cash", () => {
      const forecast = calculateCashForecast({
        totalCashMinor: 500000, // 5,000.00 liquid cash
        month: "2026-10",
        transactions: [
          { date: "2026-10-05", amountMinor: 150000 }, // +1,500 inflow
          { date: "2026-10-10", amountMinor: -50000 }, // -500 outflow
          { date: "2026-10-12", amountMinor: -30000, type: "SUBSCRIPTION_PAYMENT", subscriptionId: "sub-netflix" }, // already paid
          { date: "2026-09-28", amountMinor: -80000 }, // out of month
        ],
        subscriptions: [
          { id: "sub-netflix", title: "Netflix", amountMinor: 30000, active: true, nextBillingDate: "2026-11-12" }, // paid this month, rolls to Nov
          { id: "sub-spotify", title: "Spotify", amountMinor: 15000, active: true, nextBillingDate: "2026-10-25" }, // pending this month
          { id: "sub-cloud", title: "Cloud Hosting", amountMinor: 20000, active: true, nextBillingDate: "2026-10-28" }, // pending this month
          { id: "sub-paused", title: "Gym", amountMinor: 10000, active: false, nextBillingDate: "2026-10-30" }, // inactive
        ],
      });

      expect(forecast.totalCashMinor).toBe(500000);
      expect(forecast.inflowsMinor).toBe(150000);
      expect(forecast.outflowsMinor).toBe(80000); // 50000 + 30000
      expect(forecast.netGainLossMinor).toBe(70000); // 150000 - 80000 = +700
      expect(forecast.isNetGain).toBe(true);
      expect(forecast.upcomingSubsMinor).toBe(35000); // Spotify (15000) + Cloud (20000)
      expect(forecast.upcomingSubsCount).toBe(2);
      expect(forecast.projectedCashMinor).toBe(465000); // 500000 - 35000
      expect(forecast.pendingSubscriptions).toEqual([
        { id: "sub-spotify", title: "Spotify", amountMinor: 15000, nextBillingDate: "2026-10-25" },
        { id: "sub-cloud", title: "Cloud Hosting", amountMinor: 20000, nextBillingDate: "2026-10-28" },
      ]);
    });

    it("Golden Ledger Rule: zero double-counting on Transfer and E-wallet cash-in principals", () => {
      // Both calculateCashflow and calculateCashForecast must never count Transfer or Cash-in principal as inflow/outflow
      const cashflow = calculateCashflow({
        month: "2026-10",
        transactions: [
          { date: "2026-10-01", amountMinor: 1000000, type: "INCOME" }, // ₱10,000 real income
          { date: "2026-10-02", amountMinor: -200000, categoryId: "supplies" }, // ₱2,000 expense
          // Transfer: ₱5,000 principal moved with ₱15 fee
          { date: "2026-10-05", amountMinor: -500000, type: "TRANSFER", feeMinor: 1500 },
          // Transfer cash-in with cashIn: true and ₱20 fee
          { date: "2026-10-08", amountMinor: 300000, type: "TRANSFER", cashIn: true, feeMinor: 2000 },
          // EWALLET_CASH_IN type: ₱2,500 principal with ₱10 fee
          { date: "2026-10-10", amountMinor: 250000, type: "EWALLET_CASH_IN", feeMinor: 1000 },
          // Free transfer (₱0 fee)
          { date: "2026-10-12", amountMinor: 150000, type: "TRANSFER", feeMinor: 0 },
        ],
        subscriptions: [],
        invoices: [],
      });

      // Total outflows = 2,000 (supplies) + 15 (fee) + 20 (cash-in fee) + 10 (cash-in fee) = ₱2,045 (204500 minor)
      // Principals (500,000, 300,000, 250,000, 150,000) MUST NOT inflate outflow or inflow!
      // Total inflow = 1,000,000 minor (₱10,000)
      // Net outflow = 204,500 - 1,000,000 = -795,500
      expect(cashflow.netOutflowMinor).toBe(-795500);

      // Verify category breakdown includes only expense and fee categories
      expect(cashflow.categories).toEqual(
        expect.arrayContaining([
          { categoryId: "supplies", amountMinor: 200000 },
          { categoryId: "transfer-fee", amountMinor: 4500 }, // 1500 + 2000 + 1000
        ])
      );

      // Verify forecast also ignores Transfer and Cash-In principals
      const forecast = calculateCashForecast({
        totalCashMinor: 1000000,
        month: "2026-10",
        transactions: [
          { date: "2026-10-01", amountMinor: 500000, type: "INCOME" }, // +₱5,000
          { date: "2026-10-02", amountMinor: -100000 }, // -₱1,000 expense
          { date: "2026-10-05", amountMinor: -400000, type: "TRANSFER", feeMinor: 1500 }, // -₱15 fee
          { date: "2026-10-08", amountMinor: 200000, type: "EWALLET_CASH_IN", feeMinor: 2500 }, // -₱25 fee
        ],
        subscriptions: [],
      });

      expect(forecast.inflowsMinor).toBe(500000);
      expect(forecast.outflowsMinor).toBe(104000); // 100,000 + 1,500 + 2,500
      expect(forecast.netGainLossMinor).toBe(396000);
    });
  });

  describe("Module 1: FeeLeakageReport & calculateFeeLeakage", () => {
    it("correctly aggregates transfer fees, cash-in fees, free transfers, and channels", () => {
      const report = calculateFeeLeakage([
        { kind: "TRANSFER", channel: "INSTAPAY", feePhp: 15 },
        { kind: "TRANSFER", channel: "INSTAPAY", feePhp: 0 }, // Free transfer
        { kind: "TRANSFER", channel: "INSTAPAY", feePhp: 0 }, // Free transfer
        { kind: "TRANSFER", channel: "PESONET", feePhp: 50 },
        { kind: "EWALLET_CASH_IN", feePhp: 25 },
        { kind: "EWALLET_CASH_IN", feePhp: 12.5 },
      ]);

      expect(report.transferFeesPhp).toBe(65); // 15 + 50
      expect(report.cashInFeesPhp).toBe(37.5); // 25 + 12.5
      expect(report.totalFeesLostPhp).toBe(102.5);
      expect(report.freeTransferCount).toBe(2);
      expect(report.estimatedSavingsPhp).toBe(30); // 2 * 15 benchmark
      expect(report.byChannel).toEqual({
        INSTAPAY: 15,
        PESONET: 50,
        OTC_CASH_IN: 37.5,
      });
    });

    it("supports custom fee benchmark and handles minor units if passed", () => {
      const report = calculateFeeLeakage(
        [
          { kind: "TRANSFER", channel: "INSTAPAY", feeMinor: 0 },
          { kind: "TRANSFER", channel: "INSTAPAY", feeMinor: 0 },
          { kind: "TRANSFER", channel: "INSTAPAY", feeMinor: 0 },
          { kind: "TRANSFER", channel: "INSTAPAY", feeMinor: 2500 }, // ₱25
        ],
        20 // ₱20 benchmark
      );

      expect(report.freeTransferCount).toBe(3);
      expect(report.estimatedSavingsPhp).toBe(60); // 3 * 20
      expect(report.transferFeesPhp).toBe(25);
      expect(report.totalFeesLostPhp).toBe(25);
    });

    it("handles edge cases: empty list, zero fees, negative fee clamping, and channel normalization", () => {
      const emptyReport = calculateFeeLeakage([]);
      expect(emptyReport).toEqual({
        totalFeesLostPhp: 0,
        transferFeesPhp: 0,
        cashInFeesPhp: 0,
        freeTransferCount: 0,
        estimatedSavingsPhp: 0,
        byChannel: { INSTAPAY: 0, PESONET: 0, OTC_CASH_IN: 0 },
      });

      const clampedReport = calculateFeeLeakage([
        { kind: "TRANSFER", channel: "pesonet", feePhp: -10 }, // Clamped to 0, counts as free
        { kind: "TRANSFER", feePhp: 15 }, // Channel omitted defaults to INSTAPAY
      ]);
      expect(clampedReport.freeTransferCount).toBe(1);
      expect(clampedReport.transferFeesPhp).toBe(15);
      expect(clampedReport.byChannel.PESONET).toBe(0);
      expect(clampedReport.byChannel.INSTAPAY).toBe(15);
    });
  });

  describe("Module 2: CashflowWaterfall & calculateCommittedWaterfall", () => {
    it("computes committed totals, true safe-to-spend, daily allowance, and commitment ratio", () => {
      const result = calculateCommittedWaterfall({
        totalLiquidPhp: 50000,
        unpaidSubscriptionsThisMonthPhp: 2500,
        unpaidLoanAndInstallmentSlicesPhp: 10000,
        unpaidPayableInvoicesThisMonthPhp: 5000,
        remainingDaysInMonth: 15,
      });

      expect(result.totalLiquidPhp).toBe(50000);
      expect(result.lockedSubscriptionsPhp).toBe(2500);
      expect(result.lockedDebtAndInstallmentsPhp).toBe(10000);
      expect(result.lockedPayableInvoicesPhp).toBe(5000);
      expect(result.totalCommittedPhp).toBe(17500);
      expect(result.trueSafeToSpendPhp).toBe(32500); // 50000 - 17500
      expect(result.dailySafeAllowancePhp).toBe(2166.67); // 32500 / 15
      expect(result.commitmentRatioPercent).toBe(35); // 17500 / 50000 * 100 = 35%
    });

    it("handles overcommitted scenario where obligations exceed liquid cash", () => {
      const result = calculateCommittedWaterfall({
        totalLiquidPhp: 10000,
        unpaidSubscriptionsThisMonthPhp: 4000,
        unpaidLoanAndInstallmentSlicesPhp: 8000,
        unpaidPayableInvoicesThisMonthPhp: 3000,
        remainingDaysInMonth: 10,
      });

      expect(result.totalCommittedPhp).toBe(15000);
      expect(result.trueSafeToSpendPhp).toBe(-5000); // Deficit
      expect(result.dailySafeAllowancePhp).toBe(0); // Clamped at 0, no safe spending
      expect(result.commitmentRatioPercent).toBe(100); // Capped at 100%
    });

    it("handles zero liquid cash, remainingDaysInMonth <= 0, and negative inputs", () => {
      const result = calculateCommittedWaterfall({
        totalLiquidPhp: 0,
        unpaidSubscriptionsThisMonthPhp: -500, // Clamped to 0
        unpaidLoanAndInstallmentSlicesPhp: 0,
        unpaidPayableInvoicesThisMonthPhp: 0,
        remainingDaysInMonth: 0, // Clamped to 1
      });

      expect(result.totalLiquidPhp).toBe(0);
      expect(result.totalCommittedPhp).toBe(0);
      expect(result.trueSafeToSpendPhp).toBe(0);
      expect(result.dailySafeAllowancePhp).toBe(0);
      expect(result.commitmentRatioPercent).toBe(0);
    });
  });

  describe("Module 3: Debt & Installment Payoff Horizon", () => {
    it("evaluates a standard active installment plan in progress", () => {
      const plan = evaluatePayoffHorizon({
        id: "plan-macbook",
        title: "MacBook Pro M3",
        kind: "INSTALLMENT",
        repaymentWalletId: "wallet-gotyme",
        totalObligationPhp: 60000,
        amountPaidPhp: 20000,
        scheduledPaymentPhp: 5000,
      });

      expect(plan.remainingBalancePhp).toBe(40000);
      expect(plan.nextInstallmentChargePhp).toBe(5000);
      expect(plan.remainingInstallmentsCount).toBe(8); // 40000 / 5000
      expect(plan.progressPercent).toBe(33); // 20000 / 60000
    });

    it("caps final payment at the remaining balance when scheduled exceeds remaining", () => {
      // Golden Rule: Final payment must be capped at remaining balance
      const plan = evaluatePayoffHorizon({
        id: "loan-personal",
        title: "Personal Loan",
        kind: "LOAN",
        repaymentWalletId: "wallet-maribank",
        totalObligationPhp: 10000,
        amountPaidPhp: 9350,
        scheduledPaymentPhp: 1000,
      });

      expect(plan.remainingBalancePhp).toBe(650);
      // Scheduled is ₱1,000, but remaining is only ₱650 -> next charge MUST be ₱650!
      expect(plan.nextInstallmentChargePhp).toBe(650);
      expect(plan.remainingInstallmentsCount).toBe(1);
      expect(plan.progressPercent).toBe(94);
    });

    it("handles fully paid and overpaid obligations", () => {
      const fullyPaid = evaluatePayoffHorizon({
        id: "plan-paid",
        title: "Settled Loan",
        kind: "LOAN",
        repaymentWalletId: "wallet-bpi",
        totalObligationPhp: 15000,
        amountPaidPhp: 15000,
        scheduledPaymentPhp: 2500,
      });

      expect(fullyPaid.remainingBalancePhp).toBe(0);
      expect(fullyPaid.nextInstallmentChargePhp).toBe(0);
      expect(fullyPaid.remainingInstallmentsCount).toBe(0);
      expect(fullyPaid.progressPercent).toBe(100);

      const overpaid = evaluatePayoffHorizon({
        id: "plan-overpaid",
        title: "Overpaid Loan",
        kind: "LOAN",
        repaymentWalletId: "wallet-bpi",
        totalObligationPhp: 5000,
        amountPaidPhp: 5500,
        scheduledPaymentPhp: 1000,
      });

      expect(overpaid.remainingBalancePhp).toBe(0);
      expect(overpaid.nextInstallmentChargePhp).toBe(0);
      expect(overpaid.remainingInstallmentsCount).toBe(0);
      expect(overpaid.progressPercent).toBe(100);
    });

    it("handles zero total obligation and zero scheduled payment", () => {
      const zeroPlan = evaluatePayoffHorizon({
        id: "plan-zero",
        title: "Zero Obligation",
        kind: "INSTALLMENT",
        repaymentWalletId: "wallet-cash",
        totalObligationPhp: 0,
        amountPaidPhp: 0,
        scheduledPaymentPhp: 0,
      });

      expect(zeroPlan.remainingBalancePhp).toBe(0);
      expect(zeroPlan.nextInstallmentChargePhp).toBe(0);
      expect(zeroPlan.remainingInstallmentsCount).toBe(0);
      expect(zeroPlan.progressPercent).toBe(100);
    });
  });

  describe("Module 4: WalletRunwayStatus & analyzeWalletLiquidity", () => {
    const wallets = [
      { id: "w-maribank", name: "MariBank Debit", balancePhp: 15000 },
      { id: "w-gotyme", name: "GoTyme Vault", balancePhp: 2000 },
      { id: "w-cash", name: "Cash on Hand", balancePhp: 500 },
    ];

    it("detects exact shortfallPhp when scheduled outflows exceed available balance", () => {
      const commitments = [
        // MariBank has 15,000; outflows = 5,000 + 4,000 = 9,000. Ending = 6,000 (40% remaining -> HEALTHY)
        { walletId: "w-maribank", amountPhp: 5000 },
        { walletId: "w-maribank", amountPhp: 4000 },
        // GoTyme has 2,000; outflows = 1,800. Ending = 200 (10% remaining -> TIGHT)
        { walletId: "w-gotyme", amountPhp: 1800 },
        // Cash has 500; outflows = 1,250. Ending = -750 -> SHORTFALL_WARNING with exact shortfall 750
        { walletId: "w-cash", amountPhp: 1250 },
      ];

      const statuses = analyzeWalletLiquidity(wallets, commitments);

      expect(statuses).toHaveLength(3);

      const maribank = statuses.find((s) => s.walletId === "w-maribank")!;
      expect(maribank.availableBalancePhp).toBe(15000);
      expect(maribank.scheduledOutflowsPhp).toBe(9000);
      expect(maribank.projectedEndingBalancePhp).toBe(6000);
      expect(maribank.shortfallPhp).toBe(0);
      expect(maribank.status).toBe("HEALTHY");

      const gotyme = statuses.find((s) => s.walletId === "w-gotyme")!;
      expect(gotyme.availableBalancePhp).toBe(2000);
      expect(gotyme.scheduledOutflowsPhp).toBe(1800);
      expect(gotyme.projectedEndingBalancePhp).toBe(200);
      expect(gotyme.shortfallPhp).toBe(0);
      expect(gotyme.status).toBe("TIGHT");

      const cash = statuses.find((s) => s.walletId === "w-cash")!;
      expect(cash.availableBalancePhp).toBe(500);
      expect(cash.scheduledOutflowsPhp).toBe(1250);
      expect(cash.projectedEndingBalancePhp).toBe(-750);
      expect(cash.shortfallPhp).toBe(750); // Exact ₱750 shortfall detection
      expect(cash.status).toBe("SHORTFALL_WARNING");
    });

    it("handles zero balance wallets and multi-wallet isolation", () => {
      const walletsWithZero = [
        { id: "w-empty", name: "Empty Account", balancePhp: 0 },
        { id: "w-rich", name: "Main Account", balancePhp: 100000 },
      ];

      // Empty account with 0 outflows stays healthy
      const statusNoOutflows = analyzeWalletLiquidity(walletsWithZero, []);
      expect(statusNoOutflows[0]!.status).toBe("HEALTHY");
      expect(statusNoOutflows[0]!.shortfallPhp).toBe(0);

      // Commitments on w-rich do not affect w-empty
      const statusIsolated = analyzeWalletLiquidity(walletsWithZero, [
        { walletId: "w-rich", amountPhp: 20000 },
      ]);
      expect(statusIsolated[0]!.scheduledOutflowsPhp).toBe(0);
      expect(statusIsolated[0]!.projectedEndingBalancePhp).toBe(0);
      expect(statusIsolated[0]!.shortfallPhp).toBe(0);
      expect(statusIsolated[0]!.status).toBe("HEALTHY");

      // Empty account with ₱500 commitment immediately emits shortfall warning
      const statusDeficit = analyzeWalletLiquidity(walletsWithZero, [
        { walletId: "w-empty", amountPhp: 500 },
      ]);
      expect(statusDeficit[0]!.projectedEndingBalancePhp).toBe(-500);
      expect(statusDeficit[0]!.shortfallPhp).toBe(500);
      expect(statusDeficit[0]!.status).toBe("SHORTFALL_WARNING");
    });
  });

  describe("Module 5: Invoice Aging, Tax & Discount Ledger", () => {
    const asOfDate = "2026-10-31";

    it("correctly buckets overdue receivables into CURRENT, OVERDUE_1_15, OVERDUE_16_30, OVERDUE_30_PLUS", () => {
      expect(getAgingBucket("2026-11-15", asOfDate)).toBe("CURRENT"); // Due in future
      expect(getAgingBucket("2026-10-31", asOfDate)).toBe("CURRENT"); // Due today
      expect(getAgingBucket("2026-10-30", asOfDate)).toBe("OVERDUE_1_15"); // 1 day overdue
      expect(getAgingBucket("2026-10-16", asOfDate)).toBe("OVERDUE_1_15"); // 15 days overdue
      expect(getAgingBucket("2026-10-15", asOfDate)).toBe("OVERDUE_16_30"); // 16 days overdue
      expect(getAgingBucket("2026-10-01", asOfDate)).toBe("OVERDUE_16_30"); // 30 days overdue
      expect(getAgingBucket("2026-09-30", asOfDate)).toBe("OVERDUE_30_PLUS"); // 31 days overdue
      expect(getAgingBucket("2026-08-15", asOfDate)).toBe("OVERDUE_30_PLUS"); // 77 days overdue
    });

    it("aggregates receivables by aging bucket and excludes paid portions", () => {
      const invoices = [
        // Receivable: Current (due Nov 5) - Unpaid ₱10,000
        {
          id: "inv-1",
          direction: "RECEIVABLE" as const,
          dueDate: "2026-11-05",
          totalPhp: 10000,
          paidPhp: 0,
          taxPhp: 1200,
          discountPhp: 500,
        },
        // Receivable: Overdue 5 days (due Oct 26) - Total ₱8,000, partially paid ₱3,000 -> Uncollected ₱5,000
        {
          id: "inv-2",
          direction: "RECEIVABLE" as const,
          dueDate: "2026-10-26",
          totalPhp: 8000,
          paidPhp: 3000,
          taxPhp: 960,
          discountPhp: 0,
        },
        // Receivable: Overdue 20 days (due Oct 11) - Unpaid ₱4,000
        {
          id: "inv-3",
          direction: "RECEIVABLE" as const,
          dueDate: "2026-10-11",
          totalPhp: 4000,
          paidPhp: 0,
          taxPhp: 480,
          discountPhp: 200,
        },
        // Receivable: Overdue 40 days (due Sep 21) - Unpaid ₱15,000
        {
          id: "inv-4",
          direction: "RECEIVABLE" as const,
          dueDate: "2026-09-21",
          totalPhp: 15000,
          paidPhp: 0,
          taxPhp: 1800,
          discountPhp: 1000,
        },
        // Receivable: Fully paid invoice - Should NOT add to uncollected
        {
          id: "inv-paid",
          direction: "RECEIVABLE" as const,
          dueDate: "2026-09-01",
          status: "PAID",
          totalPhp: 20000,
          paidPhp: 20000,
          taxPhp: 2400,
          discountPhp: 0,
        },
      ];

      const report = analyzeInvoiceAging(invoices, asOfDate);

      expect(report.totalReceivablesPhp).toBe(57000); // 10000 + 8000 + 4000 + 15000 + 20000
      expect(report.uncollectedReceivablesPhp).toBe(34000); // 10000 + 5000 + 4000 + 15000
      expect(report.byAgingBucket).toEqual({
        CURRENT: 10000,
        OVERDUE_1_15: 5000,
        OVERDUE_16_30: 4000,
        OVERDUE_30_PLUS: 15000,
      });
      expect(report.receivablesByAging).toEqual(report.byAgingBucket);

      // Cumulative tax & discounts include all invoices (even paid ones)
      // Taxes: 1200 + 960 + 480 + 1800 + 2400 = ₱6,840
      expect(report.totalTaxPhp).toBe(6840);
      expect(report.taxPhp).toBe(6840);
      // Discounts: 500 + 0 + 200 + 1000 + 0 = ₱1,700
      expect(report.totalDiscountPhp).toBe(1700);
      expect(report.discountPhp).toBe(1700);
    });

    it("aggregates both Receivable (+) and Payable (-) invoices and computes net uncollected", () => {
      const invoices = [
        // Receivable: ₱10,000 uncollected
        {
          direction: "RECEIVABLE" as const,
          dueDate: "2026-11-10",
          totalPhp: 10000,
          paidPhp: 0,
          taxPhp: 1200,
          discountPhp: 0,
        },
        // Payable: ₱6,000 unpaid (due Oct 20 -> OVERDUE_1_15)
        {
          direction: "PAYABLE" as const,
          dueDate: "2026-10-20",
          totalPhp: 6000,
          paidPhp: 0,
          taxPhp: 720,
          discountPhp: 100,
        },
      ];

      const report = analyzeInvoiceAging(invoices, asOfDate);

      expect(report.totalReceivablesPhp).toBe(10000);
      expect(report.uncollectedReceivablesPhp).toBe(10000);
      expect(report.totalPayablesPhp).toBe(6000);
      expect(report.unpaidPayablesPhp).toBe(6000);
      expect(report.netUncollectedPhp).toBe(4000); // 10000 - 6000

      expect(report.receivablesByAging.CURRENT).toBe(10000);
      expect(report.payablesByAging.OVERDUE_1_15).toBe(6000);
      expect(report.totalTaxPhp).toBe(1920); // 1200 + 720
      expect(report.totalDiscountPhp).toBe(100);
    });

    it("supports minor units (minor unit input conversion)", () => {
      const report = analyzeInvoiceAging(
        [
          {
            direction: "RECEIVABLE",
            dueDate: "2026-10-31",
            totalMinor: 500000, // ₱5,000
            paidMinor: 200000, // ₱2,000
            taxMinor: 60000, // ₱600
            discountMinor: 25000, // ₱250
          },
        ],
        asOfDate
      );

      expect(report.totalReceivablesPhp).toBe(5000);
      expect(report.uncollectedReceivablesPhp).toBe(3000);
      expect(report.byAgingBucket.CURRENT).toBe(3000);
      expect(report.totalTaxPhp).toBe(600);
      expect(report.totalDiscountPhp).toBe(250);
    });

    it("handles empty invoice arrays gracefully", () => {
      const report = analyzeInvoiceAging([]);

      expect(report.totalReceivablesPhp).toBe(0);
      expect(report.uncollectedReceivablesPhp).toBe(0);
      expect(report.totalPayablesPhp).toBe(0);
      expect(report.unpaidPayablesPhp).toBe(0);
      expect(report.netUncollectedPhp).toBe(0);
      expect(report.totalTaxPhp).toBe(0);
      expect(report.totalDiscountPhp).toBe(0);
      expect(report.byAgingBucket).toEqual({
        CURRENT: 0,
        OVERDUE_1_15: 0,
        OVERDUE_16_30: 0,
        OVERDUE_30_PLUS: 0,
      });
    });
  });
});
