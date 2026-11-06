import "fake-indexeddb/auto";
import { createElement } from "react";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { KromaLedgerDB } from "../../src/adapters/web-dexie/db";
import { DexieStorageRepo } from "../../src/adapters/web-dexie/DexieStorageRepo";
import { DexieFileStore } from "../../src/adapters/web-dexie/DexieFileStore";
import { StorageProvider, type StorageServices } from "../../src/state/StorageContext";
import { WebPresentationProvider } from "../../src/ui/adapters/WebPresentationProvider";
import { HomeDashboard } from "../../src/ui/screens/HomeDashboard";
import { queryKeys } from "../../src/state/queries";
import type { Wallet } from "../../src/core/models";

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
});

afterEach(() => {
  db.close();
});

function renderHome(mode?: "ALL" | "CORE" | "ANALYTICS", showAnalytics = true) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(queryKeys.transactions, []);
  client.setQueryData(queryKeys.subscriptions, []);
  client.setQueryData(queryKeys.invoices, []);
  client.setQueryData(queryKeys.categories, []);
  client.setQueryData(queryKeys.attachments, []);
  client.setQueryData<Wallet[]>(queryKeys.wallets, [
    {
      id: "w-1",
      name: "Main Vault",
      type: "BANK",
      currency: "PHP",
      balanceMinor: 2500000,
      color: "#D9F938",
      isDefault: true,
      createdAt: "2026-10-01",
    },
  ]);

  return renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client },
      createElement(
        StorageProvider,
        { value: services },
        createElement(
          WebPresentationProvider,
          null,
          createElement(HomeDashboard, {
            month: "2026-11",
            onQuickAdd: () => {},
            transactions: [],
            categories: [],
            showAnalytics,
            defaultViewMode: mode,
          })
        )
      )
    )
  );
}

describe("HomeDashboard View Mode Switcher & Card Partitioning", () => {
  it("renders 3-way toggle pill and month badge", () => {
    const html = renderHome("ALL");
    expect(html).toContain("MONTH:");
    expect(html).toContain("November 2026");
    expect(html).toContain("All Cards");
    expect(html).toContain("Core Ledger");
    expect(html).toContain("Deep Analytics");
  });

  it("renders both Core Ledger and Deep Analytics cards when mode is ALL", () => {
    const html = renderHome("ALL", true);
    // Core cards
    expect(html).toContain("Total Liquid Cash");
    expect(html).toContain("Recent activity");
    expect(html).toContain("Monthly burn");
    expect(html).toContain("Top categories");
    // Analytics cards
    expect(html).toContain("Committed Cashflow Waterfall");
    expect(html).toContain("Transfer &amp; Cash-In Friction");
    expect(html).toContain("Per-Wallet Liquidity &amp; Shortfall Radar");
    expect(html).toContain("Invoice Aging &amp; Tax Ledger");
  });

  it("renders ONLY Core Ledger cards when mode is CORE", () => {
    const html = renderHome("CORE", true);
    // Core cards present
    expect(html).toContain("Total Liquid Cash");
    expect(html).toContain("Recent activity");
    expect(html).toContain("Monthly burn");
    expect(html).toContain("Top categories");
    // Analytics cards absent
    expect(html).not.toContain("Committed Cashflow Waterfall");
    expect(html).not.toContain("Transfer &amp; Cash-In Friction");
    expect(html).not.toContain("Per-Wallet Liquidity &amp; Shortfall Radar");
    expect(html).not.toContain("Invoice Aging &amp; Tax Ledger");
  });

  it("renders ONLY Deep Analytics cards when mode is ANALYTICS", () => {
    const html = renderHome("ANALYTICS", true);
    // Core cards absent
    expect(html).not.toContain("Total Liquid Cash");
    expect(html).not.toContain("Recent activity");
    expect(html).not.toContain("Monthly burn");
    expect(html).not.toContain("Top categories");
    // Analytics cards present
    expect(html).toContain("Committed Cashflow Waterfall");
    expect(html).toContain("Transfer &amp; Cash-In Friction");
    expect(html).toContain("Per-Wallet Liquidity &amp; Shortfall Radar");
    expect(html).toContain("Invoice Aging &amp; Tax Ledger");
  });

  it("renders quick-action triggers in empty states", () => {
    const html = renderHome("CORE");
    expect(html).toContain("No entries match this filter.");
    expect(html).toContain("No outflow categories recorded yet.");
    expect(html).toContain("+ Log Expense");
  });
});
