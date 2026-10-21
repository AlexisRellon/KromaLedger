import "fake-indexeddb/auto";
import JSZip from "jszip";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KromaLedgerDB } from "../../src/adapters/web-dexie/db";
import { DexieStorageRepo } from "../../src/adapters/web-dexie/DexieStorageRepo";
import { DexieFileStore } from "../../src/adapters/web-dexie/DexieFileStore";
import { exportVault, restoreVault } from "../../src/adapters/backup/zipVault";
import type { Transaction } from "../../src/core/models";

let db: KromaLedgerDB;
let repo: DexieStorageRepo;
const tx = (): Transaction => ({ id: "tx", date: "2026-10-20", title: "Receipt", amountMinor: -1250, currency: "PHP", type: "EXPENSE" });

beforeEach(async () => {
  db = new KromaLedgerDB();
  await db.delete();
  db = new KromaLedgerDB();
  repo = new DexieStorageRepo(db);
  await repo.initialize("2026-10-20");
  await repo.saveTransaction(tx());
  await new DexieFileStore(db).saveAttachment({ id: "receipt", filename: "receipt.webp", mimeType: "image/webp", size: 3, createdAt: "2026-10-20T10:00:00.000Z", entityType: "TRANSACTION", entityId: "tx" }, new Uint8Array([1, 2, 3]));
});
afterEach(() => db.close());

describe("vault ZIP", () => {
  it("round-trips database rows and binary attachments", async () => {
    const archive = await exportVault(db, "2026-10-20");
    expect(archive.filename).toBe("kromaledger-vault-2026-10-20.zip");
    const zip = await JSZip.loadAsync(archive.data);
    expect(await zip.file("db-dump.json")?.async("string")).toContain('"formatVersion":1');
    expect(await zip.file("attachments/receipt")?.async("uint8array")).toEqual(new Uint8Array([1, 2, 3]));
    await repo.deleteTransaction("tx");
    await repo.saveWallet({ id: "w-temp", name: "Temp Wallet", type: "CASH", currency: "PHP", balanceMinor: 1000, color: "#fff", isDefault: false });
    await restoreVault(db, archive.data);
    expect(await repo.getTransaction("tx")).toMatchObject({ title: "Receipt" });
    expect(await repo.getWallet("w-temp")).toBeUndefined();
    expect((await repo.listWallets()).length).toBeGreaterThan(0);
    expect((await repo.getProfile()).name).toBe("Operator");
    expect(await new DexieFileStore(db).load("receipt")).toEqual(new Uint8Array([1, 2, 3]));
  });

  it("rejects corrupt or incomplete archives before replacing current data", async () => {
    const before = await repo.listTransactions();
    const beforeSubscriptions = await repo.listSubscriptions();
    const beforeInvoices = await repo.listInvoices();
    const beforeCategories = await repo.listCategories();
    const beforeMeta = await repo.getAppMeta();
    const beforeItems = await repo.listInvoiceItems("inv-104");
    const validArchive = await exportVault(db, "2026-10-20");
    const bulkPut = vi.spyOn(db.invoices, "bulkPut").mockRejectedValue(new Error("simulated quota failure"));
    await expect(restoreVault(db, validArchive.data)).rejects.toThrow("simulated quota failure");
    bulkPut.mockRestore();
    expect(await repo.listTransactions()).toEqual(before);
    expect(await repo.listSubscriptions()).toEqual(beforeSubscriptions);
    expect(await repo.listInvoices()).toEqual(beforeInvoices);
    expect(await repo.listCategories()).toEqual(beforeCategories);
    expect(await repo.getAppMeta()).toEqual(beforeMeta);
    expect(await repo.listInvoiceItems("inv-104")).toEqual(beforeItems);
    expect(await new DexieFileStore(db).load("receipt")).toEqual(new Uint8Array([1, 2, 3]));
    await expect(restoreVault(db, new Uint8Array([1, 2, 3]))).rejects.toThrow();
    const archive = await exportVault(db, "2026-10-20");
    const zip = await JSZip.loadAsync(archive.data);
    zip.remove("attachments/receipt");
    const missingBlob = await zip.generateAsync({ type: "uint8array" });
    await expect(restoreVault(db, missingBlob)).rejects.toThrow();
    const invalidDumpZip = await JSZip.loadAsync(archive.data);
    const dump = JSON.parse(await invalidDumpZip.file("db-dump.json")!.async("string")) as { transactions: unknown[] };
    dump.transactions.push({ id: "bad", date: "2026-02-30", title: "Bad", amountMinor: -1, currency: "PHP", type: "EXPENSE" });
    invalidDumpZip.file("db-dump.json", JSON.stringify(dump));
    await expect(restoreVault(db, await invalidDumpZip.generateAsync({ type: "uint8array" }))).rejects.toThrow();
    expect(await repo.listTransactions()).toEqual(before);

    // Rejects malicious attachment with text/html or SVG MIME type
    const htmlZip = await JSZip.loadAsync(archive.data);
    const htmlDump = JSON.parse(await htmlZip.file("db-dump.json")!.async("string")) as {
      attachments: Array<{ mimeType: string }>;
      attachmentFiles: Array<{ mimeType: string }>;
    };
    htmlDump.attachments[0]!.mimeType = "text/html";
    htmlDump.attachmentFiles[0]!.mimeType = "text/html";
    htmlZip.file("db-dump.json", JSON.stringify(htmlDump));
    await expect(restoreVault(db, await htmlZip.generateAsync({ type: "uint8array" }))).rejects.toThrow();

    // Rejects archives exceeding the 200MB limit
    const fakeOversized = new Uint8Array(200 * 1024 * 1024 + 1);
    await expect(restoreVault(db, fakeOversized)).rejects.toThrow("Backup archive exceeds maximum 200MB limit");
  });
});
