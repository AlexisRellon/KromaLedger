import type { AttachmentMimeType } from "../../core/models";
import { attachmentCache } from "./attachmentCache";
import type { KromaLedgerDB } from "./db";

export const WEBP_MAX_BYTES = 100 * 1024; // 100 KB
export const WEBP_MAX_SIZE_MB = 0.1;
export const WEBP_MAX_DIMENSION = 1280;
export const WEBP_QUALITY = 0.75;

export function normalizeFilenameToWebp(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  const baseName = dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
  return `${baseName}.webp`;
}

export type ImageCompressorFn = (
  bytes: Uint8Array,
  filename: string,
  mimeType: AttachmentMimeType
) => Promise<Uint8Array>;

let customCompressor: ImageCompressorFn | null = null;

export function setCustomImageCompressor(fn: ImageCompressorFn | null): void {
  customCompressor = fn;
}

export async function optimizeImageToWebp(
  bytes: Uint8Array,
  filename: string,
  mimeType: AttachmentMimeType
): Promise<{ bytes: Uint8Array; filename: string; mimeType: AttachmentMimeType; size: number }> {
  if (mimeType === "application/pdf") {
    return { bytes, filename, mimeType, size: bytes.byteLength };
  }

  if (
    mimeType === "image/webp" &&
    bytes.byteLength <= WEBP_MAX_BYTES &&
    filename.toLowerCase().endsWith(".webp")
  ) {
    return { bytes, filename, mimeType: "image/webp", size: bytes.byteLength };
  }

  const webpFilename = normalizeFilenameToWebp(filename);
  let outBytes: Uint8Array = bytes;

  if (customCompressor) {
    outBytes = await customCompressor(bytes, filename, mimeType);
  } else if (typeof document !== "undefined" && typeof HTMLCanvasElement !== "undefined") {
    try {
      const { default: imageCompression } = await import("browser-image-compression");
      const inBuffer = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength
      ) as ArrayBuffer;
      const file = new File([inBuffer], filename, { type: mimeType });
      const compressed = await imageCompression(file, {
        maxSizeMB: WEBP_MAX_SIZE_MB,
        maxWidthOrHeight: WEBP_MAX_DIMENSION,
        initialQuality: WEBP_QUALITY,
        useWebWorker: false,
        fileType: "image/webp",
      });
      outBytes = new Uint8Array(await compressed.arrayBuffer());
    } catch {
      outBytes = bytes;
    }
  } else {
    outBytes = bytes;
  }

  return {
    bytes: outBytes,
    filename: webpFilename,
    mimeType: "image/webp",
    size: outBytes.byteLength,
  };
}

export async function migrateAttachmentsToWebp(db: KromaLedgerDB): Promise<number> {
  const attachments = await db.attachments.toArray();
  let migratedCount = 0;

  for (const meta of attachments) {
    const mimeTypeLower = meta.mimeType.toLowerCase();
    const isImage = mimeTypeLower.startsWith("image/");
    const needsMigration =
      isImage &&
      (mimeTypeLower !== "image/webp" ||
        !meta.filename.toLowerCase().endsWith(".webp") ||
        meta.size > WEBP_MAX_BYTES);

    if (!needsMigration) {
      continue;
    }

    const fileRecord = await db.attachmentFiles.get(meta.id);
    if (!fileRecord) {
      continue;
    }

    const rawBytes = new Uint8Array(await fileRecord.blob.arrayBuffer());
    const optimized = await optimizeImageToWebp(
      rawBytes,
      meta.filename,
      meta.mimeType as AttachmentMimeType
    );

    const buffer = optimized.bytes.buffer.slice(
      optimized.bytes.byteOffset,
      optimized.bytes.byteOffset + optimized.bytes.byteLength
    ) as ArrayBuffer;
    const blob = new Blob([buffer], { type: "image/webp" });

    await db.transaction("rw", db.attachments, db.attachmentFiles, async () => {
      await db.attachments.put({
        ...meta,
        filename: optimized.filename,
        mimeType: "image/webp",
        size: optimized.size,
      });
      await db.attachmentFiles.put({
        id: meta.id,
        mimeType: "image/webp",
        size: optimized.size,
        blob,
      });
    });

    attachmentCache.evict(meta.id);
    migratedCount++;
  }

  return migratedCount;
}
