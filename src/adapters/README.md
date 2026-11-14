# Adapters

## Overview
Platform-specific implementations of Kaban's core ports (`IStorageRepo`, `IFileStore`, `IAIEngine`) alongside browser backup and notification engines. Adapters depend on `../core` and browser/external APIs, keeping domain logic decoupled from IndexedDB, Web Storage, and HTTP transport.

## Subdirectories & Boundaries
- **[`./ai/README.md`](./ai/README.md)**: Netlify Gemma AI advisor HTTP client (`NetlifyGemmaAdapter`) and `localStorage` multi-thread chat history persistence (`loadAllThreads`, `saveAllThreads`, `createNewThread`, `deleteThreadFromStorage`, `renameThreadInStorage`, `clearAllChatThreads`).
- **[`./backup/README.md`](./backup/README.md)**: Cross-device QR Air-Sync protocol (`QR_PROTOCOL_PREFIX`, `encodePayloadToQrFrames`, `parseQrFrame`, `QrStreamAssembler`) and validated ZIP vault export/restore (`exportVault`, `restoreVault`, `exportSyncDump`, `exportSyncFrames`, `parseSyncPayload`, `restoreSyncPayload`).
- **[`./notifications/README.md`](./notifications/README.md)**: Browser Web Notifications permission and session-deduplicated alert dispatch (`isBrowserNotificationSupported`, `getBrowserNotificationPermission`, `requestBrowserNotificationPermission`, `dispatchBrowserNotification`, `syncBrowserNotifications`).
- **[`./web-dexie/README.md`](./web-dexie/README.md)**: IndexedDB/Dexie database (`KabanDB`), storage/file repositories (`DexieStorageRepo`, `DexieFileStore`), Object URL LRU cache (`attachmentCache`), WebP image optimizer (`optimizeImageToWebp`), React Query cache persistence (`restoreQueryCache`, `setupQueryCachePersistence`), and `WebBootstrap`.