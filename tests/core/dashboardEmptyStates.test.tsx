import "fake-indexeddb/auto";
import { createElement } from "react";import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { KromaLedgerDB } from "../../src/adapters/web-dexie/db";
import { DexieStorageRepo } from "../../src/adapters/web-dexie/DexieStorageRepo";
import { DexieFileStore } from "../../src/adapters/web-dexie/DexieFileStore";
import { StorageProvider, type StorageServices } from "../../src/state/StorageContext";
import { WebPresentationProvider } from "../../src/ui/adapters/WebPresentationProvider";
import { HomeDashboard } from "../../src/ui/screens/HomeDashboard";
import { queryKeys } from "../../src/state/queries";
import type { Category, Transaction, Wallet } from "../../src/core/models";

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

function renderDashboard(categories: Category[], transactions: Transaction[]) {
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
      balanceMinor: 100000,
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
            transactions,
            categories,
          })
        )
      )
    )
  );
}

describe("HomeDashboard empty-state watermark conditional render", () => {
  it("shows t'nalak watermark on empty Top categories and Recent activity", () => {
    const html = renderDashboard([], []);
    expect(html).toContain("No outflow categories recorded yet.");
    expect(html).toContain("No entries match this filter.");
    expect(html.match(/data-empty-state-watermark="true"/g)?.length).toBe(2);
    expect(html).toContain("url(#pattern-tnalak-circuit)");
  });

  it("unmounts the watermark when both lists are populated", () => {
    const html = renderDashboard(
      [{ id: "cat-ops", name: "Operations", type: "EXPENSE" }],
      [
        {
          id: "tx-expense",
          date: "2026-11-02",
          title: "Studio Supplies",
          amountMinor: -35000,
          currency: "PHP",
          type: "EXPENSE",
          categoryId: "cat-ops",
          walletId: "w-1",
        },
      ]
    );
    expect(html).toContain("Studio Supplies");
    expect(html).not.toContain("data-empty-state-watermark");
  });

  it("shows the watermark for a month with income only (Top categories empty)", () => {
    const html = renderDashboard([], [
      {
        id: "tx-income",
        date: "2026-11-03",
        title: "Client Retainer",
        amountMinor: 150000,
        currency: "PHP",
        type: "INCOME",
        walletId: "w-1",
      },
    ]);
    expect(html).toContain("Client Retainer");
    // Populated activity stays untouched; only the empty Top categories panel carries the watermark.
    expect(html.match(/data-empty-state-watermark="true"/g)?.length).toBe(1);
    expect(html).toContain("No outflow categories recorded yet.");
  });
});
