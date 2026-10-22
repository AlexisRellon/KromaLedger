import { describe, expect, it } from "vitest";
import { reconcile } from "../../src/core/engine/reconciler";
import type { Subscription, Invoice } from "../../src/core/models";

const sub = (overrides: Partial<Subscription> = {}): Subscription => ({ id: "s1", title: "Monthly", amountMinor: 54900, currency: "PHP", billingCycle: "MONTHLY", nextBillingDate: "2026-01-31", active: true, autoLog: true, ...overrides });
const invoice = (overrides: Partial<Invoice> = {}): Invoice => ({ id: "i1", title: "Invoice", direction: "PAYABLE", dueDate: "2026-10-19", status: "PENDING", subtotalMinor: 10000, taxMinor: 0, discountMinor: 0, totalMinor: 10000, paidMinor: 0, currency: "PHP", itemIds: [], ...overrides });

describe("reconcile", () => {
  it("backfills monthly dates chronologically with month-end anchoring and stable ids", () => {
    const input = { subscriptions: [sub()], invoices: [], lastReconciledDate: "2026-01-30", currentDate: "2026-03-31" };
    const first = reconcile(input);
    expect(first.transactions.map((t) => t.date)).toEqual(["2026-01-31", "2026-02-28", "2026-03-31"]);
    expect(first.subscriptions[0]?.nextBillingDate).toBe("2026-04-30");
    expect(reconcile({ ...input, subscriptions: first.subscriptions }).transactions).toEqual([]);
    const committed = reconcile({ ...input, currentDate: "2026-02-28" });
    const next = reconcile({ ...input, lastReconciledDate: "2026-02-28", currentDate: "2026-03-31", subscriptions: committed.subscriptions });
    expect(next.transactions.map((t) => t.date)).toEqual(["2026-03-31"]);
  });
  it("uses leap-day-safe yearly cycles", () => {
    const result = reconcile({ subscriptions: [sub({ billingCycle: "YEARLY", nextBillingDate: "2024-02-29" })], invoices: [], lastReconciledDate: "2024-02-28", currentDate: "2025-02-28" });
    expect(result.transactions.map((t) => t.date)).toEqual(["2024-02-29", "2025-02-28"]);
  });
  it("returns deterministic confirmation items without logging or advancing non-auto subscriptions", () => {
    const result = reconcile({ subscriptions: [sub({ autoLog: false })], invoices: [], lastReconciledDate: "2026-01-30", currentDate: "2026-02-28" });
    expect(result.transactions).toEqual([]);
    expect(result.pendingConfirmations.map((p) => p.date)).toEqual(["2026-01-31", "2026-02-28"]);
    expect(result.subscriptions[0]?.nextBillingDate).toBe("2026-01-31");
  });
  it("marks overdue only when due date is before today", () => {
    const result = reconcile({ subscriptions: [], invoices: [invoice({ dueDate: "2026-10-20" }), invoice({ id: "i2", dueDate: "2026-10-19", status: "PARTIAL", paidMinor: 2000 })], lastReconciledDate: "2026-10-19", currentDate: "2026-10-20" });
    expect(result.invoices.map((i) => i.status)).toEqual(["PENDING", "OVERDUE"]);
  });

  it("postpones due date to tomorrow and generates warning notification when wallet balance is insufficient", () => {
    const wallet = { id: "w-gcash", name: "GCash", type: "E_WALLET" as const, currency: "PHP" as const, balanceMinor: 20000, color: "#007DFE", isDefault: false };
    const subscription = sub({ id: "sub-netflix", walletId: "w-gcash", amountMinor: 54900, nextBillingDate: "2026-10-22", autoLog: true });

    const result = reconcile({
      subscriptions: [subscription],
      invoices: [],
      currentDate: "2026-10-22",
      wallets: [wallet],
    });

    expect(result.transactions).toHaveLength(0);
    expect(result.subscriptions[0]?.nextBillingDate).toBe("2026-10-23");
    expect(result.subscriptions[0]?.billingAnchorDate).toBe("2026-10-22");
    expect(result.notifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "WARNING",
          entityType: "SUBSCRIPTION",
          entityId: "sub-netflix",
        }),
      ])
    );
  });

  it("postpones due date to tomorrow when subscription has no linked wallet and wallets list is supplied", () => {
    const wallet = { id: "w-cash", name: "Cash", type: "CASH" as const, currency: "PHP" as const, balanceMinor: 500000, color: "#10B981", isDefault: true };
    const subscription = sub({ id: "sub-unlinked", walletId: undefined, amountMinor: 50000, nextBillingDate: "2026-10-22", autoLog: true });

    const result = reconcile({
      subscriptions: [subscription],
      invoices: [],
      currentDate: "2026-10-22",
      wallets: [wallet],
    });

    expect(result.transactions).toHaveLength(0);
    expect(result.subscriptions[0]?.nextBillingDate).toBe("2026-10-23");
    expect(result.notifications.some((n) => n.type === "WARNING")).toBe(true);
  });

  it("deducts and advances regular billing cycle when wallet has sufficient balance", () => {
    const wallet = { id: "w-bank", name: "Bank", type: "BANK" as const, currency: "PHP" as const, balanceMinor: 100000, color: "#6366F1", isDefault: false };
    const subscription = sub({ id: "sub-cloud", walletId: "w-bank", amountMinor: 50000, nextBillingDate: "2026-10-22", autoLog: true, billingCycle: "MONTHLY" });

    const result = reconcile({
      subscriptions: [subscription],
      invoices: [],
      currentDate: "2026-10-22",
      wallets: [wallet],
    });

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0]?.amountMinor).toBe(-50000);
    expect(result.transactions[0]?.walletId).toBe("w-bank");
    expect(result.subscriptions[0]?.nextBillingDate).toBe("2026-11-22");
  });

  it("generates upcoming reminder notifications 3 days in advance and on due date", () => {
    const subIn3Days = sub({ id: "s-3d", title: "Spotify", nextBillingDate: "2026-10-25" });
    const subToday = sub({ id: "s-today", title: "Apple", nextBillingDate: "2026-10-22" });

    const result = reconcile({
      subscriptions: [subIn3Days, subToday],
      invoices: [],
      currentDate: "2026-10-22",
    });

    expect(result.notifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "INFO", entityId: "s-3d" }),
        expect.objectContaining({ type: "ALERT", entityId: "s-today" }),
      ])
    );
  });
});
