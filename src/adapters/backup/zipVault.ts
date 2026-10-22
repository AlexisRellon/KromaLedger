import { z } from "zod";
import { appMetaSchema, attachmentMetaSchema, attachmentMimeTypeSchema, categorySchema, dateOnlySchema, invoiceItemSchema, invoiceSchema, subscriptionSchema, transactionSchema, userProfileSchema, walletSchema } from "../../core/models";
import { KromaLedgerDB, type AttachmentFileRecord } from "../web-dexie/db";

export const MAX_VAULT_BYTES = 200 * 1024 * 1024; // 200 MB
export const MAX_ATTACHMENT_COUNT = 1000;

const fileMetaSchema = z.object({ id: z.string().regex(/^[A-Za-z0-9_-]+$/), mimeType: attachmentMimeTypeSchema, size: z.number().int().nonnegative() });
const dumpSchema = z.object({
  formatVersion: z.literal(1), exportedAt: dateOnlySchema, transactions: z.array(transactionSchema), subscriptions: z.array(subscriptionSchema),
  invoices: z.array(invoiceSchema), invoiceItems: z.array(invoiceItemSchema), categories: z.array(categorySchema),
  attachments: z.array(attachmentMetaSchema), attachmentFiles: z.array(fileMetaSchema), appMeta: appMetaSchema,
  wallets: z.array(walletSchema).default([]),
  profile: userProfileSchema.optional(),
});

export async function exportVault(db: KromaLedgerDB, today: string): Promise<{ filename: string; data: Uint8Array }> {
  if (!dateOnlySchema.safeParse(today).success) throw new RangeError("Backup date must be a real ISO calendar date");
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
  const restoredFiles: AttachmentFileRecord[] = await Promise.all(dump.attachmentFiles.map(async (meta) => {
    const content = zip.file(`attachments/${meta.id}`);
    if (!content) throw new RangeError("Backup attachment bytes are missing");
    const bytes = await content.async("uint8array");
    if (bytes.byteLength !== meta.size || (attachmentIds.has(meta.id) && !dump.attachments.some((row) => row.id === meta.id && row.mimeType === meta.mimeType && row.size === meta.size))) throw new RangeError("Backup attachment byte count or metadata is invalid");
    const isImage = meta.mimeType.startsWith("image/");
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    return { ...meta, blob: new Blob([buffer as ArrayBuffer], { type: isImage ? meta.mimeType : "application/octet-stream" }) };
  }));
  if (dump.attachments.some((meta) => !dump.attachmentFiles.some((file) => file.id === meta.id))) throw new RangeError("Backup attachment file is missing");
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
    await db.attachments.bulkPut(dump.attachments);
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
