import "fake-indexeddb/auto";
import React, { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { KromaLedgerDB } from "../../src/adapters/web-dexie/db";
import { DexieStorageRepo } from "../../src/adapters/web-dexie/DexieStorageRepo";
import { DexieFileStore } from "../../src/adapters/web-dexie/DexieFileStore";
import { StorageProvider, type StorageServices } from "../../src/state/StorageContext";
import { WebPresentationProvider } from "../../src/ui/adapters/WebPresentationProvider";
import { HomeDashboard } from "../../src/ui/screens/HomeDashboard";
import { CashflowBreakdownGraph } from "../../src/ui/components/CashflowBreakdownGraph";
import { QuickAddDrawer } from "../../src/ui/components/QuickAddDrawer";
import { StackedWalletDeck } from "../../src/ui/components/StackedWalletDeck";
import { FloatingNavPill } from "../../src/ui/components/FloatingNavPill";
import { WalletsScreen } from "../../src/ui/screens/WalletsScreen";
import { SettingsScreen } from "../../src/ui/screens/SettingsScreen";
import { queryKeys } from "../../src/state/queries";
import { useUIStore } from "../../src/state/useUIStore";
import type { Transaction, Wallet } from "../../src/core/models";

let db: KromaLedgerDB;
let repo: DexieStorageRepo;
let services: StorageServices;

beforeEach(async () => {
  db = new KromaLedgerDB();
  await db.delete();
  db = new KromaLedgerDB();
  repo = new DexieStorageRepo(db);
  const files = new DexieFileStore(db);
  services = {
    repo,
    files,
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

function wrapWithProviders(client: QueryClient, node: React.ReactNode) {
  return createElement(
    QueryClientProvider,
    { client },
    createElement(
      StorageProvider,
      { value: services },
      createElement(WebPresentationProvider, null, node)
    )
  );
}

it("uses theme colors for entry, wallet, and navigation actions", () => {
  const client = new QueryClient();
  client.setQueryData(queryKeys.wallets, []);
  client.setQueryData(queryKeys.categories, []);
  const drawer = renderToStaticMarkup(wrapWithProviders(client, createElement(QuickAddDrawer, { onClose: () => {} })));
  expect(drawer).toMatch(/bg-\[var\(--theme-primary\)\][^>]*text-\[var\(--theme-text-on-primary\)\][^>]*>Save Entry/);
  expect(drawer).toContain("text-[var(--theme-accent-text)]");
  const deck = renderToStaticMarkup(wrapWithProviders(client, createElement(StackedWalletDeck, { wallets: [], defaultCurrency: "PHP" })));
  expect(deck).toMatch(/bg-\[var\(--theme-primary\)\][^>]*text-\[var\(--theme-text-on-primary\)\][^>]*>\s*\+ Create your first card/);
  const nav = renderToStaticMarkup(createElement(FloatingNavPill));
  expect(nav).toContain("bg-[var(--theme-primary)]");
  expect(nav).toContain("text-[var(--theme-text-on-primary)]");
});

describe("HomeDashboard & CashflowBreakdownGraph month switching", () => {
  const octoberTransactions: Transaction[] = [
    {
      id: "tx-oct-in",
      date: "2026-10-10",
      title: "Client Retainer",
      amountMinor: 150000,
      currency: "PHP",
      type: "INCOME",
      walletId: "w-1",
    },
    {
      id: "tx-oct-out",
      date: "2026-10-18",
      title: "Studio Supplies",
      amountMinor: -35000,
      currency: "PHP",
      type: "EXPENSE",
      categoryId: "cat-ops",
      walletId: "w-1",
    },
  ];

  it("retains October chart values and updates active month label when switching from October to November", () => {
    const octHtml = renderToStaticMarkup(
      createElement(CashflowBreakdownGraph, {
        transactions: octoberTransactions,
        selectedMonth: "2026-10",
        currentDate: new Date("2026-11-01T12:00:00Z"),
      })
    );
    expect(octHtml).toContain("Oct (2026)");
    expect(octHtml).toContain("+₱1,150.00");
    expect(octHtml).toContain('title="In: ₱1,500.00"');
    expect(octHtml).toContain('title="Out: ₱350.00"');

    const novHtml = renderToStaticMarkup(
      createElement(CashflowBreakdownGraph, {
        transactions: octoberTransactions,
        selectedMonth: "2026-11",
        currentDate: new Date("2026-11-01T12:00:00Z"),
      })
    );
    // Active month header updates to Nov (2026)
    expect(novHtml).toContain("Nov (2026)");
    // Historical October bar remains visible with its non-zero inflow/outflow values
    expect(novHtml).toContain('title="In: ₱1,500.00"');
    expect(novHtml).toContain('title="Out: ₱350.00"');
    expect(novHtml).toContain("height:100%");
  });

  it("HomeDashboard supplies full historical transactions to the chart when selected month has no transactions", () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData<Transaction[]>(queryKeys.transactions, octoberTransactions);
    client.setQueryData<Transaction[]>(queryKeys.transactionMonth("2026-11"), []);
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
        balanceMinor: 1086934,
        color: "#D9F938",
        isDefault: true,
        createdAt: "2026-10-01",
      },
    ]);

    useUIStore.setState({ selectedMonth: "2026-11" });

    const html = renderToStaticMarkup(
      wrapWithProviders(
        client,
        createElement(HomeDashboard, {
          month: "2026-11",
          onQuickAdd: () => {},
        })
      )
    );

    expect(html).toContain("in November 2026");
    expect(html).toContain("Nov (2026)");
    expect(html).toContain('title="In: ₱1,500.00"');
    expect(html).toContain('title="Out: ₱350.00"');
  });

  it("shows the shared activity filters and loads only the first eight dashboard entries", () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const transactions = Array.from({ length: 10 }, (_, i) => ({
      ...octoberTransactions[0]!, id: `activity-${i}`, title: `Activity entry ${i}`,
    }));
    const html = renderToStaticMarkup(wrapWithProviders(client, createElement(HomeDashboard, {
      month: "2026-10", transactions, subscriptions: [], attachments: [], categories: [],
      isLoading: false, defaultViewMode: "CORE", onQuickAdd() {},
    })));
    for (const label of ["Search entries", "Entry type", "From date", "To date", "Show more entries"]) {
      expect(html).toContain(label);
    }
    expect(html).toContain("Showing 8 of 10 entries");
    expect(html).toContain("Activity entry 7");
    expect(html).not.toContain("Activity entry 8");
  });

  it("renders WalletsScreen and SettingsScreen cleanly across cold unhydrated and warm hydrated query caches", async () => {
    await repo.initialize("2026-10-20");

    const coldClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const coldWalletsHtml = renderToStaticMarkup(
      wrapWithProviders(coldClient, createElement(WalletsScreen, { onQuickAdd: () => {} }))
    );
    expect(coldWalletsHtml).toContain('aria-label="Loading wallets overview"');

    const coldSettingsHtml = renderToStaticMarkup(
      wrapWithProviders(coldClient, createElement(SettingsScreen, { onOpenBackup: () => {} }))
    );
    expect(coldSettingsHtml).toContain('aria-label="Loading settings and vault profile"');

    const profile = await repo.getProfile();
    const warmClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    warmClient.setQueryData(queryKeys.wallets, await repo.listWallets());
    warmClient.setQueryData(queryKeys.transactions, await repo.listTransactions());
    warmClient.setQueryData(queryKeys.profile, profile);

    const warmWalletsHtml = renderToStaticMarkup(
      wrapWithProviders(warmClient, createElement(WalletsScreen, { onQuickAdd: () => {} }))
    );
    expect(warmWalletsHtml).toContain("Liquid Wallets &amp; Accounts");

    const warmSettingsHtml = renderToStaticMarkup(
      wrapWithProviders(warmClient, createElement(SettingsScreen, { onOpenBackup: () => {} }))
    );
    expect(warmSettingsHtml).toContain(profile.name);
  });
});
