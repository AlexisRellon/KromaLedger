import Dexie, { type Table } from "dexie";
import type { AppMeta, AppNotification, AttachmentMeta, Category, Invoice, InvoiceItem, Subscription, Transaction, UserProfile, Wallet } from "../../core/models";

export interface AttachmentFileRecord {
  id: string;
  mimeType: string;
  size: number;
  blob: Blob;
}

export class KromaLedgerDB extends Dexie {
  transactions!: Table<Transaction, string>;
  subscriptions!: Table<Subscription, string>;
  invoices!: Table<Invoice, string>;
  invoiceItems!: Table<InvoiceItem, string>;
  categories!: Table<Category, string>;
  attachments!: Table<AttachmentMeta, string>;
  attachmentFiles!: Table<AttachmentFileRecord, string>;
  appMeta!: Table<AppMeta, string>;
  wallets!: Table<Wallet, string>;
  profiles!: Table<UserProfile, string>;
  notifications!: Table<AppNotification, string>;

  constructor() {
    super("KromaLedgerDB");
    this.version(2).stores({
      transactions: "&id,date,type,categoryId,subscriptionId,invoiceId",
      subscriptions: "&id,title,nextBillingDate,active,autoLog",
      invoices: "&id,dueDate,status,direction",
      invoiceItems: "&id,invoiceId",
      categories: "&id,name,type",
      attachments: "&id,[entityType+entityId]",
      attachmentFiles: "&id,mimeType,size",
      appMeta: "&id",
    });
    this.version(3).stores({
      transactions: "&id,date,type,categoryId,subscriptionId,invoiceId,walletId",
      wallets: "&id,name,type,isDefault",
      profiles: "&id",
    });
    this.version(4).stores({
      transactions: "&id,date,type,categoryId,subscriptionId,invoiceId,walletId,toWalletId",
    });
    this.version(5).stores({
      notifications: "&id,createdAt,read,type,entityId",
    });
  }
}
