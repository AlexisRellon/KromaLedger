# Backup Adapters

## Overview
Provides offline vault backup and cross-device Air-Sync transport via animated gzip+CRC32 QR frame streams (`qrStream.ts`) and validated ZIP vault archives (`zipVault.ts`).

## Interface
- `QR_PROTOCOL_PREFIX` (`"KB1"`), `DEFAULT_QR_CHUNK_BYTES` (`400`): [qrStream.ts:QR_PROTOCOL_PREFIX] — Air-Sync frame protocol constants.
- `QrFramePacket`, `QrStreamBatch`, `QrAssemblerProgress`, `QrStreamAssemblerOptions`: [qrStream.ts:QrStreamBatch] — Typed QR framing and reassembly structures.
- `computeCrc32(bytes: Uint8Array): string`, `bytesToBase64(bytes: Uint8Array): string`, `base64ToBytes(base64: string): Uint8Array`: [qrStream.ts:computeCrc32] — IEEE 802.3 CRC32 checksum and Base64 codecs.
- `compressStringGzip(text: string): Promise<Uint8Array>`, `decompressStringGzip(bytes: Uint8Array): Promise<string>`: [qrStream.ts:compressStringGzip] — Web Streams gzip compression and decompression.
- `encodePayloadToQrFrames(payload: string, options?: { chunkSize?: number; sessionId?: string }): Promise<QrStreamBatch>` (alias `encodeToQrFrames`): [qrStream.ts:encodePayloadToQrFrames] — Gzips a payload and chunks it into `KB1|...` QR frame strings.
- `parseQrFrame(rawFrame: string): QrFramePacket | null`: [qrStream.ts:parseQrFrame] — Parses and validates a single `KB1` QR frame packet.
- `class QrStreamAssembler`: [qrStream.ts:QrStreamAssembler] — Stateful receiver supporting `feedFrame`, `getProgress`, `reset`, and `reassembleAndDecompress`.
- `MAX_VAULT_BYTES` (`200 * 1024 * 1024`), `MAX_ATTACHMENT_COUNT` (`1000`): [zipVault.ts:MAX_VAULT_BYTES] — Archive safety limits.
- `SyncAttachmentPayload`, `SyncDumpPayload`, `SyncRestoreOptions`, `SyncRestoreSummary`, `syncAttachmentPayloadSchema`, `syncDumpSchema`: [zipVault.ts:syncDumpSchema] — Zod schemas and types for Air-Sync JSON snapshots.
- `exportVault(db: KabanDB, exportedAt: string): Promise<{ filename: string; data: Uint8Array }>`: [zipVault.ts:exportVault] — Exports all 11 Dexie tables and attachment blobs into a ZIP archive.
- `restoreVault(db: KabanDB, archiveBytes: Uint8Array): Promise<void>`: [zipVault.ts:restoreVault] — Validates ZIP structure, CRC32 checksums, and referential integrity, then replaces local database contents.
- `exportSyncDump(db: KabanDB, exportedAt: string, options?: { includeAttachments?: boolean }): Promise<SyncDumpPayload>`: [zipVault.ts:exportSyncDump] — Exports a normalized `SyncDumpPayload` from Dexie.
- `exportSyncFrames(db: KabanDB, exportedAt: string, options?: { includeAttachments?: boolean; chunkSize?: number }): Promise<{ batch: QrStreamBatch; dump: SyncDumpPayload }>`: [zipVault.ts:exportSyncFrames] — Serializes a sync dump and encodes it into QR frames.
- `parseSyncPayload(jsonText: string): Promise<SyncDumpPayload>`: [zipVault.ts:parseSyncPayload] — Parses and strictly validates an incoming Air-Sync JSON payload.
- `restoreSyncPayload(db: KabanDB, dump: SyncDumpPayload, options?: SyncRestoreOptions): Promise<SyncRestoreSummary>`: [zipVault.ts:restoreSyncPayload] — Applies an Air-Sync payload in `"MERGE"` or `"OVERWRITE"` mode with optional WebP image optimization.

## Invariants
- QR frames strictly match `KB1|<sessionId>|<index>|<total>|<crc32>|<dataBase64>`, clamp `chunkSize` to `[64, 1200]`, require `sessionId` matching `/^[A-Za-z0-9_-]{4,32}$/`, and verify IEEE 802.3 CRC32 (`0xEDB88320`) before gunzip [qrStream.ts:encodePayloadToQrFrames], [qrStream.ts:QrStreamAssembler].
- `QrStreamAssembler` rejects mismatched `sessionId`, `totalFrames`, or `crc32` frames unless `autoSwitchSession` is enabled, and requires all indices `0..totalFrames-1` before `reassembleAndDecompress` succeeds [qrStream.ts:QrStreamAssembler].
- Vault ZIP and Air-Sync restores enforce `formatVersion: 1`, valid `dateOnlySchema` `exportedAt`, exact ZIP file allowlist (`db-dump.json` + `attachments/<id>`), max 1000 attachments / 200 MB payload, unique record IDs across tables, exact invoice total arithmetic and `itemIds` parity, zero dangling references, and matching attachment byte lengths [zipVault.ts:restoreVault], [zipVault.ts:parseSyncPayload], [zipVault.ts:restoreSyncPayload].
- During `"MERGE"` sync restore, incoming transactions referencing missing invoices or subscriptions in the combined set are filtered out [zipVault.ts:restoreSyncPayload].

## Side Effects
- Uses Web `CompressionStream("gzip")`, `DecompressionStream("gzip")`, and `crypto.getRandomValues` (with `Math.random` fallback) [qrStream.ts:compressStringGzip], [qrStream.ts:encodePayloadToQrFrames].
- Dynamically imports `jszip`, runs `optimizeImageToWebp` on restored image attachments, and reads/clears/bulk-puts all 11 Dexie IndexedDB tables inside transactions [zipVault.ts:exportVault], [zipVault.ts:restoreVault], [zipVault.ts:restoreSyncPayload].

## Verification
- Run: `npm test`