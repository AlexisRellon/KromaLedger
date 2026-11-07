import { z } from "zod";
import {
  appMetaSchema,
  attachmentMetaSchema,
  attachmentMimeTypeSchema,
  categorySchema,
  dateOnlySchema,
  invoiceItemSchema,
  invoiceSchema,
  subscriptionSchema,
  transactionSchema,
  userProfileSchema,
  walletSchema,
  type AppMeta,
  type AttachmentMeta,
  type AttachmentMimeType,
  type Category,
  type Invoice,
  type InvoiceItem,
  type Subscription,
  type Transaction,
  type UserProfile,
  type Wallet,
} from "../../core/models";
import { KromaLedgerDB, type AttachmentFileRecord } from "../web-dexie/db";
import { migrateAttachmentsToWebp, optimizeImageToWebp } from "../web-dexie/imageOptimizer";
import {
  base64ToBytes,
  bytesToBase64,
  encodePayloadToQrFrames,
  type QrStreamBatch,
} from "./qrStream";

export const MAX_VAULT_BYTES = 200 * 1024 * 1024; // 200 MB
export const MAX_ATTACHMENT_COUNT = 1000;

export interface SyncAttachmentPayload {
  id: string;
  mimeType: AttachmentMimeType;
  size: number;
  dataBase64: string;
}

export interface SyncDumpPayload {
  formatVersion: 1;
  exportedAt: string;
  transactions: Transaction[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  categories: Category[];
  attachments: AttachmentMeta[];
  attachmentFiles: Array<{ id: string; mimeType: AttachmentMimeType; size: number }>;
  attachmentPayloads?: SyncAttachmentPayload[];
  appMeta: AppMeta;
  wallets: Wallet[];
  profile?: UserProfile;
}

export interface SyncRestoreOptions {
  mode: "MERGE" | "OVERWRITE";
  includeRecords?: boolean;
  includeWalletsAndProfile?: boolean;
  includeAttachments?: boolean;
}

export interface SyncRestoreSummary {
  mode: "MERGE" | "OVERWRITE";
  transactionsCount: number;
  subscriptionsCount: number;
  invoicesCount: number;
  walletsCount: number;
  attachmentsCount: number;
}

const fileMetaSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]+$/),
  mimeType: attachmentMimeTypeSchema,
  size: z.number().int().nonnegative(),
});

const dumpSchema = z.object({
  formatVersion: z.literal(1),
  exportedAt: dateOnlySchema,
  transactions: z.array(transactionSchema),
  subscriptions: z.array(subscriptionSchema),
  invoices: z.array(invoiceSchema),
  invoiceItems: z.array(invoiceItemSchema),
  categories: z.array(categorySchema),
  attachments: z.array(attachmentMetaSchema),
  attachmentFiles: z.array(fileMetaSchema),
  appMeta: appMetaSchema,
  wallets: z.array(walletSchema).default([]),
  profile: userProfileSchema.optional(),
});

export const syncAttachmentPayloadSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]+$/),
  mimeType: attachmentMimeTypeSchema,
  size: z.number().int().nonnegative(),
  dataBase64: z.string(),
});

export const syncDumpSchema = dumpSchema.extend({
  attachmentPayloads: z.array(syncAttachmentPayloadSchema).optional(),
});

export async function exportVault(db: KromaLedgerDB, today: string): Promise<{ filename: string; data: Uint8Array }> {
  if (!dateOnlySchema.safeParse(today).success) throw new RangeError("Backup date must be a real ISO calendar date");
  await migrateAttachmentsToWebp(db);
  const [transactions, subscriptions, invoices, invoiceItems, categories, attachments, files, storedMeta, wallets, profile] = await db.transaction("r", [
    db.transactions, db.subscriptions, db.invoices, db.invoiceItems, db.categories, db.attachments, db.attachmentFiles, db.appMeta, db.wallets, db.profiles,
  ], () => Promise.all([
    db.transactions.toArray(), db.subscriptions.toArray(), db.invoices.toArray(), db.invoiceItems.toArray(), db.categories.toArray(),
    db.attachments.toArray(), db.attachmentFiles.toArray(), db.appMeta.get("app"), db.wallets.toArray(), db.profiles.get("profile"),
  ]));
  const dump = dumpSchema.parse({
    formatVersion: 1,
    exportedAt: today,
    transactions,
    subscriptions,
    invoices,
    invoiceItems,
    categories,
    attachments,
    attachmentFiles: files.map(({ id, mimeType, size }) => ({ id, mimeType, size })),
    appMeta: storedMeta ?? { id: "app", currency: "PHP" },
    wallets: wallets ?? [],
    profile: profile ?? undefined,
  });
  const metaById = new Map(dump.attachments.map((meta) => [meta.id, meta]));
  const fileById = new Map(files.map((file) => [file.id, file]));
  if (metaById.size !== dump.attachments.length || fileById.size !== files.length || [...metaById.keys()].some((id) => !fileById.has(id))) throw new RangeError("Attachment metadata and file records do not match");
  for (const meta of dump.attachments) {
    const file = fileById.get(meta.id)!;
    if (file.size !== meta.size || file.mimeType !== meta.mimeType || file.blob.size !== file.size) throw new RangeError("Attachment bytes do not match their metadata");
    if (meta.entityType === "TRANSACTION" && !dump.transactions.some((row) => row.id === meta.entityId)) throw new RangeError("Attachment references a missing transaction");
    if (meta.entityType === "INVOICE" && !dump.invoices.some((row) => row.id === meta.entityId)) throw new RangeError("Attachment references a missing invoice");
  }
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  zip.file("db-dump.json", JSON.stringify(dump));
  await Promise.all(files.map(async (file) => zip.file(`attachments/${file.id}`, await file.blob.arrayBuffer())));
  return { filename: `kromaledger-vault-${today}.zip`, data: await zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } }) };
}

export async function restoreVault(db: KromaLedgerDB, data: Uint8Array): Promise<void> {
  if (data.byteLength > MAX_VAULT_BYTES) throw new RangeError("Backup archive exceeds maximum 200MB limit");
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(data, { checkCRC32: true });
  const dumpFile = zip.file("db-dump.json");
  if (!dumpFile) throw new RangeError("Backup is missing db-dump.json");
  const dump = dumpSchema.parse(JSON.parse(await dumpFile.async("string")));
  if (dump.attachmentFiles.length > MAX_ATTACHMENT_COUNT) throw new RangeError(`Backup contains too many attachments (max ${MAX_ATTACHMENT_COUNT})`);
  const totalAttachmentBytes = dump.attachmentFiles.reduce((acc, f) => acc + f.size, 0);
  if (totalAttachmentBytes > MAX_VAULT_BYTES) throw new RangeError("Backup attachment payload exceeds maximum 200MB limit");
  const names = Object.values(zip.files).filter((file) => !file.dir).map((file) => file.name).sort();
  const expected = ["db-dump.json", ...dump.attachmentFiles.map((file) => `attachments/${file.id}`)].sort();
  if (names.length !== expected.length || names.some((name, index) => name !== expected[index])) throw new RangeError("Backup contains missing or unexpected files");
  const attachmentIds = new Set(dump.attachments.map((meta) => meta.id));
  if (attachmentIds.size !== dump.attachments.length) throw new RangeError("Backup contains duplicate attachment metadata");
  const invoiceIds = new Set(dump.invoices.map((invoice) => invoice.id));
  const itemIds = new Set(dump.invoiceItems.map((item) => item.id));
  const transactionIds = new Set(dump.transactions.map((transaction) => transaction.id));
  const subscriptionIds = new Set(dump.subscriptions.map((subscription) => subscription.id));
  if (invoiceIds.size !== dump.invoices.length || itemIds.size !== dump.invoiceItems.length || transactionIds.size !== dump.transactions.length || subscriptionIds.size !== dump.subscriptions.length || new Set(dump.categories.map((category) => category.id)).size !== dump.categories.length) throw new RangeError("Backup contains duplicate record IDs");
  if (dump.wallets && new Set(dump.wallets.map((w) => w.id)).size !== dump.wallets.length) throw new RangeError("Backup contains duplicate wallet IDs");
  for (const invoice of dump.invoices) {
    const linkedItems = dump.invoiceItems.filter((item) => item.invoiceId === invoice.id).map((item) => item.id).sort();
    if (linkedItems.length !== invoice.itemIds.length || linkedItems.some((id, index) => id !== [...invoice.itemIds].sort()[index]) || invoice.paidMinor > invoice.totalMinor || invoice.totalMinor !== invoice.subtotalMinor - invoice.discountMinor + invoice.taxMinor) throw new RangeError("Backup invoice totals or line references are inconsistent");
  }
  if (dump.invoiceItems.some((item) => !invoiceIds.has(item.invoiceId)) || dump.transactions.some((row) => row.invoiceId && !invoiceIds.has(row.invoiceId)) || dump.transactions.some((row) => row.subscriptionId && !subscriptionIds.has(row.subscriptionId))) throw new RangeError("Backup contains dangling ledger references");
  for (const meta of dump.attachments) {
    if ((meta.entityType === "TRANSACTION" && !transactionIds.has(meta.entityId)) || (meta.entityType === "INVOICE" && !invoiceIds.has(meta.entityId))) throw new RangeError("Backup attachment references a missing record");
  }
  if (dump.attachments.some((meta) => !dump.attachmentFiles.some((file) => file.id === meta.id))) throw new RangeError("Backup attachment file is missing");

  const restoredAttachments: AttachmentMeta[] = [];
  const restoredFiles: AttachmentFileRecord[] = [];
  for (const meta of dump.attachmentFiles) {
    const content = zip.file(`attachments/${meta.id}`);
    if (!content) throw new RangeError("Backup attachment bytes are missing");
    const bytes = await content.async("uint8array");
    if (bytes.byteLength !== meta.size || (attachmentIds.has(meta.id) && !dump.attachments.some((row) => row.id === meta.id && row.mimeType === meta.mimeType && row.size === meta.size))) throw new RangeError("Backup attachment byte count or metadata is invalid");
    const originalMeta = dump.attachments.find((row) => row.id === meta.id);
    if (!originalMeta) throw new RangeError("Backup attachment file is missing");
    const optimized = await optimizeImageToWebp(bytes, originalMeta.filename, meta.mimeType);
    const buffer = optimized.bytes.buffer.slice(optimized.bytes.byteOffset, optimized.bytes.byteOffset + optimized.bytes.byteLength);
    const blob = new Blob([buffer as ArrayBuffer], { type: optimized.mimeType });
    restoredAttachments.push({
      ...originalMeta,
      filename: optimized.filename,
      mimeType: optimized.mimeType,
      size: optimized.size,
    });
    restoredFiles.push({
      id: meta.id,
      mimeType: optimized.mimeType,
      size: optimized.size,
      blob,
    });
  }

  await db.transaction("rw", [db.transactions, db.subscriptions, db.invoices, db.invoiceItems, db.categories, db.attachments, db.attachmentFiles, db.appMeta, db.wallets, db.profiles, db.notifications], async () => {
    await Promise.all([
      db.transactions.clear(), db.subscriptions.clear(), db.invoices.clear(), db.invoiceItems.clear(),
      db.categories.clear(), db.attachments.clear(), db.attachmentFiles.clear(), db.wallets.clear(), db.profiles.clear(), db.appMeta.clear(), db.notifications.clear(),
    ]);
    await db.transactions.bulkPut(dump.transactions);
    await db.subscriptions.bulkPut(dump.subscriptions);
    await db.invoices.bulkPut(dump.invoices);
    await db.invoiceItems.bulkPut(dump.invoiceItems);
    await db.categories.bulkPut(dump.categories);
    await db.attachments.bulkPut(restoredAttachments);
    await db.attachmentFiles.bulkPut(restoredFiles);
    if (dump.wallets && dump.wallets.length > 0) {
      await db.wallets.bulkPut(dump.wallets);
    }
    if (dump.profile) {
      await db.profiles.put(dump.profile);
    }
    await db.appMeta.put(dump.appMeta);
  });
}

export async function exportSyncDump(
  db: KromaLedgerDB,
  today: string,
  options?: { includeAttachments?: boolean }
): Promise<SyncDumpPayload> {
  if (!dateOnlySchema.safeParse(today).success) {
    throw new RangeError("Backup date must be a real ISO calendar date");
  }
  await migrateAttachmentsToWebp(db);

  const [transactions, subscriptions, invoices, invoiceItems, categories, attachments, files, storedMeta, wallets, profile] = await db.transaction("r", [
    db.transactions, db.subscriptions, db.invoices, db.invoiceItems, db.categories, db.attachments, db.attachmentFiles, db.appMeta, db.wallets, db.profiles,
  ], () => Promise.all([
    db.transactions.toArray(), db.subscriptions.toArray(), db.invoices.toArray(), db.invoiceItems.toArray(), db.categories.toArray(),
    db.attachments.toArray(), db.attachmentFiles.toArray(), db.appMeta.get("app"), db.wallets.toArray(), db.profiles.get("profile"),
  ]));

  const includeAttachments = options?.includeAttachments ?? false;
  let attachmentPayloads: SyncAttachmentPayload[] = [];
  let exportedAttachments: AttachmentMeta[] = [];
  let exportedFiles: Array<{ id: string; mimeType: AttachmentMimeType; size: number }> = [];

  if (includeAttachments) {
    const metaById = new Map(attachments.map((meta) => [meta.id, meta]));
    const fileById = new Map(files.map((file) => [file.id, file]));
    if (metaById.size !== attachments.length || fileById.size !== files.length || [...metaById.keys()].some((id) => !fileById.has(id))) {
      throw new RangeError("Attachment metadata and file records do not match");
    }

    for (const meta of attachments) {
      const file = fileById.get(meta.id)!;
      if (file.size !== meta.size || file.mimeType !== meta.mimeType || file.blob.size !== file.size) {
        throw new RangeError("Attachment bytes do not match their metadata");
      }
      if (meta.entityType === "TRANSACTION" && !transactions.some((row) => row.id === meta.entityId)) {
        throw new RangeError("Attachment references a missing transaction");
      }
      if (meta.entityType === "INVOICE" && !invoices.some((row) => row.id === meta.entityId)) {
        throw new RangeError("Attachment references a missing invoice");
      }
      const arrayBuf = await file.blob.arrayBuffer();
      const base64 = bytesToBase64(new Uint8Array(arrayBuf));
      attachmentPayloads.push({
        id: meta.id,
        mimeType: meta.mimeType as AttachmentMimeType,
        size: meta.size,
        dataBase64: base64,
      });
    }

    exportedAttachments = attachments;
    exportedFiles = files.map(({ id, mimeType, size }) => ({ id, mimeType: mimeType as AttachmentMimeType, size }));
  }

  const rawDump = {
    formatVersion: 1,
    exportedAt: today,
    transactions,
    subscriptions,
    invoices,
    invoiceItems,
    categories,
    attachments: exportedAttachments,
    attachmentFiles: exportedFiles,
    attachmentPayloads,
    appMeta: storedMeta ?? { id: "app", currency: "PHP" },
    wallets: wallets ?? [],
    profile: profile ?? undefined,
  };

  return syncDumpSchema.parse(rawDump) as SyncDumpPayload;
}

export async function exportSyncFrames(
  db: KromaLedgerDB,
  today: string,
  options?: { includeAttachments?: boolean; chunkSize?: number }
): Promise<{ batch: QrStreamBatch; dump: SyncDumpPayload }> {
  const dump = await exportSyncDump(db, today, { includeAttachments: options?.includeAttachments });
  const batch = await encodePayloadToQrFrames(JSON.stringify(dump), { chunkSize: options?.chunkSize });
  return { batch, dump };
}

export function parseSyncPayload(jsonText: string): SyncDumpPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new RangeError("Backup JSON payload is malformed");
  }

  const dump = syncDumpSchema.parse(parsed) as SyncDumpPayload;
  if (dump.attachmentFiles.length > MAX_ATTACHMENT_COUNT) {
    throw new RangeError(`Backup contains too many attachments (max ${MAX_ATTACHMENT_COUNT})`);
  }
  const totalAttachmentBytes = dump.attachmentFiles.reduce((acc, f) => acc + f.size, 0);
  if (totalAttachmentBytes > MAX_VAULT_BYTES) {
    throw new RangeError("Backup attachment payload exceeds maximum 200MB limit");
  }

  const attachmentIds = new Set(dump.attachments.map((meta) => meta.id));
  if (attachmentIds.size !== dump.attachments.length) {
    throw new RangeError("Backup contains duplicate attachment metadata");
  }
  const invoiceIds = new Set(dump.invoices.map((invoice) => invoice.id));
  const itemIds = new Set(dump.invoiceItems.map((item) => item.id));
  const transactionIds = new Set(dump.transactions.map((transaction) => transaction.id));
  const subscriptionIds = new Set(dump.subscriptions.map((subscription) => subscription.id));

  if (
    invoiceIds.size !== dump.invoices.length ||
    itemIds.size !== dump.invoiceItems.length ||
    transactionIds.size !== dump.transactions.length ||
    subscriptionIds.size !== dump.subscriptions.length ||
    new Set(dump.categories.map((category) => category.id)).size !== dump.categories.length
  ) {
    throw new RangeError("Backup contains duplicate record IDs");
  }
  if (dump.wallets && new Set(dump.wallets.map((w) => w.id)).size !== dump.wallets.length) {
    throw new RangeError("Backup contains duplicate wallet IDs");
  }

  for (const invoice of dump.invoices) {
    const linkedItems = dump.invoiceItems.filter((item) => item.invoiceId === invoice.id).map((item) => item.id).sort();
    if (
      linkedItems.length !== invoice.itemIds.length ||
      linkedItems.some((id, index) => id !== [...invoice.itemIds].sort()[index]) ||
      invoice.paidMinor > invoice.totalMinor ||
      invoice.totalMinor !== invoice.subtotalMinor - invoice.discountMinor + invoice.taxMinor
    ) {
      throw new RangeError("Backup invoice totals or line references are inconsistent");
    }
  }

  if (
    dump.invoiceItems.some((item) => !invoiceIds.has(item.invoiceId)) ||
    dump.transactions.some((row) => row.invoiceId && !invoiceIds.has(row.invoiceId)) ||
    dump.transactions.some((row) => row.subscriptionId && !subscriptionIds.has(row.subscriptionId))
  ) {
    throw new RangeError("Backup contains dangling ledger references");
  }

  for (const meta of dump.attachments) {
    if ((meta.entityType === "TRANSACTION" && !transactionIds.has(meta.entityId)) || (meta.entityType === "INVOICE" && !invoiceIds.has(meta.entityId))) {
      throw new RangeError("Backup attachment references a missing record");
    }
  }

  if (dump.attachments.some((meta) => !dump.attachmentFiles.some((file) => file.id === meta.id))) {
    throw new RangeError("Backup attachment file is missing");
  }
  if (dump.attachmentFiles.some((file) => !attachmentIds.has(file.id))) {
    throw new RangeError("Backup attachment file is missing");
  }

  if (dump.attachments.length > 0) {
    const payloads = dump.attachmentPayloads ?? [];
    if (payloads.length !== dump.attachments.length) {
      throw new RangeError("Backup attachment payloads count does not match attachment metadata");
    }
    const payloadMap = new Map(payloads.map((p) => [p.id, p]));
    if (payloadMap.size !== payloads.length) {
      throw new RangeError("Backup contains duplicate attachment payload IDs");
    }
    for (const meta of dump.attachments) {
      const payload = payloadMap.get(meta.id);
      if (!payload) {
        throw new RangeError(`Backup attachment payload is missing for ${meta.id}`);
      }
      if (payload.mimeType !== meta.mimeType || payload.size !== meta.size) {
        throw new RangeError("Backup attachment byte count or metadata is invalid");
      }
    }
  }

  return dump;
}

export async function restoreSyncPayload(
  db: KromaLedgerDB,
  dumpOrJson: SyncDumpPayload | string,
  options: SyncRestoreOptions
): Promise<SyncRestoreSummary> {
  const dump = typeof dumpOrJson === "string" ? parseSyncPayload(dumpOrJson) : parseSyncPayload(JSON.stringify(dumpOrJson));

  const includeRecords = options.includeRecords ?? true;
  const includeWalletsAndProfile = options.includeWalletsAndProfile ?? true;
  const includeAttachments = options.includeAttachments ?? true;

  let preparedAttachments: AttachmentMeta[] = [];
  let preparedAttachmentFiles: AttachmentFileRecord[] = [];

  if (includeAttachments && dump.attachments.length > 0 && dump.attachmentPayloads) {
    const payloadMap = new Map(dump.attachmentPayloads.map((p) => [p.id, p]));
    for (const meta of dump.attachments) {
      const payload = payloadMap.get(meta.id);
      if (!payload) continue;
      const rawBytes = base64ToBytes(payload.dataBase64);
      if (rawBytes.byteLength !== payload.size) {
        throw new RangeError(`Decoded attachment byte count mismatch for ${meta.id}`);
      }
      const optimized = await optimizeImageToWebp(rawBytes, meta.filename, meta.mimeType);
      const buffer = optimized.bytes.buffer.slice(
        optimized.bytes.byteOffset,
        optimized.bytes.byteOffset + optimized.bytes.byteLength
      );
      const blob = new Blob([buffer as ArrayBuffer], { type: optimized.mimeType });
      preparedAttachments.push({
        ...meta,
        filename: optimized.filename,
        mimeType: optimized.mimeType,
        size: optimized.size,
      });
      preparedAttachmentFiles.push({
        id: meta.id,
        mimeType: optimized.mimeType,
        size: optimized.size,
        blob,
      });
    }
  }

  const summary: SyncRestoreSummary = {
    mode: options.mode,
    transactionsCount: 0,
    subscriptionsCount: 0,
    invoicesCount: 0,
    walletsCount: 0,
    attachmentsCount: 0,
  };

  await db.transaction("rw", [
    db.transactions,
    db.subscriptions,
    db.invoices,
    db.invoiceItems,
    db.categories,
    db.attachments,
    db.attachmentFiles,
    db.appMeta,
    db.wallets,
    db.profiles,
    db.notifications,
  ], async () => {
    if (options.mode === "OVERWRITE") {
      if (includeRecords) {
        await Promise.all([
          db.transactions.clear(),
          db.subscriptions.clear(),
          db.invoices.clear(),
          db.invoiceItems.clear(),
          db.categories.clear(),
          db.notifications.clear(),
        ]);
        await db.transactions.bulkPut(dump.transactions);
        await db.subscriptions.bulkPut(dump.subscriptions);
        await db.invoices.bulkPut(dump.invoices);
        await db.invoiceItems.bulkPut(dump.invoiceItems);
        await db.categories.bulkPut(dump.categories);
        summary.transactionsCount = dump.transactions.length;
        summary.subscriptionsCount = dump.subscriptions.length;
        summary.invoicesCount = dump.invoices.length;
      }

      if (includeWalletsAndProfile) {
        await Promise.all([
          db.wallets.clear(),
          db.profiles.clear(),
          db.appMeta.clear(),
        ]);
        if (dump.wallets && dump.wallets.length > 0) {
          await db.wallets.bulkPut(dump.wallets);
          summary.walletsCount = dump.wallets.length;
        }
        if (dump.profile) {
          await db.profiles.put(dump.profile);
        }
        await db.appMeta.put(dump.appMeta);
      }

      if (includeAttachments) {
        await Promise.all([
          db.attachments.clear(),
          db.attachmentFiles.clear(),
        ]);
        const currentTxIds = new Set((await db.transactions.toArray()).map((t) => t.id));
        const currentInvIds = new Set((await db.invoices.toArray()).map((i) => i.id));
        const validAttachments = preparedAttachments.filter((meta) =>
          meta.entityType === "TRANSACTION" ? currentTxIds.has(meta.entityId) : currentInvIds.has(meta.entityId)
        );
        const validIds = new Set(validAttachments.map((a) => a.id));
        const validFiles = preparedAttachmentFiles.filter((f) => validIds.has(f.id));

        await db.attachments.bulkPut(validAttachments);
        await db.attachmentFiles.bulkPut(validFiles);
        summary.attachmentsCount = validAttachments.length;
      }
    } else {
      // MERGE mode
      const existingTx = await db.transactions.toArray();
      const existingInv = await db.invoices.toArray();
      const existingSub = await db.subscriptions.toArray();

      const combinedInvIds = new Set([
        ...existingInv.map((i) => i.id),
        ...(includeRecords ? dump.invoices.map((i) => i.id) : []),
      ]);
      const combinedSubIds = new Set([
        ...existingSub.map((s) => s.id),
        ...(includeRecords ? dump.subscriptions.map((s) => s.id) : []),
      ]);
      const combinedTxIds = new Set([
        ...existingTx.map((t) => t.id),
        ...(includeRecords ? dump.transactions.map((t) => t.id) : []),
      ]);

      if (includeRecords) {
        const validTransactions = dump.transactions.filter(
          (tx) =>
            (!tx.invoiceId || combinedInvIds.has(tx.invoiceId)) &&
            (!tx.subscriptionId || combinedSubIds.has(tx.subscriptionId))
        );
        await db.transactions.bulkPut(validTransactions);
        await db.subscriptions.bulkPut(dump.subscriptions);
        await db.invoices.bulkPut(dump.invoices);
        await db.invoiceItems.bulkPut(dump.invoiceItems);
        await db.categories.bulkPut(dump.categories);

        summary.transactionsCount = validTransactions.length;
        summary.subscriptionsCount = dump.subscriptions.length;
        summary.invoicesCount = dump.invoices.length;
      }

      if (includeWalletsAndProfile) {
        if (dump.wallets && dump.wallets.length > 0) {
          await db.wallets.bulkPut(dump.wallets);
          summary.walletsCount = dump.wallets.length;
        }
        if (dump.profile) {
          await db.profiles.put(dump.profile);
        }
        await db.appMeta.put(dump.appMeta);
      }

      if (includeAttachments) {
        const validAttachments = preparedAttachments.filter((meta) =>
          meta.entityType === "TRANSACTION"
            ? combinedTxIds.has(meta.entityId)
            : combinedInvIds.has(meta.entityId)
        );
        const validIds = new Set(validAttachments.map((a) => a.id));
        const validFiles = preparedAttachmentFiles.filter((f) => validIds.has(f.id));

        await db.attachments.bulkPut(validAttachments);
        await db.attachmentFiles.bulkPut(validFiles);
        summary.attachmentsCount = validAttachments.length;
      }
    }
  });

  return summary;
}

