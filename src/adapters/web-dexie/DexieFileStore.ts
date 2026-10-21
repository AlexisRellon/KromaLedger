import { attachmentMetaSchema, attachmentMimeTypeSchema } from "../../core/models";
import type { IFileStore } from "../../core/ports/IFileStore";
import { KromaLedgerDB } from "./db";

const safeId = /^[A-Za-z0-9_-]+$/;

export class DexieFileStore implements IFileStore {
  constructor(private readonly db = new KromaLedgerDB()) {}

  async save(id: string, data: Uint8Array, mimeType: string): Promise<void> {
    if (!safeId.test(id)) throw new RangeError("Attachment id contains unsafe path characters");
    if (!attachmentMimeTypeSchema.safeParse(mimeType).success) throw new RangeError("Unsupported or disallowed attachment MIME type");
    const blob = new Blob([new Uint8Array(data).buffer], { type: mimeType });
    await this.db.attachmentFiles.put({ id, mimeType, size: blob.size, blob });
  }

  async saveAttachment(value: Parameters<IFileStore["saveAttachment"]>[0], data: Uint8Array): Promise<Parameters<IFileStore["saveAttachment"]>[0]> {
    let meta = attachmentMetaSchema.parse(value);
    if (!safeId.test(meta.id) || data.byteLength !== meta.size) throw new RangeError("Attachment metadata does not match its bytes");
    let bytes = data;
    if (meta.mimeType.startsWith("image/") && meta.mimeType !== "image/webp") {
      const { default: imageCompression } = await import("browser-image-compression");
      const file = new File([new Uint8Array(data).buffer], meta.filename, { type: meta.mimeType });
      const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1920, useWebWorker: false, fileType: "image/webp" });
      bytes = new Uint8Array(await compressed.arrayBuffer());
      const baseName = meta.filename.lastIndexOf(".") > 0 ? meta.filename.slice(0, meta.filename.lastIndexOf(".")) : meta.filename;
      meta = attachmentMetaSchema.parse({ ...meta, filename: `${baseName}.webp`, mimeType: "image/webp", size: compressed.size });
    }
    const blob = new Blob([new Uint8Array(bytes).buffer], { type: meta.mimeType });
    await this.db.transaction("rw", this.db.attachments, this.db.attachmentFiles, this.db.transactions, this.db.invoices, async () => {
      const parentExists = meta.entityType === "TRANSACTION"
        ? await this.db.transactions.get(meta.entityId)
        : await this.db.invoices.get(meta.entityId);
      if (!parentExists) throw new RangeError("Attachment parent does not exist");
      await this.db.attachments.put(meta);
      await this.db.attachmentFiles.put({ id: meta.id, mimeType: meta.mimeType, size: blob.size, blob });
    });
    return meta;
  }

  async load(id: string): Promise<Uint8Array | undefined> {
    const record = await this.db.attachmentFiles.get(id);
    return record ? new Uint8Array(await record.blob.arrayBuffer()) : undefined;
  }

  async delete(id: string): Promise<void> {
    await this.db.transaction("rw", this.db.attachments, this.db.attachmentFiles, async () => {
      await this.db.attachments.delete(id);
      await this.db.attachmentFiles.delete(id);
    });
  }
}
