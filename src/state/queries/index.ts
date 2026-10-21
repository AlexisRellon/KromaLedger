import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Invoice, InvoiceItem, Subscription, Transaction, UserProfile, Wallet } from "../../core/models";
import { useStorage } from "../StorageContext";
import { useUIStore } from "../useUIStore";

export const queryKeys = {
  transactions: ["transactions"] as const,
  subscriptions: ["subscriptions"] as const,
  invoices: ["invoices"] as const,
  categories: ["categories"] as const,
  attachments: ["attachments"] as const,
  profile: ["profile"] as const,
  wallets: ["wallets"] as const,
};
export function useTransactions() { const { repo } = useStorage(); const month = useUIStore((s) => s.selectedMonth); return useQuery({ queryKey: [...queryKeys.transactions, month], queryFn: () => repo.listTransactions(`${month}-01`, `${month}-31`) }); }
export function useAllTransactions() { const { repo } = useStorage(); return useQuery({ queryKey: queryKeys.transactions, queryFn: () => repo.listTransactions() }); }
export function useSubscriptions() { const { repo } = useStorage(); return useQuery({ queryKey: queryKeys.subscriptions, queryFn: () => repo.listSubscriptions() }); }
export function useInvoices() { const { repo } = useStorage(); return useQuery({ queryKey: queryKeys.invoices, queryFn: () => repo.listInvoices() }); }
export function useCategories() { const { repo } = useStorage(); return useQuery({ queryKey: queryKeys.categories, queryFn: () => repo.listCategories() }); }
export function useAttachments() { const { repo } = useStorage(); return useQuery({ queryKey: queryKeys.attachments, queryFn: () => repo.listAttachments() }); }
export function useProfile() { const { repo } = useStorage(); return useQuery({ queryKey: queryKeys.profile, queryFn: () => repo.getProfile() }); }
export function useWallets() { const { repo } = useStorage(); return useQuery({ queryKey: queryKeys.wallets, queryFn: () => repo.listWallets() }); }

export function useSaveProfile() {
  const { repo } = useStorage();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (value: UserProfile) => repo.saveProfile(value),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.profile }),
  });
}

export function useSaveWallet() {
  const { repo } = useStorage();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (value: Wallet) => repo.saveWallet(value),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.wallets }),
  });
}

export function useDeleteWallet() {
  const { repo } = useStorage();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.deleteWallet(id),
    onSuccess: () => Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.wallets }),
      client.invalidateQueries({ queryKey: queryKeys.transactions }),
    ]),
  });
}

export function useClearAllData() {
  const { repo } = useStorage();
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => repo.clearAllData(),
    onSuccess: () => client.invalidateQueries(),
  });
}

export function useResetToDemo() {
  const { repo } = useStorage();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (today?: string) => repo.resetToDemo(today),
    onSuccess: () => client.invalidateQueries(),
  });
}

export function useSaveAttachment() { const { files } = useStorage(); const client = useQueryClient(); return useMutation({ mutationFn: ({ meta, data }: { meta: import("../../core/models").AttachmentMeta; data: Uint8Array }) => files.saveAttachment(meta, data), onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.attachments }) }); }
export function useSaveTransaction() { const { repo } = useStorage(); const client = useQueryClient(); return useMutation({ mutationFn: (value: Transaction) => repo.saveTransaction(value), onSuccess: () => Promise.all([client.invalidateQueries({ queryKey: queryKeys.transactions }), client.invalidateQueries({ queryKey: queryKeys.wallets }), client.invalidateQueries({ queryKey: queryKeys.invoices })]) }); }
export function useDeleteTransaction() { const { repo } = useStorage(); const client = useQueryClient(); return useMutation({ mutationFn: (id: string) => repo.deleteTransaction(id), onSuccess: () => Promise.all([client.invalidateQueries({ queryKey: queryKeys.transactions }), client.invalidateQueries({ queryKey: queryKeys.wallets }), client.invalidateQueries({ queryKey: queryKeys.attachments }), client.invalidateQueries({ queryKey: queryKeys.invoices })]) }); }
export function useSaveSubscription() { const { repo } = useStorage(); const client = useQueryClient(); return useMutation({ mutationFn: (value: Subscription) => repo.saveSubscription(value), onSuccess: () => Promise.all([client.invalidateQueries({ queryKey: queryKeys.subscriptions }), client.invalidateQueries({ queryKey: queryKeys.wallets })]) }); }
export function useDeleteSubscription() { const { repo } = useStorage(); const client = useQueryClient(); return useMutation({ mutationFn: (id: string) => repo.deleteSubscription(id), onSuccess: () => Promise.all([client.invalidateQueries({ queryKey: queryKeys.subscriptions }), client.invalidateQueries({ queryKey: queryKeys.transactions }), client.invalidateQueries({ queryKey: queryKeys.wallets })]) }); }
export function useDeleteInvoice() { const { repo } = useStorage(); const client = useQueryClient(); return useMutation({ mutationFn: (id: string) => repo.deleteInvoice(id), onSuccess: () => Promise.all([client.invalidateQueries({ queryKey: queryKeys.invoices }), client.invalidateQueries({ queryKey: queryKeys.transactions }), client.invalidateQueries({ queryKey: queryKeys.wallets })]) }); }
export function useConfirmSubscriptionPayment() { const { repo } = useStorage(); const client = useQueryClient(); return useMutation({ mutationFn: (payment: Transaction) => repo.confirmSubscriptionPayment(payment), onSuccess: () => Promise.all([client.invalidateQueries({ queryKey: queryKeys.subscriptions }), client.invalidateQueries({ queryKey: queryKeys.transactions }), client.invalidateQueries({ queryKey: queryKeys.wallets })]) }); }
export function useSaveInvoice() { const { repo } = useStorage(); const client = useQueryClient(); return useMutation({ mutationFn: ({ invoice, items }: { invoice: Invoice; items: InvoiceItem[] }) => repo.saveInvoiceWithItems(invoice, items), onSuccess: () => Promise.all([client.invalidateQueries({ queryKey: queryKeys.invoices }), client.invalidateQueries({ queryKey: queryKeys.transactions }), client.invalidateQueries({ queryKey: queryKeys.wallets })]) }); }
export function useReconcileCommand() { const { repo } = useStorage(); const client = useQueryClient(); return useMutation({ mutationFn: (today: string) => repo.reconcile(today), onSuccess: () => Promise.all([client.invalidateQueries({ queryKey: queryKeys.transactions }), client.invalidateQueries({ queryKey: queryKeys.subscriptions }), client.invalidateQueries({ queryKey: queryKeys.invoices }), client.invalidateQueries({ queryKey: queryKeys.wallets })]) }); }
export function useRecordInvoicePayment() { const { repo } = useStorage(); const client = useQueryClient(); return useMutation({ mutationFn: ({ invoiceId, payment }: { invoiceId: string; payment: Transaction }) => repo.recordInvoicePayment(invoiceId, payment), onSuccess: () => Promise.all([client.invalidateQueries({ queryKey: queryKeys.transactions }), client.invalidateQueries({ queryKey: queryKeys.invoices }), client.invalidateQueries({ queryKey: queryKeys.wallets })]) }); }
