import { z } from "zod";

export const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Expected a real ISO calendar date");
const idSchema = z.string().min(1);
const amountSchema = z.number().int().safe();
const currencySchema = z.string().length(3).default("PHP");

export const transactionTypeSchema = z.enum(["EXPENSE", "SUBSCRIPTION_PAYMENT", "INCOME", "TRANSFER", "INTEREST"]);
export const transferChannelSchema = z.enum(["INSTAPAY", "PESONET", "DIRECT", "MANUAL"]);
export type TransferChannel = z.infer<typeof transferChannelSchema>;

export const periodKeySchema = z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/);

export const interestMetaSchema = z.object({
  ruleId: idSchema,
  periodKey: periodKeySchema,
  isEstimated: z.boolean(),
  locked: z.boolean(),
  grossMinor: amountSchema.nonnegative(),
  taxMinor: amountSchema.nonnegative(),
});
export type InterestMeta = z.infer<typeof interestMetaSchema>;

export const transactionSchema = z.object({
  id: idSchema, date: dateOnlySchema, title: z.string().min(1), amountMinor: amountSchema,
  currency: currencySchema, type: transactionTypeSchema, categoryId: idSchema.optional(), notes: z.string().optional(),
  subscriptionId: idSchema.optional(), invoiceId: idSchema.optional(), walletId: idSchema.optional(),
  toWalletId: idSchema.optional(), feeMinor: amountSchema.nonnegative().optional(), channel: transferChannelSchema.optional(),
  cashIn: z.boolean().optional(), cashInProvider: z.string().optional(), cashInFeeBps: amountSchema.nonnegative().optional(),
  customLabels: z.array(z.string()).optional(),
  interestMeta: interestMetaSchema.optional(),
});
export type Transaction = z.infer<typeof transactionSchema>;

export const billingCycleSchema = z.enum(["WEEKLY", "MONTHLY", "YEARLY"]);
export const subscriptionSchema = z.object({
  id: idSchema, title: z.string().min(1), amountMinor: amountSchema.nonnegative(), currency: currencySchema,
  billingCycle: billingCycleSchema, nextBillingDate: dateOnlySchema, billingAnchorDate: dateOnlySchema.optional(), active: z.boolean(), autoLog: z.boolean(), categoryId: idSchema.optional(),
  walletId: idSchema.optional(),
  customLabels: z.array(z.string()).optional(),
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
  customLabels: z.array(z.string()).optional(),
  obligation: z.object({
    kind: z.enum(["LOAN", "INSTALLMENT"]), paymentMinor: amountSchema.positive(),
    cycle: billingCycleSchema, firstDueDate: dateOnlySchema, walletId: idSchema.optional(),
  }).optional(),
}).refine((invoice) => !invoice.obligation || (invoice.direction === "PAYABLE" && invoice.obligation.paymentMinor <= invoice.totalMinor && invoice.paidMinor <= invoice.totalMinor), "Invalid obligation amount or payment schedule");
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
  email: z.string().default("operator@kaban.local"),
  initials: z.string().max(4).default("KO"),
  themeColor: z.string().default("#D9F938"),
  defaultCurrency: currencySchema.default("PHP"),
  bio: z.string().default("100% on-device local ledger"),
  createdAt: z.string().optional(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;

export const walletTypeSchema = z.enum(["CASH", "BANK", "E_WALLET", "CRYPTO", "CREDIT", "OTHER"]);
export type WalletType = z.infer<typeof walletTypeSchema>;

export const walletPatternSchema = z.enum([
  "LEDGER",
  "SOLIHIYA",
  "BAUHAUS",
  "ISOMETRIC",
  "YAKAN",
  "IBALOI",
  "ILOKANO",
  "KALINGA",
  "VISAYAN",
]);
export type WalletPattern = z.infer<typeof walletPatternSchema>;

export const cardNetworkSchema = z.enum(["VISA", "MASTERCARD", "NONE"]);
export type CardNetwork = z.infer<typeof cardNetworkSchema>;

export const walletSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  type: walletTypeSchema.default("CASH"),
  currency: currencySchema.default("PHP"),
  balanceMinor: amountSchema.default(0),
  color: z.string().default("#D9F938"),
  pattern: walletPatternSchema.optional(),
  cardNetwork: cardNetworkSchema.optional(),
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

export const interestTierSchema = z.object({
  upToMinor: amountSchema.positive().nullable(),
  rateBps: amountSchema.nonnegative().max(100000),
});
export type InterestTier = z.infer<typeof interestTierSchema>;

export const interestRuleSchema = z.object({
  id: idSchema,
  walletId: idSchema,
  enabled: z.boolean().default(true),
  presetId: z.string().optional(),
  presetVersion: z.number().int().positive().optional(),
  tiers: z.array(interestTierSchema).min(1).refine((tiers) => {
    for (let i = 0; i < tiers.length; i += 1) {
      const cap = tiers[i]!.upToMinor;
      if (cap === null) {
        if (i !== tiers.length - 1) return false;
      } else if (i > 0) {
        const prev = tiers[i - 1]!.upToMinor;
        if (prev === null || cap <= prev) return false;
      }
    }
    return true;
  }, "Tiers must have strictly increasing upToMinor values with null allowed only on the final tier"),
  tierMode: z.enum(["MARGINAL", "WHOLE_BALANCE"]).default("MARGINAL"),
  promoBoostBps: amountSchema.nonnegative().max(100000).default(0),
  promoCapMinor: amountSchema.positive().optional(),
  promoExpiresOn: dateOnlySchema.optional(),
  withholdingTaxBps: amountSchema.nonnegative().max(10000).default(2000),
  dayCountBasis: z.union([z.literal(365), z.literal(366), z.literal(360)]).default(365),
  payoutFrequency: z.enum(["DAILY", "MONTHLY"]),
  monthlyPayoutDay: z.number().int().min(1).max(31).optional(),
  rounding: z.enum(["FLOOR", "HALF_UP"]).default("FLOOR"),
  startDate: dateOnlySchema,
  lastPostedPeriodKey: periodKeySchema.optional(),
});
export type InterestRule = z.infer<typeof interestRuleSchema>;

export * from "./ai";

