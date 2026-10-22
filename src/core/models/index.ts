import { z } from "zod";

export const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Expected a real ISO calendar date");
const idSchema = z.string().min(1);
const amountSchema = z.number().int().safe();
const currencySchema = z.string().length(3).default("PHP");

export const transactionTypeSchema = z.enum(["EXPENSE", "SUBSCRIPTION_PAYMENT", "INCOME", "TRANSFER"]);
export const transferChannelSchema = z.enum(["INSTAPAY", "PESONET", "DIRECT", "MANUAL"]);
export type TransferChannel = z.infer<typeof transferChannelSchema>;

export const transactionSchema = z.object({
  id: idSchema, date: dateOnlySchema, title: z.string().min(1), amountMinor: amountSchema,
  currency: currencySchema, type: transactionTypeSchema, categoryId: idSchema.optional(), notes: z.string().optional(),
  subscriptionId: idSchema.optional(), invoiceId: idSchema.optional(), walletId: idSchema.optional(),
  toWalletId: idSchema.optional(), feeMinor: amountSchema.nonnegative().optional(), channel: transferChannelSchema.optional(),
});
export type Transaction = z.infer<typeof transactionSchema>;

export const billingCycleSchema = z.enum(["WEEKLY", "MONTHLY", "YEARLY"]);
export const subscriptionSchema = z.object({
  id: idSchema, title: z.string().min(1), amountMinor: amountSchema.nonnegative(), currency: currencySchema,
  billingCycle: billingCycleSchema, nextBillingDate: dateOnlySchema, billingAnchorDate: dateOnlySchema.optional(), active: z.boolean(), autoLog: z.boolean(), categoryId: idSchema.optional(),
  walletId: idSchema.optional(),
});
export type Subscription = z.infer<typeof subscriptionSchema>;

export const invoiceStatusSchema = z.enum(["DRAFT", "PENDING", "PARTIAL", "PAID", "OVERDUE"]);
export const invoiceDirectionSchema = z.enum(["PAYABLE", "RECEIVABLE"]);
export const invoiceItemSchema = z.object({ id: idSchema, invoiceId: idSchema, description: z.string().min(1), quantity: z.number().positive(), unitPriceMinor: amountSchema.nonnegative() });
export type InvoiceItem = z.infer<typeof invoiceItemSchema>;
export const invoiceSchema = z.object({
  id: idSchema, title: z.string().min(1), direction: invoiceDirectionSchema, dueDate: dateOnlySchema, status: invoiceStatusSchema,
  subtotalMinor: amountSchema.nonnegative(), taxMinor: amountSchema.nonnegative(), discountMinor: amountSchema.nonnegative(),
  totalMinor: amountSchema.nonnegative(), paidMinor: amountSchema.nonnegative(), currency: currencySchema, itemIds: z.array(idSchema),
  contact: z.string().optional(), categoryId: idSchema.optional(),
});
export type Invoice = z.infer<typeof invoiceSchema>;

export const categorySchema = z.object({ id: idSchema, name: z.string().min(1), color: z.string().optional(), type: z.enum(["EXPENSE", "INCOME", "BOTH"]).default("BOTH") });
export type Category = z.infer<typeof categorySchema>;
export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
] as const;
export const attachmentMimeTypeSchema = z.enum(ALLOWED_ATTACHMENT_MIME_TYPES);
export type AttachmentMimeType = z.infer<typeof attachmentMimeTypeSchema>;

export const attachmentMetaSchema = z.object({
  id: idSchema,
  filename: z.string().min(1),
  mimeType: attachmentMimeTypeSchema,
  size: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  entityType: z.enum(["TRANSACTION", "INVOICE"]),
  entityId: idSchema,
});
export type AttachmentMeta = z.infer<typeof attachmentMetaSchema>;
export const appMetaSchema = z.object({ id: z.literal("app"), lastReconciledDate: dateOnlySchema.optional(), seedVersion: z.number().int().nonnegative().default(0), currency: currencySchema });
export type AppMeta = z.infer<typeof appMetaSchema>;

export const userProfileSchema = z.object({
  id: z.literal("profile").default("profile"),
  name: z.string().min(1).default("Anonymous Operator"),
  handle: z.string().default("operator"),
  email: z.string().default("operator@kroma.local"),
  initials: z.string().max(4).default("KO"),
  themeColor: z.string().default("#D9F938"),
  defaultCurrency: currencySchema.default("PHP"),
  bio: z.string().default("100% on-device local ledger"),
  createdAt: z.string().optional(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;

export const walletTypeSchema = z.enum(["CASH", "BANK", "E_WALLET", "CRYPTO", "CREDIT", "OTHER"]);
export type WalletType = z.infer<typeof walletTypeSchema>;

export const walletSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  type: walletTypeSchema.default("CASH"),
  currency: currencySchema.default("PHP"),
  balanceMinor: amountSchema.default(0),
  color: z.string().default("#D9F938"),
  accountNumber: z.string().optional(),
  institution: z.string().optional(),
  isDefault: z.boolean().default(false),
  createdAt: z.string().optional(),
});
export type Wallet = z.infer<typeof walletSchema>;

export function formatCurrency(amountMinor: number, currency = "PHP", locale = "en-PH"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amountMinor / 100);
}

export function formatWalletLabel(wallet: Pick<Wallet, "name" | "institution">): string {
  const inst = wallet.institution?.trim();
  const name = wallet.name.trim();
  if (inst && inst.toLowerCase() !== name.toLowerCase()) {
    return `${inst} · ${name}`;
  }
  return name;
}

export const notificationTypeSchema = z.enum(["INFO", "WARNING", "ALERT", "SUCCESS"]);
export type NotificationType = z.infer<typeof notificationTypeSchema>;

export const appNotificationSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  message: z.string().min(1),
  type: notificationTypeSchema,
  createdAt: z.string(),
  read: z.boolean().default(false),
  entityType: z.enum(["SUBSCRIPTION", "INVOICE", "WALLET", "SYSTEM"]).optional(),
  entityId: idSchema.optional(),
  actionLink: z.string().optional(),
});
export type AppNotification = z.infer<typeof appNotificationSchema>;

