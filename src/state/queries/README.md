# React Query Hooks

## Overview
Centralizes TanStack React Query `queryKeys`, read hooks, and optimistic/invalidating mutation hooks backed by `useStorage().repo` and `useStorage().files`.

## Interface
- `queryKeys`: [index.ts:queryKeys] — Canonical cache keys (`transactions`, `transactionMonth`, `transactionCount`, `subscriptions`, `invoices`, `categories`, `attachments`, `profile`, `wallets`, `notifications`).
- Read hooks: `useTransactions(month)`, `useAllTransactions()`, `useTransactionCount()`, `useSubscriptions()`, `useInvoices()`, `useCategories()`, `useAttachments()`, `useProfile()`, `useWallets()`, `useNotifications()`: [index.ts:useTransactions] — Query hooks wrapping `IStorageRepo` read operations.
- Write & command mutation hooks: `useSaveCategory`, `useSaveProfile`, `useSaveWallet`, `useDeleteWallet`, `useClearAllData`, `useResetToDemo`, `useSaveAttachment`, `useSaveTransaction`, `useDeleteTransaction`, `useSaveSubscription`, `useDeleteSubscription`, `useDeleteInvoice`, `useConfirmSubscriptionPayment`, `useSaveInvoice`, `useReconcileCommand`, `useRecordInvoicePayment`, `useMarkNotificationRead`, `useDeleteNotification`, `useClearNotifications`, `useSaveNotification`: [index.ts:useSaveTransaction] — Mutations executing repo/file commands and invalidating affected queries.

## Invariants
- `useSaveTransaction` and `useDeleteTransaction` perform optimistic updates on `transactionMonth`, `transactions`, and `transactionCount` caches, rolling back to prior snapshots on error and invalidating transactions, wallets, attachments, and invoices on settlement [index.ts:useSaveTransaction], [index.ts:useDeleteTransaction].
- Destructive global mutations (`useClearAllData`, `useResetToDemo`) invalidate the entire `queryClient` cache on success [index.ts:useClearAllData], [index.ts:useResetToDemo].

## Side Effects
- Reads and mutates TanStack `QueryClient` cache and invokes async `IStorageRepo` / `IFileStore` persistence operations [index.ts:useSaveTransaction], [index.ts:useSaveAttachment].

## Verification
- Run: `npm test`