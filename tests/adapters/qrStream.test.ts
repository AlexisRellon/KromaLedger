import "fake-indexeddb/auto";
import Dexie from "dexie";
import JSZip from "jszip";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  bytesToBase64,
  encodePayloadToQrFrames,
  parseQrFrame,
  QrStreamAssembler,
} from "../../src/adapters/backup/qrStream";
import {
  exportSyncDump,
  exportSyncFrames,
  parseSyncPayload,
  restoreSyncPayload,
  restoreVault,
  type SyncDumpPayload,
} from "../../src/adapters/backup/zipVault";
import { DexieFileStore } from "../../src/adapters/web-dexie/DexieFileStore";
import { DexieStorageRepo } from "../../src/adapters/web-dexie/DexieStorageRepo";
import { KromaLedgerDB } from "../../src/adapters/web-dexie/db";
import type { Transaction, Wallet } from "../../src/core/models";

function createTestDb(name: string): KromaLedgerDB {
  const db = new Dexie(name) as KromaLedgerDB;
  db.version(2).stores({
    transactions: "&id,date,type,categoryId,subscriptionId,invoiceId",
    subscriptions: "&id,title,nextBillingDate,active,autoLog",
    invoices: "&id,dueDate,status,direction",
    invoiceItems: "&id,invoiceId",
    categories: "&id,name,type",
    attachments: "&id,[entityType+entityId]",
    attachmentFiles: "&id,mimeType,size",
    appMeta: "&id",
  });
  db.version(3).stores({
    transactions: "&id,date,type,categoryId,subscriptionId,invoiceId,walletId",
    wallets: "&id,name,type,isDefault",
    profiles: "&id",
  });
  db.version(4).stores({
    transactions: "&id,date,type,categoryId,subscriptionId,invoiceId,walletId,toWalletId",
  });
  db.version(5).stores({
    notifications: "&id,createdAt,read,type,entityId",
  });
  return db;
}

let sourceDb: KromaLedgerDB;
let targetDb: KromaLedgerDB;
let sourceRepo: DexieStorageRepo;
let targetRepo: DexieStorageRepo;
let sourceFiles: DexieFileStore;
let targetFiles: DexieFileStore;

const sampleTx = (id: string, title = "Groceries", amountMinor = -5000): Transaction => ({
  id,
  date: "2026-10-20",
  title,
  amountMinor,
  currency: "PHP",
  type: "EXPENSE",
});

const sampleWallet = (id: string, name = "Cash"): Wallet => ({
  id,
  name,
  type: "CASH",
  currency: "PHP",
  balanceMinor: 100000,
  color: "#D9F938",
  isDefault: true,
  pattern: "LEDGER",
  cardNetwork: "NONE",
});

beforeEach(async () => {
  sourceDb = createTestDb("qr-source-db");
  targetDb = createTestDb("qr-target-db");
  await sourceDb.delete();
  await targetDb.delete();

  sourceDb = createTestDb("qr-source-db");
  targetDb = createTestDb("qr-target-db");

  sourceRepo = new DexieStorageRepo(sourceDb);
  targetRepo = new DexieStorageRepo(targetDb);
  sourceFiles = new DexieFileStore(sourceDb);
  targetFiles = new DexieFileStore(targetDb);

  await sourceRepo.initialize("2026-10-20");
  await targetRepo.initialize("2026-10-20");
});

afterEach(() => {
  sourceDb.close();
  targetDb.close();
});

describe("QR Stream Frame Encoding & Reassembly", () => {
  it("encodes payload and handles out-of-order frame reassembly", async () => {
    const payload = JSON.stringify({ message: "Hello Air-Sync", numbers: Array.from({ length: 50 }, (_, i) => i) });
    const batch = await encodePayloadToQrFrames(payload, { chunkSize: 64 });
    expect(batch.totalFrames).toBeGreaterThan(1);

    const assembler = new QrStreamAssembler();
    // Feed frames in reverse order
    const reversed = [...batch.frames].reverse();
    for (const frame of reversed) {
      const res = assembler.feedFrame(frame);
      expect(res.accepted).toBe(true);
    }

    const progress = assembler.getProgress();
    expect(progress.complete).toBe(true);
    expect(progress.receivedCount).toBe(batch.totalFrames);
    expect(progress.missingIndices).toEqual([]);

    const reassembled = await assembler.reassembleAndDecompress();
    expect(reassembled).toBe(payload);
  });

  it("handles duplicate frames and cyclic carousel playback idempotently", async () => {
    const payload = JSON.stringify({ transfer: "Cyclic Test", items: Array.from({ length: 40 }, (_, i) => `item-${i}`) });
    const batch = await encodePayloadToQrFrames(payload, { chunkSize: 64 });
    expect(batch.totalFrames).toBeGreaterThan(1);

    const assembler = new QrStreamAssembler();

    // First cycle
    for (const frame of batch.frames) {
      const res = assembler.feedFrame(frame);
      expect(res.accepted).toBe(true);
    }
    expect(assembler.getProgress().complete).toBe(true);

    // Duplicate frames: feed the entire batch again (simulating carousel looping)
    for (const frame of batch.frames) {
      const res = assembler.feedFrame(frame);
      expect(res.accepted).toBe(true);
      expect(res.isNewFrame).toBe(false);
    }

    expect(assembler.getProgress().receivedCount).toBe(batch.totalFrames);
    const reassembled = await assembler.reassembleAndDecompress();
    expect(reassembled).toBe(payload);
  });

  it("rejects invalid, malformed, or corrupt frames", () => {
    expect(parseQrFrame("")).toBeNull();
    expect(parseQrFrame("invalid")).toBeNull();
    expect(parseQrFrame("UNKNOWN|sess|0|1|crc|data")).toBeNull();
    expect(parseQrFrame("KB1|sess|-1|2|12345678|AAAA")).toBeNull();
    expect(parseQrFrame("KB1|sess|2|2|12345678|AAAA")).toBeNull();
    expect(parseQrFrame("KB1|sess|0|0|12345678|AAAA")).toBeNull();
    expect(parseQrFrame("KB1|sess|0|2|invalidcrc|AAAA")).toBeNull();
    expect(parseQrFrame("KB1|sess|0|2|12345678|invalid-base64===")).toBeNull();

    const assembler = new QrStreamAssembler();
    const res = assembler.feedFrame("garbage-frame-string");
    expect(res.accepted).toBe(false);
    expect(res.error).toBe("Unrecognized QR format");
  });

  it("handles mismatched session IDs according to autoSwitchSession option", async () => {
    const batchA = await encodePayloadToQrFrames("Payload A", { chunkSize: 100, sessionId: "sessionA123" });
    const batchB = await encodePayloadToQrFrames("Payload B", { chunkSize: 100, sessionId: "sessionB456" });

    // Without autoSwitchSession (default: false)
    const strictAssembler = new QrStreamAssembler({ autoSwitchSession: false });
    strictAssembler.feedFrame(batchA.frames[0]!);
    const mismatchRes = strictAssembler.feedFrame(batchB.frames[0]!);
    expect(mismatchRes.accepted).toBe(false);
    expect(mismatchRes.error).toBe("Frame belongs to a different transfer session");

    // With autoSwitchSession: true
    const switchingAssembler = new QrStreamAssembler({ autoSwitchSession: true });
    switchingAssembler.feedFrame(batchA.frames[0]!);
    expect(switchingAssembler.getProgress().sessionId).toBe("sessionA123");

    const switchRes = switchingAssembler.feedFrame(batchB.frames[0]!);
    expect(switchRes.accepted).toBe(true);
    expect(switchingAssembler.getProgress().sessionId).toBe("sessionB456");
  });

  it("rejects reassembly when CRC32 checksum is tampered", async () => {
    const batch = await encodePayloadToQrFrames("Original Safe Content", { chunkSize: 100 });
    const assembler = new QrStreamAssembler();

    // Tamper the base64 data chunk of the first frame to valid base64 of different data
    const parts = batch.frames[0]!.split("|");
    parts[5] = bytesToBase64(new Uint8Array([99, 99, 99])); // tampered payload
    const tamperedFrame = parts.join("|");

    assembler.feedFrame(tamperedFrame);
    await expect(assembler.reassembleAndDecompress()).rejects.toThrow("QR stream checksum mismatch; data is corrupted");
  });
});

describe("End-to-End Air-Sync via QR Frames and restoreSyncPayload", () => {
  it("synchronizes database in OVERWRITE mode", async () => {
    // Populate source DB
    await sourceRepo.saveTransaction(sampleTx("tx-source-1", "Coffee", -250));
    await sourceRepo.saveWallet(sampleWallet("w-source-1", "GCash"));
    await sourceRepo.saveProfile({
      id: "profile",
      name: "Source Operator",
      handle: "source",
      email: "source@kroma.local",
      initials: "SO",
      themeColor: "#D9F938",
      defaultCurrency: "PHP",
      bio: "Source DB",
    });

    // Populate target DB with distinct records
    await targetRepo.saveTransaction(sampleTx("tx-target-old", "Old Rent", -15000));
    await targetRepo.saveWallet(sampleWallet("w-target-old", "Old Bank"));

    const sourceTxCount = (await sourceRepo.listTransactions()).length;

    // Export sync frames from source
    const { batch } = await exportSyncFrames(sourceDb, "2026-10-20");

    // Reassemble in target
    const assembler = new QrStreamAssembler();
    for (const frame of batch.frames) {
      assembler.feedFrame(frame);
    }
    const jsonText = await assembler.reassembleAndDecompress();

    // Restore into target DB with OVERWRITE
    const summary = await restoreSyncPayload(targetDb, jsonText, { mode: "OVERWRITE" });
    expect(summary.mode).toBe("OVERWRITE");
    expect(summary.transactionsCount).toBe(sourceTxCount);
    expect(summary.walletsCount).toBeGreaterThan(0);

    // Verify old target records were wiped and replaced by source records
    expect(await targetRepo.getTransaction("tx-target-old")).toBeUndefined();
    expect(await targetRepo.getTransaction("tx-source-1")).toMatchObject({ title: "Coffee" });
    expect(await targetRepo.getWallet("w-target-old")).toBeUndefined();
    expect(await targetRepo.getWallet("w-source-1")).toBeDefined();
    expect((await targetRepo.getProfile()).name).toBe("Source Operator");
  });

  it("synchronizes database in MERGE mode", async () => {
    // Populate source DB
    await sourceRepo.saveTransaction(sampleTx("tx-source-1", "Incoming Salary", 50000));
    await sourceRepo.saveWallet(sampleWallet("w-source-1", "Maya"));

    // Populate target DB with existing records
    await targetRepo.saveTransaction(sampleTx("tx-target-keep", "Existing Groceries", -3000));
    await targetRepo.saveWallet(sampleWallet("w-target-keep", "Cash On Hand"));

    const sourceTxCount = (await sourceRepo.listTransactions()).length;

    // Export sync frames from source
    const { batch } = await exportSyncFrames(sourceDb, "2026-10-20");

    // Assemble and decompress
    const assembler = new QrStreamAssembler();
    for (const frame of batch.frames) {
      assembler.feedFrame(frame);
    }
    const jsonText = await assembler.reassembleAndDecompress();

    // Restore into target DB with MERGE
    const summary = await restoreSyncPayload(targetDb, jsonText, { mode: "MERGE" });
    expect(summary.mode).toBe("MERGE");
    expect(summary.transactionsCount).toBe(sourceTxCount);

    // Verify both original and incoming records co-exist in target
    expect(await targetRepo.getTransaction("tx-target-keep")).toMatchObject({ title: "Existing Groceries" });
    expect(await targetRepo.getTransaction("tx-source-1")).toMatchObject({ title: "Incoming Salary" });
    expect(await targetRepo.getWallet("w-target-keep")).toBeDefined();
    expect(await targetRepo.getWallet("w-source-1")).toBeDefined();
  });

  it("supports includeAttachments: false vs true with WebP binary round-trip", async () => {
    // Add transaction and attachment to source DB
    await sourceRepo.saveTransaction(sampleTx("tx-with-receipt", "Hardware Store", -4500));
    const receiptBytes = new Uint8Array([82, 73, 70, 70, 10, 20, 30, 40]);
    await sourceFiles.saveAttachment(
      {
        id: "att-receipt-1",
        filename: "hardware.webp",
        mimeType: "image/webp",
        size: receiptBytes.byteLength,
        createdAt: "2026-10-20T10:00:00.000Z",
        entityType: "TRANSACTION",
        entityId: "tx-with-receipt",
      },
      receiptBytes
    );

    // 1. Export with includeAttachments: false
    const dumpWithoutAtt = await exportSyncDump(sourceDb, "2026-10-20", { includeAttachments: false });
    expect(dumpWithoutAtt.attachments).toEqual([]);
    expect(dumpWithoutAtt.attachmentFiles).toEqual([]);
    expect(dumpWithoutAtt.attachmentPayloads).toEqual([]);

    // 2. Export with includeAttachments: true
    const { batch, dump } = await exportSyncFrames(sourceDb, "2026-10-20", { includeAttachments: true, chunkSize: 120 });
    expect(dump.attachments.length).toBe(1);
    expect(dump.attachmentPayloads?.length).toBe(1);
    expect(dump.attachmentPayloads![0]?.id).toBe("att-receipt-1");

    // Round-trip frames through assembler
    const assembler = new QrStreamAssembler();
    for (const frame of batch.frames) {
      assembler.feedFrame(frame);
    }
    const jsonText = await assembler.reassembleAndDecompress();

    // Restore to target DB
    const summary = await restoreSyncPayload(targetDb, jsonText, { mode: "OVERWRITE", includeAttachments: true });
    expect(summary.attachmentsCount).toBe(1);

    // Verify binary receipt bytes round-tripped identically
    const loadedBytes = await targetFiles.load("att-receipt-1");
    expect(loadedBytes).toBeDefined();
    expect(loadedBytes).toEqual(receiptBytes);
  });

  it("respects granular restore flags (includeRecords, includeWalletsAndProfile, includeAttachments)", async () => {
    // Populate source DB
    await sourceRepo.saveTransaction(sampleTx("tx-source-lunch", "Lunch", -350));
    await sourceRepo.saveWallet(sampleWallet("w-source-extra", "Source Wallet"));
    await sourceRepo.saveProfile({
      id: "profile",
      name: "New Profile",
      handle: "new",
      email: "new@kroma.local",
      initials: "NP",
      themeColor: "#D9F938",
      defaultCurrency: "PHP",
      bio: "New",
    });
    const receiptBytes = new Uint8Array([1, 2, 3]);
    await sourceFiles.saveAttachment(
      {
        id: "att-source-1",
        filename: "lunch.webp",
        mimeType: "image/webp",
        size: receiptBytes.byteLength,
        createdAt: "2026-10-20T10:00:00.000Z",
        entityType: "TRANSACTION",
        entityId: "tx-source-lunch",
      },
      receiptBytes
    );

    const dump = await exportSyncDump(sourceDb, "2026-10-20", { includeAttachments: true });

    // Target DB setup
    await targetRepo.saveTransaction(sampleTx("tx-target-existing", "Target Tx", -100));
    await targetRepo.saveWallet(sampleWallet("w-target-existing", "Target Wallet"));

    // Case 1: includeRecords: false, includeWalletsAndProfile: true, includeAttachments: false
    const summary1 = await restoreSyncPayload(targetDb, dump, {
      mode: "MERGE",
      includeRecords: false,
      includeWalletsAndProfile: true,
      includeAttachments: false,
    });
    expect(summary1.transactionsCount).toBe(0);
    expect(summary1.attachmentsCount).toBe(0);
    expect(summary1.walletsCount).toBeGreaterThan(0);
    expect(await targetRepo.getTransaction("tx-source-lunch")).toBeUndefined();
    expect(await targetRepo.getTransaction("tx-target-existing")).toBeDefined();
    expect(await targetRepo.getWallet("w-source-extra")).toBeDefined();

    // Case 2: includeRecords: true, includeWalletsAndProfile: false
    const summary2 = await restoreSyncPayload(targetDb, dump, {
      mode: "MERGE",
      includeRecords: true,
      includeWalletsAndProfile: false,
      includeAttachments: false,
    });
    expect(summary2.transactionsCount).toBeGreaterThan(0);
    expect(await targetRepo.getTransaction("tx-source-lunch")).toBeDefined();
  });
});

describe("parseSyncPayload", () => {
  it("validates valid payload and rejects malformed JSON or dangling references", async () => {
    const dump = await exportSyncDump(sourceDb, "2026-10-20");
    const jsonText = JSON.stringify(dump);

    const parsed = parseSyncPayload(jsonText);
    expect(parsed.formatVersion).toBe(1);
    expect(parsed.exportedAt).toBe("2026-10-20");

    expect(() => parseSyncPayload("not a json string")).toThrow("Backup JSON payload is malformed");

    // Rejects dangling invoiceId
    const tampered = JSON.parse(jsonText) as SyncDumpPayload;
    tampered.transactions.push({
      id: "dangling-tx",
      date: "2026-10-20",
      title: "Bad",
      amountMinor: -100,
      currency: "PHP",
      type: "EXPENSE",
      invoiceId: "non-existent-invoice",
    });
    expect(() => parseSyncPayload(JSON.stringify(tampered))).toThrow("Backup contains dangling ledger references");
  });
});

describe("ZIP Vault Retroactive WebP Migration", () => {
  it("converts legacy image/png attachment inside a ZIP archive to image/webp on restoreVault", async () => {
    // Construct a valid ZIP backup manually with a legacy image/png attachment
    const zip = new JSZip();
    const pngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3, 4]); // PNG header + dummy payload

    const dump: SyncDumpPayload = {
      formatVersion: 1,
      exportedAt: "2026-10-20",
      transactions: [sampleTx("tx-legacy", "Legacy Store", -1200)],
      subscriptions: [],
      invoices: [],
      invoiceItems: [],
      categories: [{ id: "cat-1", name: "General", type: "EXPENSE" }],
      attachments: [
        {
          id: "att-legacy-png",
          filename: "receipt.png",
          mimeType: "image/png",
          size: pngBytes.byteLength,
          createdAt: "2026-10-20T10:00:00.000Z",
          entityType: "TRANSACTION",
          entityId: "tx-legacy",
        },
      ],
      attachmentFiles: [
        {
          id: "att-legacy-png",
          mimeType: "image/png",
          size: pngBytes.byteLength,
        },
      ],
      appMeta: { id: "app", currency: "PHP", seedVersion: 0 },
      wallets: [sampleWallet("w-legacy", "Legacy Wallet")],
    };

    zip.file("db-dump.json", JSON.stringify(dump));
    zip.file("attachments/att-legacy-png", pngBytes);

    const archiveData = await zip.generateAsync({ type: "uint8array" });

    // Restore ZIP archive into clean target DB
    await restoreVault(targetDb, archiveData);

    // Verify the restored attachment was converted to WebP
    const restoredMeta = await targetDb.attachments.get("att-legacy-png");
    expect(restoredMeta).toBeDefined();
    expect(restoredMeta?.filename).toBe("receipt.webp");
    expect(restoredMeta?.mimeType).toBe("image/webp");

    const restoredFile = await targetDb.attachmentFiles.get("att-legacy-png");
    expect(restoredFile).toBeDefined();
    expect(restoredFile?.mimeType).toBe("image/webp");

    const loadedBytes = await targetFiles.load("att-legacy-png");
    expect(loadedBytes).toBeDefined();
  });
});
