import type { AttachmentMeta } from "../models";

export interface IFileStore {
  save(id: string, data: Uint8Array, mimeType: string): Promise<void>;
  saveAttachment(meta: AttachmentMeta, data: Uint8Array): Promise<AttachmentMeta>;
  load(id: string): Promise<Uint8Array | undefined>;
  delete(id: string): Promise<void>;
  optimizeExistingAttachments?(): Promise<number>;
}
