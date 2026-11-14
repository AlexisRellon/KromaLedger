# Web & Dexie Persistence Adapters

## Overview
Provides the browser IndexedDB persistence layer via Dexie (`KabanDB` / `KromaLedgerDB`), domain repository (`DexieStorageRepo`), attachment file store (`DexieFileStore`), LRU Object URL cache (`attachmentCache`), WebP image optimizer, React Query cache persistence, and `WebBootstrap` app initializer.

## Interface
- `interface AttachmentFileRecord`, `class KabanDB extends Dexie`, `KromaLedgerDB`: [db.ts:KabanDB] — Dexie database schema (v1–v5) managing 11 tables (`transactions`, `subscriptions`, `invoices`, `invoiceItems`, `categories`, `attachments`, `attachmentFiles`, `appMeta`, `wallets`, `profiles`, `notifications`).
- `class DexieFileStore implements IFileStore`: [DexieFileStore.ts:DexieFileStore] — Implements `save`, `saveAttachment`, `load`, `delete`, and `optimizeExistingAttachments` backed by Dexie `attachments` and `attachmentFiles`.
- `class DexieStorageRepo implements IStorageRepo`: [DexieStorageRepo.ts:DexieStorageRepo] — Implements `IStorageRepo` (39 methods), atomic wallet balance updates, ledger command execution, reconciliation, and demo/factory reset flows.
- `WebBootstrap({ children }: { children: ReactNode })`: [WebBootstrap.tsx:WebBootstrap] — Initializes singleton DB/repo/file/query services, restores query cache, runs initialization/reconciliation, and renders `StorageProvider`, `QueryClientProvider`, and `ForegroundReconcile`.
- `class AttachmentCacheManager`, `attachmentCache`: [attachmentCache.ts:AttachmentCacheManager] — O(1) `Map`-based LRU cache (`maxSize = 20`) for attachment `blob:` Object URLs (`get`, `set`, `getOrLoad`, `evict`, `clear`, `size`).
- `WEBP_MAX_BYTES` (`102400`), `WEBP_MAX_SIZE_MB` (`0.1`), `WEBP_MAX_DIMENSION` (`1280`), `WEBP_QUALITY` (`0.75`), `normalizeFilenameToWebp`, `ImageCompressorFn`, `setCustomImageCompressor`, `optimizeImageToWebp`, `migrateAttachmentsToWebp`: [imageOptimizer.ts:optimizeImageToWebp] — Compresses non-PDF image attachments to WebP <= 100 KB and migrates stored blobs.
- `restoreQueryCache(queryClient: QueryClient): boolean`, `setupQueryCachePersistence(queryClient: QueryClient): () => void`: [queryCachePersistence.ts:restoreQueryCache] — Hydrates and debounces (300ms) React Query cache snapshots to Web Storage.

## Invariants
- `DexieFileStore` validates safe attachment IDs (`/^[A-Za-z0-9_-]+$/`), allowed MIME types, exact byte size match with metadata, and parent transaction/invoice existence inside a Dexie `rw` transaction before saving [DexieFileStore.ts:DexieFileStore].
- `DexieStorageRepo` maintains atomic wallet balance deltas on transaction save/delete/command, enforces `CASH` -> `E_WALLET` same-currency positive non-negative balances on cash-in, maintains at most one `isDefault` wallet on `saveWallet`, sets `seedVersion: 999` on `clearAllData`, and executes `reconcile` inside a `rw` Dexie transaction [DexieStorageRepo.ts:DexieStorageRepo].
- `AttachmentCacheManager` revokes superseded or evicted `blob:` URLs via `URL.revokeObjectURL` whenever entries are overwritten, evicted beyond `maxSize`, or cleared [attachmentCache.ts:AttachmentCacheManager].
- `optimizeImageToWebp` leaves `application/pdf` untouched, passes through already compliant `image/webp` files `<= 102400` bytes, and delegates larger images to `browser-image-compression` (or a custom compressor) in the DOM [imageOptimizer.ts:optimizeImageToWebp].

## Side Effects
- Opens and mutates IndexedDB (`"KromaLedgerDB"`) across 11 object stores [db.ts:KabanDB], [DexieStorageRepo.ts:DexieStorageRepo], [DexieFileStore.ts:DexieFileStore].
- Calls `URL.createObjectURL` / `URL.revokeObjectURL` [attachmentCache.ts:AttachmentCacheManager] and loads `browser-image-compression` on browser canvas/DOM [imageOptimizer.ts:optimizeImageToWebp].
- Reads/writes `sessionStorage` and `localStorage` (`kaban_query_cache_v1`, `kaban_booted`, legacy `kromaledger_*`), requests `navigator.storage.persist()`, and attaches a `document` `visibilitychange` listener for foreground reconciliation [queryCachePersistence.ts:setupQueryCachePersistence], [WebBootstrap.tsx:WebBootstrap].

## Verification
- Run: `npm test`