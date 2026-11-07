import { createContext, useContext, type PropsWithChildren } from "react";
import type { IStorageRepo } from "../core/ports/IStorageRepo";
import type { IFileStore } from "../core/ports/IFileStore";
import type { QrStreamBatch } from "../adapters/backup/qrStream";
import type { SyncDumpPayload, SyncRestoreOptions, SyncRestoreSummary } from "../adapters/backup/zipVault";

export interface VaultService {
  export(today: string): Promise<{ filename: string; data: Uint8Array }>;
  restore(data: Uint8Array): Promise<void>;
  exportSyncFrames?(today: string, options?: { includeAttachments?: boolean; chunkSize?: number }): Promise<{ batch: QrStreamBatch; dump: SyncDumpPayload }>;
  parseSyncPayload?(jsonText: string): SyncDumpPayload | Promise<SyncDumpPayload>;
  restoreSyncPayload?(dumpOrJson: SyncDumpPayload | string, options: SyncRestoreOptions): Promise<SyncRestoreSummary>;
}
export interface StorageServices { repo: IStorageRepo; files: IFileStore; vault: VaultService; storageStatus(): Promise<{ persistent: boolean; usage: number | null; quota: number | null }> }
const StorageContext = createContext<StorageServices | null>(null);
export function StorageProvider({ value, children }: PropsWithChildren<{ value: StorageServices }>) { return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>; }
export function useStorage(): StorageServices {
  const value = useContext(StorageContext);
  if (!value) throw new Error("StorageProvider is missing");
  return value;
}
