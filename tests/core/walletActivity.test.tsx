import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Transaction } from "../../src/core/models";
import { filterWalletActivity, type WalletActivityFilters } from "../../src/core/engine/walletActivity";
import { WalletActivity } from "../../src/ui/components/WalletActivity";
import { ActivityFilters } from "../../src/ui/components/ActivityFilters";

const empty: WalletActivityFilters = { search: "", type: "", startDate: "", endDate: "" };
const entries: [Transaction, Transaction, Transaction, Transaction] = [
  { id: "expense", title: "Groceries", date: "2026-10-31", type: "EXPENSE", amountMinor: -500, currency: "PHP" },
  { id: "income", title: "MariBank", date: "2026-11-05", type: "INCOME", amountMinor: 54, currency: "PHP" },
  { id: "transfer", title: "Savings", date: "2026-11-02", type: "TRANSFER", amountMinor: 1000, currency: "PHP", walletId: "source", toWalletId: "destination" },
  { id: "subscription", title: "Music", date: "2026-11-01", type: "SUBSCRIPTION_PAYMENT", amountMinor: -100, currency: "PHP" },
];

describe("wallet activity", () => {
  it("sorts newest first without mutating the source history", () => {
    expect(filterWalletActivity(entries, empty).map((tx) => tx.id)).toEqual(["income", "transfer", "subscription", "expense"]);
    expect(entries[0].id).toBe("expense");
  });

  it("combines case-insensitive title, type and inclusive date filters", () => {
    expect(filterWalletActivity(entries, { search: "  MARIBANK  ", type: "INCOME", startDate: "2026-11-05", endDate: "2026-11-05" })).toEqual([entries[1]]);
    expect(filterWalletActivity(entries, { ...empty, type: "EXPENSE", startDate: "2026-11-01" })).toEqual([]);
  });

  it("supports open date bounds, subscription payments and transfers", () => {
    expect(filterWalletActivity(entries, { ...empty, endDate: "2026-11-01" }).map((tx) => tx.id)).toEqual(["subscription", "expense"]);
    expect(filterWalletActivity(entries, { ...empty, type: "SUBSCRIPTION_PAYMENT" })).toEqual([entries[3]]);
    expect(filterWalletActivity(entries, { ...empty, type: "TRANSFER" })).toEqual([entries[2]]);
    expect(filterWalletActivity(entries, { ...empty, startDate: "2026-11-05", endDate: "2026-11-01" })).toEqual([]);
  });

  it("finds invoice entries of either transaction type", () => {
    const invoices: Transaction[] = [
      { ...entries[0], invoiceId: "payable" },
      { ...entries[1], invoiceId: "receivable" },
      entries[2],
    ];
    expect(filterWalletActivity(invoices, { ...empty, type: "INVOICE" }).map((tx) => tx.invoiceId))
      .toEqual(["receivable", "payable"]);
  });

  it("shows date range errors and a way to clear active filters", () => {
    const html = renderToStaticMarkup(createElement(ActivityFilters, {
      filters: { ...empty, startDate: "2026-11-05", endDate: "2026-11-01" },
      onChange() {}, shownCount: 0, totalCount: 0,
    }));
    expect(html).toContain('role="alert"');
    expect(html).toContain("Choose a date on or after the from date.");
    expect(html).toContain("Clear filters");
  });

  it("offers more entries beyond the initial eight and exposes labeled filters", () => {
    const transactions = Array.from({ length: 9 }, (_, i) => ({ ...entries[1], id: `entry-${i}`, title: `Entry ${i}` }));
    const render = (walletTransactions: Transaction[]) => renderToStaticMarkup(createElement(WalletActivity, {
      activeWallet: null, walletTransactions, onQuickAdd() {}, onEdit() {}, onDelete() {},
    }));
    const html = render(transactions);
    expect(html).toContain("Show more entries");
    expect(html).toContain("Showing 8 of 9 entries");
    expect(html).not.toContain("Entry 8");
    for (const label of ["Search entries", "Entry type", "From date", "To date"]) expect(html).toContain(label);
    expect(render(transactions.slice(0, 8))).not.toContain("Show more entries");
    expect(render([])).toContain("No transactions recorded for this wallet yet.");
  });

  it("labels each month once in chronological activity order", () => {
    const html = renderToStaticMarkup(createElement(WalletActivity, {
      activeWallet: null, walletTransactions: entries, onQuickAdd() {}, onEdit() {}, onDelete() {},
    }));
    expect(html.match(/Nov 2026/g)).toHaveLength(1);
    expect(html.match(/Oct 2026/g)).toHaveLength(1);
    expect(html.indexOf("Nov 2026")).toBeLessThan(html.indexOf("MariBank"));
    expect(html.indexOf("Oct 2026")).toBeGreaterThan(html.indexOf("Music"));
    expect(html.indexOf("Oct 2026")).toBeLessThan(html.indexOf("Groceries"));
  });
});
