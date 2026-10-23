import { describe, expect, it, vi } from "vitest";
import { AttachmentCacheManager } from "../../src/adapters/web-dexie/attachmentCache";
import { calculateCashflow } from "../../src/core/engine/cashflowAnalytics";
import { queryKeys } from "../../src/state/queries";

describe("Caching Strategy & Performance Optimizations", () => {
  describe("AttachmentCacheManager", () => {
    it("reuses cached Object URL on subsequent loads without re-invoking loader", async () => {
      const cache = new AttachmentCacheManager(5);
      const loader = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4]));

      // Mock URL.createObjectURL and URL.revokeObjectURL
      let urlCount = 0;
      const createdUrls: string[] = [];
      const revokedUrls: string[] = [];

      vi.spyOn(URL, "createObjectURL").mockImplementation(() => {
        const url = `blob:test-host/${++urlCount}`;
        createdUrls.push(url);
        return url;
      });
      vi.spyOn(URL, "revokeObjectURL").mockImplementation((url) => {
        revokedUrls.push(url);
      });

      const url1 = await cache.getOrLoad("att-1", "image/webp", loader);
      expect(url1).toBe("blob:test-host/1");
      expect(loader).toHaveBeenCalledTimes(1);

      // Second load: cache hit, loader NOT called again
      const url2 = await cache.getOrLoad("att-1", "image/webp", loader);
      expect(url2).toBe("blob:test-host/1");
      expect(loader).toHaveBeenCalledTimes(1);

      vi.restoreAllMocks();
    });

    it("evicts least recently accessed URL when exceeding capacity and calls revokeObjectURL", async () => {
      const cache = new AttachmentCacheManager(2);
      const revoked: string[] = [];
      vi.spyOn(URL, "createObjectURL").mockImplementation(() => `blob:mock/${Math.random().toString(36).slice(2)}`);
      vi.spyOn(URL, "revokeObjectURL").mockImplementation((url) => revoked.push(url));

      const loadBytes = () => Promise.resolve(new Uint8Array([0]));

      const urlA = await cache.getOrLoad("A", "image/webp", loadBytes);
      const urlB = await cache.getOrLoad("B", "image/webp", loadBytes);
      expect(cache.size()).toBe(2);

      // Access A to make B the least recently accessed
      cache.get("A");

      // Load C: triggers LRU eviction of B
      const urlC = await cache.getOrLoad("C", "image/webp", loadBytes);
      expect(cache.size()).toBe(2);
      expect(revoked).toContain(urlB);
      expect(cache.get("B")).toBeUndefined();
      expect(cache.get("A")).toBe(urlA);
      expect(cache.get("C")).toBe(urlC);

      vi.restoreAllMocks();
    });

    it("evicts on demand and cleans up object URLs on clear()", async () => {
      const cache = new AttachmentCacheManager(5);
      const revoked: string[] = [];
      vi.spyOn(URL, "createObjectURL").mockImplementation(() => `blob:mock/${Math.random()}`);
      vi.spyOn(URL, "revokeObjectURL").mockImplementation((url) => revoked.push(url));

      const url = await cache.getOrLoad("X", "image/webp", () => Promise.resolve(new Uint8Array([1])));
      cache.evict("X");
      expect(revoked).toContain(url);
      expect(cache.get("X")).toBeUndefined();

      await cache.getOrLoad("Y", "image/webp", () => Promise.resolve(new Uint8Array([2])));
      cache.clear();
      expect(cache.size()).toBe(0);

      vi.restoreAllMocks();
    });
  });

  describe("Granular Query Keys", () => {
    it("generates structured monthly and count keys", () => {
      expect(queryKeys.transactionMonth("2026-10")).toEqual(["transactions", "2026-10"]);
      expect(queryKeys.transactionCount).toEqual(["transactions", "count"]);
      expect(queryKeys.transactions).toEqual(["transactions"]);
    });
  });

  describe("Month-Scoped Cashflow Isolation", () => {
    it("produces identical metrics when passing month-filtered transactions vs full historical dataset", () => {
      const allTransactions = [
        { date: "2026-08-15", amountMinor: -50000, categoryId: "rent" },
        { date: "2026-09-01", amountMinor: 100000 },
        { date: "2026-10-05", amountMinor: -25000, categoryId: "dining" },
        { date: "2026-10-12", amountMinor: 150000 },
        { date: "2026-10-20", amountMinor: -10000, categoryId: "groceries" },
        { date: "2026-11-01", amountMinor: -30000, categoryId: "utilities" },
      ];

      const monthFiltered = allTransactions.filter((t) => t.date.startsWith("2026-10-"));

      const fromAll = calculateCashflow({
        month: "2026-10",
        transactions: allTransactions,
        subscriptions: [{ amountMinor: 20000, billingCycle: "MONTHLY", active: true }],
        invoices: [],
      });

      const fromFiltered = calculateCashflow({
        month: "2026-10",
        transactions: monthFiltered,
        subscriptions: [{ amountMinor: 20000, billingCycle: "MONTHLY", active: true }],
        invoices: [],
      });

      expect(fromFiltered).toEqual(fromAll);
      expect(fromFiltered.netOutflowMinor).toBe(-115000); // 35,000 outflow - 150,000 inflow
    });
  });
});
