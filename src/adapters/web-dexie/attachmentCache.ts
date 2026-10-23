/**
 * Attachment Object URL LRU Cache
 * Keeps bounded in-memory Object URLs for receipt and invoice attachments,
 * avoiding repeated IndexedDB binary deserialization while ensuring zero memory leaks.
 * Uses Map insertion-order for exact O(1) LRU eviction.
 */

export class AttachmentCacheManager {
  private readonly cache = new Map<string, string>();

  constructor(private readonly maxSize = 20) {}

  get(id: string): string | undefined {
    const url = this.cache.get(id);
    if (!url) return undefined;
    // Move to most recently used position
    this.cache.delete(id);
    this.cache.set(id, url);
    return url;
  }

  set(id: string, url: string): void {
    if (this.cache.has(id)) {
      const existing = this.cache.get(id)!;
      if (existing !== url) {
        URL.revokeObjectURL(existing);
      }
      this.cache.delete(id);
      this.cache.set(id, url);
      return;
    }

    if (this.cache.size >= this.maxSize) {
      this.evictLru();
    }

    this.cache.set(id, url);
  }

  async getOrLoad(
    id: string,
    mimeType: string,
    loader: () => Promise<Uint8Array | undefined>
  ): Promise<string | undefined> {
    const existing = this.get(id);
    if (existing) return existing;

    const bytes = await loader();
    if (!bytes) return undefined;

    const isImage = mimeType.startsWith("image/");
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const blob = new Blob([buffer], {
      type: isImage ? mimeType : "application/octet-stream",
    });
    const url = URL.createObjectURL(blob);
    this.set(id, url);
    return url;
  }

  evict(id: string): void {
    const url = this.cache.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      this.cache.delete(id);
    }
  }

  clear(): void {
    for (const url of this.cache.values()) {
      URL.revokeObjectURL(url);
    }
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private evictLru(): void {
    const oldestKey = this.cache.keys().next().value;
    if (oldestKey !== undefined) {
      this.evict(oldestKey);
    }
  }
}

export const attachmentCache = new AttachmentCacheManager(20);
