import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DexieFileStore } from "../../src/adapters/web-dexie/DexieFileStore";
import { attachmentCache } from "../../src/adapters/web-dexie/attachmentCache";
import { KromaLedgerDB } from "../../src/adapters/web-dexie/db";
import {
  WEBP_MAX_BYTES,
  WEBP_MAX_DIMENSION,
  WEBP_MAX_SIZE_MB,
  WEBP_QUALITY,
  migrateAttachmentsToWebp,
  normalizeFilenameToWebp,
  optimizeImageToWebp,
  setCustomImageCompressor,
} from "../../src/adapters/web-dexie/imageOptimizer";
import type { AttachmentMeta, Transaction } from "../../src/core/models";

let db: KromaLedgerDB;
let files: DexieFileStore;

const sampleTx = (id = "tx-1"): Transaction => ({
  id,
  date: "2026-10-20",
  title: "Test Transaction",
  amountMinor: -1500,
  currency: "PHP",
  type: "EXPENSE",
});

beforeEach(async () => {
  db = new KromaLedgerDB();
  await db.delete();
  db = new KromaLedgerDB();
  files = new DexieFileStore(db);
  attachmentCache.clear();
  setCustomImageCompressor(null);
});

afterEach(() => {
  setCustomImageCompressor(null);
  attachmentCache.clear();
  db.close();
});

describe("imageOptimizer", () => {
  describe("constants", () => {
    it("exports standard optimization constants", () => {
      expect(WEBP_MAX_BYTES).toBe(100 * 1024);
      expect(WEBP_MAX_SIZE_MB).toBe(0.1);
      expect(WEBP_MAX_DIMENSION).toBe(1280);
      expect(WEBP_QUALITY).toBe(0.75);
    });
  });

  describe("normalizeFilenameToWebp", () => {
    it("converts common image extensions to .webp", () => {
      expect(normalizeFilenameToWebp("receipt.png")).toBe("receipt.webp");
      expect(normalizeFilenameToWebp("scan.JPG")).toBe("scan.webp");
      expect(normalizeFilenameToWebp("invoice.jpeg")).toBe("invoice.webp");
      expect(normalizeFilenameToWebp("animation.gif")).toBe("animation.webp");
      expect(normalizeFilenameToWebp("already.webp")).toBe("already.webp");
    });

    it("handles multiple dots and no-extension filenames", () => {
      expect(normalizeFilenameToWebp("store.receipt.2026.png")).toBe("store.receipt.2026.webp");
      expect(normalizeFilenameToWebp("plainfile")).toBe("plainfile.webp");
      expect(normalizeFilenameToWebp(".hiddenfile")).toBe(".hiddenfile.webp");
    });
  });

  describe("optimizeImageToWebp", () => {
    it("leaves application/pdf untouched", async () => {
      const pdfBytes = new Uint8Array([37, 80, 68, 70]); // %PDF
      const result = await optimizeImageToWebp(pdfBytes, "contract.pdf", "application/pdf");
      expect(result).toEqual({
        bytes: pdfBytes,
        filename: "contract.pdf",
        mimeType: "application/pdf",
        size: pdfBytes.byteLength,
      });
    });

    it("leaves compliant image/webp untouched", async () => {
      const webpBytes = new Uint8Array([82, 73, 70, 70]);
      const result = await optimizeImageToWebp(webpBytes, "receipt.webp", "image/webp");
      expect(result).toEqual({
        bytes: webpBytes,
        filename: "receipt.webp",
        mimeType: "image/webp",
        size: webpBytes.byteLength,
      });
    });

    it("normalizes and optimizes via custom compressor when provided", async () => {
      const input = new Uint8Array([1, 2, 3, 4, 5, 6]);
      const compressedBytes = new Uint8Array([9, 8, 7]);
      const compressor = vi.fn().mockResolvedValue(compressedBytes);
      setCustomImageCompressor(compressor);

      const result = await optimizeImageToWebp(input, "photo.PNG", "image/png");
      expect(compressor).toHaveBeenCalledWith(input, "photo.PNG", "image/png");
      expect(result).toEqual({
        bytes: compressedBytes,
        filename: "photo.webp",
        mimeType: "image/webp",
        size: 3,
      });
    });
  });

  describe("saveAttachment with DexieFileStore", () => {
    it("converts image/png, image/jpeg, image/gif, and oversized image/webp to .webp using custom compressor", async () => {
      await db.transactions.put(sampleTx("tx-images"));

      const compressedBytes = new Uint8Array([42, 42, 42]);
      setCustomImageCompressor(async () => compressedBytes);

      // 1. image/png
      const pngMeta: AttachmentMeta = {
        id: "att-png",
        filename: "receipt.png",
        mimeType: "image/png",
        size: 200,
        createdAt: "2026-10-20T10:00:00.000Z",
        entityType: "TRANSACTION",
        entityId: "tx-images",
      };
      const savedPng = await files.saveAttachment(pngMeta, new Uint8Array(200));
      expect(savedPng.filename).toBe("receipt.webp");
      expect(savedPng.mimeType).toBe("image/webp");
      expect(savedPng.size).toBe(3);
      expect(await files.load("att-png")).toEqual(compressedBytes);

      // 2. image/jpeg
      const jpgMeta: AttachmentMeta = {
        id: "att-jpg",
        filename: "photo.jpg",
        mimeType: "image/jpeg",
        size: 300,
        createdAt: "2026-10-20T10:00:00.000Z",
        entityType: "TRANSACTION",
        entityId: "tx-images",
      };
      const savedJpg = await files.saveAttachment(jpgMeta, new Uint8Array(300));
      expect(savedJpg.filename).toBe("photo.webp");
      expect(savedJpg.mimeType).toBe("image/webp");
      expect(savedJpg.size).toBe(3);
      expect(await files.load("att-jpg")).toEqual(compressedBytes);

      // 3. image/gif
      const gifMeta: AttachmentMeta = {
        id: "att-gif",
        filename: "scan.gif",
        mimeType: "image/gif",
        size: 150,
        createdAt: "2026-10-20T10:00:00.000Z",
        entityType: "TRANSACTION",
        entityId: "tx-images",
      };
      const savedGif = await files.saveAttachment(gifMeta, new Uint8Array(150));
      expect(savedGif.filename).toBe("scan.webp");
      expect(savedGif.mimeType).toBe("image/webp");
      expect(savedGif.size).toBe(3);
      expect(await files.load("att-gif")).toEqual(compressedBytes);

      // 4. oversized image/webp (> 100 KB)
      const oversizedSize = 120 * 1024; // 122880 bytes > 102400 bytes
      const bigWebpMeta: AttachmentMeta = {
        id: "att-big-webp",
        filename: "large.webp",
        mimeType: "image/webp",
        size: oversizedSize,
        createdAt: "2026-10-20T10:00:00.000Z",
        entityType: "TRANSACTION",
        entityId: "tx-images",
      };
      const savedBig = await files.saveAttachment(bigWebpMeta, new Uint8Array(oversizedSize));
      expect(savedBig.filename).toBe("large.webp");
      expect(savedBig.mimeType).toBe("image/webp");
      expect(savedBig.size).toBe(3);
      expect(await files.load("att-big-webp")).toEqual(compressedBytes);
    });

    it("leaves application/pdf untouched on saveAttachment", async () => {
      await db.transactions.put(sampleTx("tx-pdf"));

      const compressor = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]));
      setCustomImageCompressor(compressor);

      const pdfData = new Uint8Array([37, 80, 68, 70, 0, 1, 2]);
      const pdfMeta: AttachmentMeta = {
        id: "att-pdf",
        filename: "statement.pdf",
        mimeType: "application/pdf",
        size: pdfData.byteLength,
        createdAt: "2026-10-20T10:00:00.000Z",
        entityType: "TRANSACTION",
        entityId: "tx-pdf",
      };

      const saved = await files.saveAttachment(pdfMeta, pdfData);
      expect(saved.filename).toBe("statement.pdf");
      expect(saved.mimeType).toBe("application/pdf");
      expect(saved.size).toBe(pdfData.byteLength);
      expect(compressor).not.toHaveBeenCalled();
      expect(await files.load("att-pdf")).toEqual(pdfData);
    });
  });

  describe("retroactive migration and attachmentCache eviction", () => {
    it("migrates pre-existing image/png, image/jpeg, and oversized webp records while evicting cache", async () => {
      // 1. Seed legacy records directly into db.attachments and db.attachmentFiles
      const pngMeta: AttachmentMeta = {
        id: "legacy-png",
        filename: "bill.png",
        mimeType: "image/png",
        size: 500,
        createdAt: "2026-10-01T12:00:00.000Z",
        entityType: "TRANSACTION",
        entityId: "tx-1",
      };
      const pngBlob = new Blob([new Uint8Array(500).fill(1)], { type: "image/png" });

      const jpgMeta: AttachmentMeta = {
        id: "legacy-jpg",
        filename: "receipt.jpeg",
        mimeType: "image/jpeg",
        size: 800,
        createdAt: "2026-10-02T12:00:00.000Z",
        entityType: "TRANSACTION",
        entityId: "tx-1",
      };
      const jpgBlob = new Blob([new Uint8Array(800).fill(2)], { type: "image/jpeg" });

      const oversizedMeta: AttachmentMeta = {
        id: "legacy-oversized",
        filename: "heavy.webp",
        mimeType: "image/webp",
        size: 150 * 1024,
        createdAt: "2026-10-03T12:00:00.000Z",
        entityType: "TRANSACTION",
        entityId: "tx-1",
      };
      const oversizedBlob = new Blob([new Uint8Array(150 * 1024).fill(3)], { type: "image/webp" });

      const pdfMeta: AttachmentMeta = {
        id: "legacy-pdf",
        filename: "doc.pdf",
        mimeType: "application/pdf",
        size: 1200,
        createdAt: "2026-10-04T12:00:00.000Z",
        entityType: "TRANSACTION",
        entityId: "tx-1",
      };
      const pdfBlob = new Blob([new Uint8Array(1200).fill(4)], { type: "application/pdf" });

      const compliantMeta: AttachmentMeta = {
        id: "compliant-webp",
        filename: "ok.webp",
        mimeType: "image/webp",
        size: 1024,
        createdAt: "2026-10-05T12:00:00.000Z",
        entityType: "TRANSACTION",
        entityId: "tx-1",
      };
      const compliantBlob = new Blob([new Uint8Array(1024).fill(5)], { type: "image/webp" });

      const orphanMeta: AttachmentMeta = {
        id: "orphan-png",
        filename: "orphan.png",
        mimeType: "image/png",
        size: 300,
        createdAt: "2026-10-06T12:00:00.000Z",
        entityType: "TRANSACTION",
        entityId: "tx-1",
      };

      await db.attachments.bulkPut([pngMeta, jpgMeta, oversizedMeta, pdfMeta, compliantMeta, orphanMeta]);
      await db.attachmentFiles.bulkPut([
        { id: pngMeta.id, mimeType: pngMeta.mimeType, size: pngMeta.size, blob: pngBlob },
        { id: jpgMeta.id, mimeType: jpgMeta.mimeType, size: jpgMeta.size, blob: jpgBlob },
        { id: oversizedMeta.id, mimeType: oversizedMeta.mimeType, size: oversizedMeta.size, blob: oversizedBlob },
        { id: pdfMeta.id, mimeType: pdfMeta.mimeType, size: pdfMeta.size, blob: pdfBlob },
        { id: compliantMeta.id, mimeType: compliantMeta.mimeType, size: compliantMeta.size, blob: compliantBlob },
      ]);

      // 2. Prime cache for records
      attachmentCache.set("legacy-png", "blob:http://localhost/legacy-png");
      attachmentCache.set("legacy-jpg", "blob:http://localhost/legacy-jpg");
      attachmentCache.set("legacy-pdf", "blob:http://localhost/legacy-pdf");
      attachmentCache.set("compliant-webp", "blob:http://localhost/compliant-webp");

      // 3. Configure mock compressor for deterministic test
      const compressedBytes = new Uint8Array([77, 88]);
      setCustomImageCompressor(async () => compressedBytes);

      // 4. Run migration via files.optimizeExistingAttachments()
      const migratedCount = await files.optimizeExistingAttachments();
      expect(migratedCount).toBe(3); // legacy-png, legacy-jpg, and legacy-oversized

      // 5. Verify legacy-png updated
      const updatedPng = await db.attachments.get("legacy-png");
      expect(updatedPng).toMatchObject({
        filename: "bill.webp",
        mimeType: "image/webp",
        size: 2,
      });
      const updatedPngFile = await db.attachmentFiles.get("legacy-png");
      expect(updatedPngFile?.mimeType).toBe("image/webp");
      expect(updatedPngFile?.size).toBe(2);
      expect(attachmentCache.get("legacy-png")).toBeUndefined(); // evicted!

      // 6. Verify legacy-jpg updated
      const updatedJpg = await db.attachments.get("legacy-jpg");
      expect(updatedJpg).toMatchObject({
        filename: "receipt.webp",
        mimeType: "image/webp",
        size: 2,
      });
      const updatedJpgFile = await db.attachmentFiles.get("legacy-jpg");
      expect(updatedJpgFile?.mimeType).toBe("image/webp");
      expect(updatedJpgFile?.size).toBe(2);
      expect(attachmentCache.get("legacy-jpg")).toBeUndefined(); // evicted!

      // 7. Verify oversized webp updated
      const updatedOversized = await db.attachments.get("legacy-oversized");
      expect(updatedOversized).toMatchObject({
        filename: "heavy.webp",
        mimeType: "image/webp",
        size: 2,
      });
      const updatedOversizedFile = await db.attachmentFiles.get("legacy-oversized");
      expect(updatedOversizedFile?.mimeType).toBe("image/webp");
      expect(updatedOversizedFile?.size).toBe(2);

      // 8. Verify pdf untouched and not evicted
      const untouchedPdf = await db.attachments.get("legacy-pdf");
      expect(untouchedPdf).toEqual(pdfMeta);
      expect(attachmentCache.get("legacy-pdf")).toBe("blob:http://localhost/legacy-pdf");

      // 9. Verify compliant webp untouched and not evicted
      const untouchedWebp = await db.attachments.get("compliant-webp");
      expect(untouchedWebp).toEqual(compliantMeta);
      expect(attachmentCache.get("compliant-webp")).toBe("blob:http://localhost/compliant-webp");

      // 10. Running again returns 0 (idempotent)
      const secondRun = await migrateAttachmentsToWebp(db);
      expect(secondRun).toBe(0);
    });
  });
});
