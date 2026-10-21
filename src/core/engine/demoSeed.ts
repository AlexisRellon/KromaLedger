import { addDays, format, parseISO } from "date-fns";
import { appMetaSchema, categorySchema, invoiceItemSchema, invoiceSchema, subscriptionSchema, transactionSchema, userProfileSchema, walletSchema, type AppMeta, type Category, type Invoice, type InvoiceItem, type Subscription, type Transaction, type UserProfile, type Wallet } from "../models";

export interface DemoSeed { categories: Category[]; transactions: Transaction[]; subscriptions: Subscription[]; invoices: Invoice[]; invoiceItems: InvoiceItem[]; appMeta: AppMeta; wallets?: Wallet[]; profile?: UserProfile }

export function createDemoSeed(today: string): DemoSeed {
  const day = (offset: number) => format(addDays(parseISO(today), offset), "yyyy-MM-dd");
  const categories = [
    { id: "cat-home", name: "Home", color: "#A3A3A3", type: "EXPENSE" }, { id: "cat-dining", name: "Dining", color: "#D9F938", type: "EXPENSE" },
    { id: "cat-groceries", name: "Groceries", color: "#84CC16", type: "EXPENSE" }, { id: "cat-utilities", name: "Utilities", color: "#FBBF24", type: "EXPENSE" },
    { id: "cat-services", name: "Services", color: "#60A5FA", type: "EXPENSE" }, { id: "cat-transport", name: "Transport", color: "#F59E0B", type: "EXPENSE" },
    { id: "cat-income", name: "Income", color: "#D9F938", type: "INCOME" },
  ].map((row) => categorySchema.parse(row));
  const transactions = [
    { id: "seed-rent", date: day(-15), title: "Rent", amountMinor: -1601100, currency: "PHP", type: "SUBSCRIPTION_PAYMENT", categoryId: "cat-home", subscriptionId: "sub-rent" },
    { id: "seed-groceries", date: day(-5), title: "Groceries", amountMinor: -1200000, currency: "PHP", type: "EXPENSE", categoryId: "cat-groceries" },
    { id: "seed-dining", date: day(-4), title: "Dining", amountMinor: -800000, currency: "PHP", type: "EXPENSE", categoryId: "cat-dining" },
    { id: "seed-utilities", date: day(-2), title: "Utilities", amountMinor: -543500, currency: "PHP", type: "EXPENSE", categoryId: "cat-utilities" },
    { id: "seed-copilot", date: day(-3), title: "GitHub Copilot Pro", amountMinor: -56000, currency: "PHP", type: "SUBSCRIPTION_PAYMENT", categoryId: "cat-services", subscriptionId: "sub-copilot" },
    { id: "seed-grab", date: day(-1), title: "GrabCar Commute", amountMinor: -24500, currency: "PHP", type: "EXPENSE", categoryId: "cat-transport" },
    { id: "seed-netflix", date: day(-2), title: "Netflix", amountMinor: -54900, currency: "PHP", type: "SUBSCRIPTION_PAYMENT", categoryId: "cat-services", subscriptionId: "sub-netflix" },
    { id: "seed-milestone", date: day(-5), title: "Client UI Milestone", amountMinor: 1800000, currency: "PHP", type: "INCOME", categoryId: "cat-income", invoiceId: "inv-103" },
    { id: "seed-invoice-payment", date: day(-3), title: "Invoice #104 Payment", amountMinor: 30000, currency: "PHP", type: "INCOME", categoryId: "cat-income", invoiceId: "inv-104" },
  ].map((row) => transactionSchema.parse(row));
  const subscriptions = [
    { id: "sub-rent", title: "Rent", amountMinor: 1601100, currency: "PHP", billingCycle: "MONTHLY", nextBillingDate: day(15), billingAnchorDate: day(15), active: true, autoLog: true, categoryId: "cat-home" },
    { id: "sub-copilot", title: "GitHub Copilot Pro", amountMinor: 56000, currency: "PHP", billingCycle: "MONTHLY", nextBillingDate: day(10), billingAnchorDate: day(10), active: true, autoLog: true, categoryId: "cat-services" },
    { id: "sub-netflix", title: "Netflix", amountMinor: 54900, currency: "PHP", billingCycle: "MONTHLY", nextBillingDate: day(1), billingAnchorDate: day(1), active: true, autoLog: true, categoryId: "cat-services" },
  ].map((row) => subscriptionSchema.parse(row));
  const invoiceItems = [
    invoiceItemSchema.parse({ id: "inv-103-line", invoiceId: "inv-103", description: "Client UI milestone", quantity: 1, unitPriceMinor: 1800000 }),
    invoiceItemSchema.parse({ id: "inv-104-line", invoiceId: "inv-104", description: "Design services", quantity: 1, unitPriceMinor: 120000 }),
  ];
  const invoices = [
    invoiceSchema.parse({ id: "inv-103", title: "Invoice #103", direction: "RECEIVABLE", dueDate: day(-5), status: "PAID", subtotalMinor: 1800000, taxMinor: 0, discountMinor: 0, totalMinor: 1800000, paidMinor: 1800000, currency: "PHP", itemIds: ["inv-103-line"], contact: "Client" }),
    invoiceSchema.parse({ id: "inv-104", title: "Invoice #104", direction: "RECEIVABLE", dueDate: day(4), status: "PARTIAL", subtotalMinor: 120000, taxMinor: 0, discountMinor: 0, totalMinor: 120000, paidMinor: 30000, currency: "PHP", itemIds: ["inv-104-line"], contact: "Client" }),
  ];
  const wallets = [
    walletSchema.parse({ id: "wallet-cash", name: "Physical Cash", type: "CASH", currency: "PHP", balanceMinor: 150000, color: "#10B981", isDefault: true, createdAt: today }),
    walletSchema.parse({ id: "wallet-gcash", name: "GCash", type: "E_WALLET", currency: "PHP", balanceMinor: 485000, color: "#007DFE", institution: "GCash", accountNumber: "•• 8821", isDefault: false, createdAt: today }),
    walletSchema.parse({ id: "wallet-bdo", name: "BDO Business Checking", type: "BANK", currency: "PHP", balanceMinor: 2500000, color: "#6366F1", institution: "BDO", accountNumber: "•• 4019", isDefault: false, createdAt: today }),
  ];
  const profile = userProfileSchema.parse({
    id: "profile",
    name: "Operator",
    handle: "operator",
    email: "operator@kroma.local",
    initials: "KO",
    themeColor: "#D9F938",
    defaultCurrency: "PHP",
    bio: "100% on-device local ledger",
    createdAt: today,
  });
  return { categories, transactions, subscriptions, invoices, invoiceItems, wallets, profile, appMeta: appMetaSchema.parse({ id: "app", currency: "PHP", seedVersion: 1 }) };
}
