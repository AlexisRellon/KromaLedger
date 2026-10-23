import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import type { AppNotification, Invoice, InvoiceItem, Subscription, Transaction, UserProfile, Wallet } from "../../core/models";
import { useStorage } from "../StorageContext";
import { useUIStore } from "../useUIStore";

export const queryKeys = {
  transactions: ["transactions"] as const,
  transactionMonth: (month: string) => ["transactions", month] as const,
  transactionCount: ["transactions", "count"] as const,
  subscriptions: ["subscriptions"] as const,
  invoices: ["invoices"] as const,
  categories: ["categories"] as const,
  attachments: ["attachments"] as const,
  profile: ["profile"] as const,
  wallets: ["wallets"] as const,
  notifications: ["notifications"] as const,
};

export function useTransactions(customMonth?: string) {
  const { repo } = useStorage();
  const selectedMonth = useUIStore((s) => s.selectedMonth);
  const month = customMonth ?? selectedMonth;
  const nowMonth = format(new Date(), "yyyy-MM");
  const isPast = month < nowMonth;
  return useQuery({
    queryKey: [...queryKeys.transactions, month],
    queryFn: () => repo.listTransactions(`${month}-01`, `${month}-31`),
    staleTime: isPast ? 10 * 60 * 1000 : 60_000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useAllTransactions() {
  const { repo } = useStorage();
  return useQuery({
    queryKey: queryKeys.transactions,
    queryFn: () => repo.listTransactions(),
    staleTime: 60_000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useTransactionCount() {
  const { repo } = useStorage();
  return useQuery({
    queryKey: queryKeys.transactionCount,
    queryFn: () => (repo.countTransactions ? repo.countTransactions() : repo.listTransactions().then((t) => t.length)),
    staleTime: 60_000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useSubscriptions() {
  const { repo } = useStorage();
  return useQuery({
    queryKey: queryKeys.subscriptions,
    queryFn: () => repo.listSubscriptions(),
    staleTime: 2 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useInvoices() {
  const { repo } = useStorage();
  return useQuery({
    queryKey: queryKeys.invoices,
    queryFn: () => repo.listInvoices(),
    staleTime: 2 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useCategories() {
  const { repo } = useStorage();
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => repo.listCategories(),
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

export function useAttachments() {
  const { repo } = useStorage();
  return useQuery({
    queryKey: queryKeys.attachments,
    queryFn: () => repo.listAttachments(),
    staleTime: 60_000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useProfile() {
  const { repo } = useStorage();
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => repo.getProfile(),
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useWallets() {
  const { repo } = useStorage();
  return useQuery({
    queryKey: queryKeys.wallets,
    queryFn: () => repo.listWallets(),
    staleTime: 2 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useNotifications() {
  const { repo } = useStorage();
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => repo.listNotifications(),
    staleTime: 60_000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useSaveProfile() {
  const { repo } = useStorage();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (value: UserProfile) => repo.saveProfile(value),
    onSuccess: (saved) => {
      client.setQueryData(queryKeys.profile, saved);
      return client.invalidateQueries({ queryKey: queryKeys.profile });
    },
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
      client.invalidateQueries({ queryKey: queryKeys.transactionCount }),
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

export function useSaveAttachment() {
  const { files } = useStorage();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ meta, data }: { meta: import("../../core/models").AttachmentMeta; data: Uint8Array }) => files.saveAttachment(meta, data),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.attachments }),
  });
}

export function useSaveTransaction() {
  const { repo } = useStorage();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (value: Transaction) => repo.saveTransaction(value),
    onMutate: async (newTx: Transaction) => {
      const txMonth = newTx.date.slice(0, 7);
      const monthKey = [...queryKeys.transactions, txMonth];
      await client.cancelQueries({ queryKey: monthKey });
      const previousMonthTx = client.getQueryData<Transaction[]>(monthKey);
      if (previousMonthTx) {
        const index = previousMonthTx.findIndex((t) => t.id === newTx.id);
        const next = index >= 0
          ? previousMonthTx.map((t) => (t.id === newTx.id ? newTx : t))
          : [newTx, ...previousMonthTx].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
        client.setQueryData<Transaction[]>(monthKey, next);
      }
      return { previousMonthTx, monthKey };
    },
    onError: (_err, _newTx, context) => {
      if (context?.previousMonthTx && context?.monthKey) {
        client.setQueryData(context.monthKey, context.previousMonthTx);
      }
    },
    onSettled: (_data, _error, variables) => {
      const txMonth = variables.date.slice(0, 7);
      return Promise.all([
        client.invalidateQueries({ queryKey: [...queryKeys.transactions, txMonth] }),
        client.invalidateQueries({ queryKey: queryKeys.transactionCount }),
        client.invalidateQueries({ queryKey: queryKeys.wallets }),
        client.invalidateQueries({ queryKey: queryKeys.invoices }),
      ]);
    },
  });
}

export function useDeleteTransaction() {
  const { repo } = useStorage();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.deleteTransaction(id),
    onMutate: async (id: string) => {
      const queries = client.getQueryCache().findAll({ queryKey: queryKeys.transactions });
      const rollbacks: Array<{ key: readonly unknown[]; data: Transaction[] | undefined }> = [];
      for (const query of queries) {
        if (Array.isArray(query.state.data)) {
          const data = query.state.data as Transaction[];
          if (data.some((t) => t.id === id)) {
            rollbacks.push({ key: query.queryKey, data });
            client.setQueryData<Transaction[]>(
              query.queryKey,
              data.filter((t) => t.id !== id)
            );
          }
        }
      }
      return { rollbacks };
    },
    onError: (_err, _id, context) => {
      if (context?.rollbacks) {
        for (const rb of context.rollbacks) {
          client.setQueryData(rb.key, rb.data);
        }
      }
    },
    onSettled: () => Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.transactions }),
      client.invalidateQueries({ queryKey: queryKeys.transactionCount }),
      client.invalidateQueries({ queryKey: queryKeys.wallets }),
      client.invalidateQueries({ queryKey: queryKeys.attachments }),
      client.invalidateQueries({ queryKey: queryKeys.invoices }),
    ]),
  });
}

export function useSaveSubscription() {
  const { repo } = useStorage();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (value: Subscription) => repo.saveSubscription(value),
    onSuccess: () => Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.subscriptions }),
      client.invalidateQueries({ queryKey: queryKeys.wallets }),
    ]),
  });
}

export function useDeleteSubscription() {
  const { repo } = useStorage();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.deleteSubscription(id),
    onSuccess: () => Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.subscriptions }),
      client.invalidateQueries({ queryKey: queryKeys.transactions }),
      client.invalidateQueries({ queryKey: queryKeys.transactionCount }),
      client.invalidateQueries({ queryKey: queryKeys.wallets }),
    ]),
  });
}

export function useDeleteInvoice() {
  const { repo } = useStorage();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.deleteInvoice(id),
    onSuccess: () => Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.invoices }),
      client.invalidateQueries({ queryKey: queryKeys.transactions }),
      client.invalidateQueries({ queryKey: queryKeys.transactionCount }),
      client.invalidateQueries({ queryKey: queryKeys.wallets }),
    ]),
  });
}

export function useConfirmSubscriptionPayment() {
  const { repo } = useStorage();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payment: Transaction) => repo.confirmSubscriptionPayment(payment),
    onSuccess: () => Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.subscriptions }),
      client.invalidateQueries({ queryKey: queryKeys.transactions }),
      client.invalidateQueries({ queryKey: queryKeys.transactionCount }),
      client.invalidateQueries({ queryKey: queryKeys.wallets }),
    ]),
  });
}

export function useSaveInvoice() {
  const { repo } = useStorage();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ invoice, items }: { invoice: Invoice; items: InvoiceItem[] }) => repo.saveInvoiceWithItems(invoice, items),
    onSuccess: () => Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.invoices }),
      client.invalidateQueries({ queryKey: queryKeys.transactions }),
      client.invalidateQueries({ queryKey: queryKeys.transactionCount }),
      client.invalidateQueries({ queryKey: queryKeys.wallets }),
    ]),
  });
}

export function useReconcileCommand() {
  const { repo } = useStorage();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (today: string) => repo.reconcile(today),
    onSuccess: (result) => {
      const hasTxChanges = result.transactions.length > 0;
      const hasSubChanges = result.subscriptions.length > 0;
      const hasInvChanges = result.invoices.length > 0;
      const hasNotifChanges = result.notifications.length > 0;
      const promises: Promise<unknown>[] = [];

      if (hasTxChanges) {
        promises.push(
          client.invalidateQueries({ queryKey: queryKeys.transactions }),
          client.invalidateQueries({ queryKey: queryKeys.wallets }),
          client.invalidateQueries({ queryKey: queryKeys.transactionCount })
        );
      }
      if (hasSubChanges) {
        promises.push(client.invalidateQueries({ queryKey: queryKeys.subscriptions }));
      }
      if (hasInvChanges) {
        promises.push(client.invalidateQueries({ queryKey: queryKeys.invoices }));
      }
      if (hasNotifChanges) {
        promises.push(client.invalidateQueries({ queryKey: queryKeys.notifications }));
      }

      if (promises.length > 0) {
        return Promise.all(promises);
      }
    },
  });
}

export function useRecordInvoicePayment() {
  const { repo } = useStorage();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, payment }: { invoiceId: string; payment: Transaction }) => repo.recordInvoicePayment(invoiceId, payment),
    onSuccess: () => Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.transactions }),
      client.invalidateQueries({ queryKey: queryKeys.transactionCount }),
      client.invalidateQueries({ queryKey: queryKeys.invoices }),
      client.invalidateQueries({ queryKey: queryKeys.wallets }),
    ]),
  });
}

export function useMarkNotificationRead() {
  const { repo } = useStorage();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.markNotificationRead(id),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}

export function useDeleteNotification() {
  const { repo } = useStorage();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.deleteNotification(id),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}

export function useClearNotifications() {
  const { repo } = useStorage();
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => repo.clearNotifications(),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}

export function useSaveNotification() {
  const { repo } = useStorage();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (value: AppNotification) => repo.saveNotification(value),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}
