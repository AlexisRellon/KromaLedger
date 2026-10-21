import { describe, expect, it } from "vitest";
import { createDemoSeed } from "../../src/core/engine/demoSeed";

describe("createDemoSeed", () => {
  it("returns valid relative demo data with real ledger-derived dashboard net outflow", () => {
    const seed = createDemoSeed("2026-10-20");
    const month = seed.transactions.filter((row) => row.date.startsWith("2026-10"));
    expect(month.reduce((sum, row) => sum + row.amountMinor, 0)).toBe(-2450000);
    expect(seed.transactions.find((row) => row.title === "GitHub Copilot Pro")).toMatchObject({ type: "SUBSCRIPTION_PAYMENT", amountMinor: -56000 });
    expect(seed.transactions.find((row) => row.title === "Invoice #104 Payment")).toMatchObject({ invoiceId: "inv-104", amountMinor: 30000 });
    expect(seed.categories.some((row) => row.name === "Dining")).toBe(true);
    expect(seed.subscriptions.find((row) => row.id === "sub-netflix")?.nextBillingDate).toBe("2026-10-21");
    expect(seed.invoices.find((row) => row.id === "inv-104")?.dueDate).toBe("2026-10-24");
  });
});
