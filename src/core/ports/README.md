# Core Ports

## Overview
Defines dependency-inversion port interfaces (`IAIEngine`, `IFileStore`, `IStorageRepo`) implemented by `src/adapters` and consumed by `src/state` and `src/ui`.

## Interface
- `interface IAIEngine`: [IAIEngine.ts:IAIEngine] — Declares `askWeeklyBudget(request: AIAdvisorRequest): Promise<AIAdvisorResponse>` and `getRateLimitStatus(): Promise<RateLimitStatus>`.
- `interface IFileStore`: [IFileStore.ts:IFileStore] — Declares `save(file: File, meta: AttachmentMeta): Promise<void>`, `saveAttachment(meta: AttachmentMeta, data: Uint8Array): Promise<void>`, `load(id: string): Promise<Uint8Array | null>`, `delete(id: string): Promise<void>`, and optional `optimizeExistingAttachments(): Promise<number>`.
- `interface IStorageRepo`: [IStorageRepo.ts:IStorageRepo] — Declares 39 async methods (including optional `countTransactions?`) across transactions, reconciliation (`reconcile(currentDate: string): Promise<ReconcileResult>`), subscriptions, invoices/invoiceItems, categories, attachments, `appMeta`, profile, wallets, notifications, `clearAllData`, and `resetToDemo`.

## Invariants
- `IFileStore.saveAttachment` separates binary payload (`Uint8Array`) persistence from metadata (`AttachmentMeta`) [IFileStore.ts:IFileStore].
- `IStorageRepo` abstracts all persistence and transactional command operations behind async contracts returning core domain models and `ReconcileResult` [IStorageRepo.ts:IStorageRepo].

## Side Effects
- None

## Verification
- Run: `npm test`