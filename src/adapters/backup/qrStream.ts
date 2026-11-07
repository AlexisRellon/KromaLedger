/**
 * Animated QR Code Air-Sync Framing Protocol (KB1)
 *
 * Implements chunked, gzip-compressed, checksummed frame encoding and reassembly
 * for zero-network air-gapped device-to-device database sync via rapid QR camera scanning.
 * Zero external runtime dependencies: relies exclusively on Web Standard Compression Streams,
 * TextEncoder / TextDecoder, and standard IEEE 802.3 CRC32.
 */

export const QR_PROTOCOL_PREFIX = "KB1";
export const DEFAULT_QR_CHUNK_BYTES = 400; // fits comfortably in QR Version 7-8 for rapid camera scanning

export interface QrFramePacket {
  protocol: "KB1";
  sessionId: string;
  index: number;
  total: number;
  crc32: string;
  dataBase64: string;
}

export interface QrStreamBatch {
  sessionId: string;
  totalFrames: number;
  crc32: string;
  compressedBytes: number;
  uncompressedBytes: number;
  frames: string[];
}

export interface QrAssemblerProgress {
  sessionId: string | null;
  totalFrames: number;
  receivedCount: number;
  receivedIndices: number[];
  missingIndices: number[];
  progressRatio: number;
  complete: boolean;
  crc32: string | null;
}

export interface QrStreamAssemblerOptions {
  autoSwitchSession?: boolean;
}

interface NodeBufferLike {
  from(data: ArrayBuffer, offset: number, length: number): { toString(enc: string): string };
  from(data: string, enc: string): Uint8Array;
}

function getNodeBuffer(): NodeBufferLike | undefined {
  const globalRef = globalThis as unknown as { Buffer?: NodeBufferLike };
  return globalRef.Buffer;
}

// CRC32 lookup table initialization (IEEE 802.3 standard polynomial 0xEDB88320)
const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC32_TABLE[i] = c >>> 0;
}

/**
 * Standard IEEE 802.3 CRC32 checksum returning an 8-character lowercase hex string.
 */
export function computeCrc32(bytes: Uint8Array): string {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i] ?? 0;
    const tableVal = CRC32_TABLE[(crc ^ byte) & 0xff] ?? 0;
    crc = tableVal ^ (crc >>> 8);
  }
  return ((crc ^ 0xffffffff) >>> 0).toString(16).padStart(8, "0");
}

/**
 * Encodes arbitrary binary Uint8Array into a standard Base64 string in both browser and Node.
 */
export function bytesToBase64(bytes: Uint8Array): string {
  if (bytes.byteLength === 0) return "";
  const nodeBuffer = getNodeBuffer();
  if (nodeBuffer) {
    return nodeBuffer.from(bytes.buffer as ArrayBuffer, bytes.byteOffset, bytes.byteLength).toString("base64");
  }
  let binary = "";
  const len = bytes.byteLength;
  const CHUNK_SIZE = 0x8000;
  for (let i = 0; i < len; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, len));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Decodes a Base64 string into a Uint8Array in both browser and Node.
 */
export function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.trim();
  if (clean.length === 0) return new Uint8Array(0);
  if (clean.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(clean)) {
    throw new TypeError("Invalid base64 payload");
  }
  const nodeBuffer = getNodeBuffer();
  if (nodeBuffer) {
    const buf = nodeBuffer.from(clean, "base64");
    return new Uint8Array(buf);
  }
  const binary = atob(clean);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Helper to drain all chunks from a ReadableStream<Uint8Array>.
 */
async function readAllStreamChunks(readable: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = readable.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        totalLength += value.byteLength;
      }
    }
  } finally {
    reader.releaseLock();
  }
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

/**
 * Compresses UTF-8 text using the Web Standard CompressionStream("gzip").
 */
export async function compressStringGzip(text: string): Promise<Uint8Array> {
  const bytes = new TextEncoder().encode(text);
  const cs = new CompressionStream("gzip");
  const writer = cs.writable.getWriter();
  const writePromise = writer.write(bytes as unknown as BufferSource).then(() => writer.close());
  const [_, compressed] = await Promise.all([
    writePromise,
    readAllStreamChunks(cs.readable),
  ]);
  return compressed;
}

/**
 * Decompresses gzip-compressed bytes using the Web Standard DecompressionStream("gzip") and decodes UTF-8 string.
 */
export async function decompressStringGzip(compressed: Uint8Array): Promise<string> {
  const ds = new DecompressionStream("gzip");
  const writer = ds.writable.getWriter();
  const writePromise = writer.write(compressed as unknown as BufferSource).then(() => writer.close());
  const [_, decompressed] = await Promise.all([
    writePromise,
    readAllStreamChunks(ds.readable),
  ]);
  return new TextDecoder().decode(decompressed as unknown as BufferSource);
}

/**
 * Generates an 8-character hex/alphanumeric session ID.
 */
function generateSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return Math.random().toString(36).slice(2, 10).padEnd(8, "0");
}

/**
 * Encodes payload into animated QR frames (KB1 framing protocol).
 */
export async function encodePayloadToQrFrames(
  jsonText: string,
  options?: { chunkSize?: number; sessionId?: string }
): Promise<QrStreamBatch> {
  let chunkSize = options?.chunkSize ?? DEFAULT_QR_CHUNK_BYTES;
  if (typeof chunkSize !== "number" || Number.isNaN(chunkSize)) {
    chunkSize = DEFAULT_QR_CHUNK_BYTES;
  }
  chunkSize = Math.floor(chunkSize);
  if (chunkSize < 64) chunkSize = 64;
  if (chunkSize > 1200) chunkSize = 1200;

  let sessionId = options?.sessionId;
  if (sessionId !== undefined) {
    if (!/^[A-Za-z0-9_-]{4,32}$/.test(sessionId)) {
      throw new RangeError("Invalid sessionId format (must be 4-32 alphanumeric, dash, or underscore characters)");
    }
  } else {
    sessionId = generateSessionId();
  }

  const uncompressedBytes = new TextEncoder().encode(jsonText).byteLength;
  const compressed = await compressStringGzip(jsonText);
  const crc32 = computeCrc32(compressed);

  const totalFrames = Math.max(1, Math.ceil(compressed.byteLength / chunkSize));
  const frames: string[] = [];

  for (let index = 0; index < totalFrames; index++) {
    const start = index * chunkSize;
    const end = Math.min(start + chunkSize, compressed.byteLength);
    const chunk = compressed.subarray(start, end);
    const dataBase64 = bytesToBase64(chunk);
    const frame = `${QR_PROTOCOL_PREFIX}|${sessionId}|${index}|${totalFrames}|${crc32}|${dataBase64}`;
    frames.push(frame);
  }

  return {
    sessionId,
    totalFrames,
    crc32,
    compressedBytes: compressed.byteLength,
    uncompressedBytes,
    frames,
  };
}

export { encodePayloadToQrFrames as encodeToQrFrames };

/**
 * Parses and validates an individual QR frame string against the KB1 protocol specification.
 * Returns null if the frame is invalid, malformed, or has an unrecognized prefix.
 */
export function parseQrFrame(raw: string): QrFramePacket | null {
  if (typeof raw !== "string") return null;
  const parts = raw.trim().split("|");
  if (parts.length !== 6) return null;

  const prefix = parts[0];
  const sessionId = parts[1];
  const indexStr = parts[2];
  const totalStr = parts[3];
  const crc32Raw = parts[4];
  const dataBase64 = parts[5];

  if (!prefix || !sessionId || !indexStr || !totalStr || !crc32Raw || !dataBase64) {
    return null;
  }

  if (prefix !== QR_PROTOCOL_PREFIX) return null;
  if (!/^[A-Za-z0-9_-]{4,32}$/.test(sessionId)) return null;

  if (!/^(0|[1-9]\d*)$/.test(indexStr)) return null;
  const index = Number(indexStr);

  if (!/^[1-9]\d*$/.test(totalStr)) return null;
  const total = Number(totalStr);

  if (!Number.isSafeInteger(index) || !Number.isSafeInteger(total)) return null;
  if (index < 0 || total < 1 || index >= total) return null;

  const crc32 = crc32Raw.toLowerCase();
  if (!/^[0-9a-f]{8}$/.test(crc32)) return null;

  if (dataBase64.length === 0 || dataBase64.length % 4 !== 0) return null;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(dataBase64)) return null;

  return {
    protocol: "KB1",
    sessionId,
    index,
    total,
    crc32,
    dataBase64,
  };
}

/**
 * Stateful assembler for reassembling chunked animated QR code streams.
 * Supports frames received out-of-order, duplicates, cyclic carousel loops,
 * and data integrity validation via CRC32.
 */
export class QrStreamAssembler {
  private autoSwitchSession: boolean;
  private sessionId: string | null = null;
  private totalFrames: number = 0;
  private crc32: string | null = null;
  private chunks: Map<number, Uint8Array> = new Map();

  constructor(options?: QrStreamAssemblerOptions) {
    this.autoSwitchSession = options?.autoSwitchSession ?? false;
  }

  feedFrame(raw: string): {
    accepted: boolean;
    isNewFrame: boolean;
    progress: QrAssemblerProgress;
    error?: string;
  } {
    const packet = parseQrFrame(raw);
    if (!packet) {
      return {
        accepted: false,
        isNewFrame: false,
        progress: this.getProgress(),
        error: "Unrecognized QR format",
      };
    }

    if (this.sessionId !== null && packet.sessionId !== this.sessionId) {
      if (this.autoSwitchSession) {
        this.reset();
      } else {
        return {
          accepted: false,
          isNewFrame: false,
          progress: this.getProgress(),
          error: "Frame belongs to a different transfer session",
        };
      }
    }

    if (this.sessionId === null) {
      this.sessionId = packet.sessionId;
      this.totalFrames = packet.total;
      this.crc32 = packet.crc32;
      this.chunks.clear();
    } else {
      if (packet.total !== this.totalFrames || packet.crc32 !== this.crc32) {
        return {
          accepted: false,
          isNewFrame: false,
          progress: this.getProgress(),
          error: "Frame metadata does not match active session",
        };
      }
    }

    let chunkBytes: Uint8Array;
    try {
      chunkBytes = base64ToBytes(packet.dataBase64);
    } catch {
      return {
        accepted: false,
        isNewFrame: false,
        progress: this.getProgress(),
        error: "Invalid base64 payload",
      };
    }

    const isNewFrame = !this.chunks.has(packet.index);
    if (isNewFrame) {
      this.chunks.set(packet.index, chunkBytes);
    }

    return {
      accepted: true,
      isNewFrame,
      progress: this.getProgress(),
    };
  }

  getProgress(): QrAssemblerProgress {
    if (!this.sessionId || this.totalFrames === 0) {
      return {
        sessionId: null,
        totalFrames: 0,
        receivedCount: 0,
        receivedIndices: [],
        missingIndices: [],
        progressRatio: 0,
        complete: false,
        crc32: null,
      };
    }

    const receivedIndices: number[] = [];
    const missingIndices: number[] = [];
    for (let i = 0; i < this.totalFrames; i++) {
      if (this.chunks.has(i)) {
        receivedIndices.push(i);
      } else {
        missingIndices.push(i);
      }
    }

    const receivedCount = receivedIndices.length;
    const complete = receivedCount === this.totalFrames;
    const progressRatio = this.totalFrames > 0 ? receivedCount / this.totalFrames : 0;

    return {
      sessionId: this.sessionId,
      totalFrames: this.totalFrames,
      receivedCount,
      receivedIndices,
      missingIndices,
      progressRatio,
      complete,
      crc32: this.crc32,
    };
  }

  reset(): void {
    this.sessionId = null;
    this.totalFrames = 0;
    this.crc32 = null;
    this.chunks.clear();
  }

  async reassembleAndDecompress(): Promise<string> {
    if (!this.sessionId || this.totalFrames === 0) {
      throw new RangeError("No active transfer session to reassemble");
    }

    if (this.chunks.size < this.totalFrames) {
      const missing: number[] = [];
      for (let i = 0; i < this.totalFrames; i++) {
        if (!this.chunks.has(i)) {
          missing.push(i);
        }
      }
      throw new RangeError(`Cannot reassemble incomplete stream; missing frame(s): ${missing.join(", ")}`);
    }

    let totalBytes = 0;
    for (let i = 0; i < this.totalFrames; i++) {
      const chunk = this.chunks.get(i);
      if (!chunk) {
        throw new RangeError(`Cannot reassemble stream: missing frame index ${i}`);
      }
      totalBytes += chunk.byteLength;
    }

    const combined = new Uint8Array(totalBytes);
    let offset = 0;
    for (let i = 0; i < this.totalFrames; i++) {
      const chunk = this.chunks.get(i)!;
      combined.set(chunk, offset);
      offset += chunk.byteLength;
    }

    const computedCrc = computeCrc32(combined);
    if (computedCrc.toLowerCase() !== this.crc32?.toLowerCase()) {
      throw new RangeError("QR stream checksum mismatch; data is corrupted");
    }

    return await decompressStringGzip(combined);
  }
}
