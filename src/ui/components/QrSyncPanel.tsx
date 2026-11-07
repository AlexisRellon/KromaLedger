import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { useStorage } from "../../state/StorageContext";
import {
  QrStreamAssembler,
  type QrStreamBatch,
  type QrAssemblerProgress,
} from "../../adapters/backup/qrStream";
import { Button } from "../primitives";
import type {
  SyncDumpPayload,
  SyncRestoreSummary,
} from "../../adapters/backup/zipVault";
import type { VaultService } from "../../state/StorageContext";

const today = () => format(new Date(), "yyyy-MM-dd");

export function QrSyncPanel({ onClose }: { onClose?: () => void }) {
  const { vault } = useStorage();
  const extVault: VaultService = vault;

  // Sub-mode tab
  const [subMode, setSubMode] = useState<"send" | "receive">("send");

  // --- Sender Mode State ---
  const [includeAttachments, setIncludeAttachments] = useState(false);
  const [fps, setFps] = useState<number>(8); // 4 | 8 | 12
  const [chunkSize, setChunkSize] = useState<number>(400); // 250 | 400 | 650
  const [batch, setBatch] = useState<QrStreamBatch | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [senderError, setSenderError] = useState<string | null>(null);

  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- Receiver Mode State ---
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [scanning, setScanning] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [progress, setProgress] = useState<QrAssemblerProgress>({
    sessionId: null,
    totalFrames: 0,
    receivedCount: 0,
    receivedIndices: [],
    missingIndices: [],
    progressRatio: 0,
    complete: false,
    crc32: null,
  });
  const [reassembling, setReassembling] = useState(false);
  const [parsedDump, setParsedDump] = useState<SyncDumpPayload | null>(null);
  const [showManualPaste, setShowManualPaste] = useState(false);
  const [manualInput, setManualInput] = useState("");

  // Post-scan restore options
  const [restoreMode, setRestoreMode] = useState<"merge" | "overwrite">("merge");
  const [restoreRecords, setRestoreRecords] = useState(true);
  const [restoreWalletsAndProfile, setRestoreWalletsAndProfile] = useState(true);
  const [restoreAttachments, setRestoreAttachments] = useState(true);
  const [autoSafetyBackup, setAutoSafetyBackup] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState<SyncRestoreSummary | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const assemblerRef = useRef<QrStreamAssembler>(new QrStreamAssembler({ autoSwitchSession: true }));
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const parsedDumpRef = useRef<SyncDumpPayload | null>(null);
  const barcodeDetectorRef = useRef<any>(null);

  // ----------------------------------------------------
  // SENDER: Fetch frames on option changes
  // ----------------------------------------------------
  useEffect(() => {
    if (subMode !== "send") return;
    let active = true;
    setExporting(true);
    setSenderError(null);

    const runExport = async () => {
      try {
        if (typeof extVault.exportSyncFrames === "function") {
          const res = await extVault.exportSyncFrames(today(), {
            includeAttachments,
            chunkSize,
          });
          if (active) {
            setBatch(res.batch);
            setFrameIndex(0);
          }
        } else {
          if (active) {
            setSenderError("QR air-sync framing is not available on this vault.");
          }
        }
      } catch (err) {
        if (active) {
          setSenderError(err instanceof Error ? err.message : "Failed to generate QR sync frames.");
        }
      } finally {
        if (active) {
          setExporting(false);
        }
      }
    };

    void runExport();
    return () => {
      active = false;
    };
  }, [subMode, includeAttachments, chunkSize, extVault]);

  // ----------------------------------------------------
  // SENDER: Render active frame to QR canvas
  // ----------------------------------------------------
  useEffect(() => {
    if (subMode !== "send" || !batch || batch.frames.length === 0) return;
    const currentFrame = batch.frames[frameIndex] ?? batch.frames[0];
    if (!currentFrame || !qrCanvasRef.current) return;

    let active = true;
    void import("qrcode").then((QRCodeModule) => {
      if (!active || !qrCanvasRef.current) return;
      const toCanvas = QRCodeModule.toCanvas || (QRCodeModule as any).default?.toCanvas;
      if (toCanvas) {
        toCanvas(qrCanvasRef.current, currentFrame, {
          errorCorrectionLevel: "M",
          margin: 2,
          width: 260,
          color: { dark: "#000000", light: "#FFFFFF" },
        }).catch((err: unknown) => {
          console.error("QR canvas rendering error", err);
        });
      }
    });

    return () => {
      active = false;
    };
  }, [subMode, batch, frameIndex]);

  // ----------------------------------------------------
  // SENDER: Frame cycling loop
  // ----------------------------------------------------
  useEffect(() => {
    if (subMode !== "send" || !playing || !batch || batch.totalFrames <= 1) return;
    const intervalMs = Math.max(50, Math.round(1000 / fps));
    const timer = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % batch.totalFrames);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [subMode, playing, batch, fps]);

  // ----------------------------------------------------
  // RECEIVER: Incoming Frame Processing
  // ----------------------------------------------------
  const handleDetectedText = async (rawText: string) => {
    if (!rawText || parsedDumpRef.current) return;
    assemblerRef.current.feedFrame(rawText);
    const newProgress = assemblerRef.current.getProgress();
    setProgress(newProgress);

    if (newProgress.complete && !parsedDumpRef.current) {
      // Stream is 100% complete! Stop camera automatically.
      stopCamera();
      setScanning(false);
      setReassembling(true);
      try {
        const jsonText = await assemblerRef.current.reassembleAndDecompress();
        let dump: SyncDumpPayload;
        if (typeof extVault.parseSyncPayload === "function") {
          dump = await extVault.parseSyncPayload(jsonText);
        } else {
          dump = JSON.parse(jsonText);
        }
        parsedDumpRef.current = dump;
        setParsedDump(dump);

        const attCount =
          dump.attachments?.length ?? dump.attachmentFiles?.length ?? 0;
        setRestoreAttachments(attCount > 0);
      } catch (err) {
        setCameraError(
          err instanceof Error
            ? err.message
            : "Failed to decompress and parse incoming vault stream."
        );
      } finally {
        setReassembling(false);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const resetReceiver = () => {
    stopCamera();
    assemblerRef.current.reset();
    parsedDumpRef.current = null;
    setParsedDump(null);
    setProgress(assemblerRef.current.getProgress());
    setCameraError(null);
    setRestoreSuccess(null);
    setRestoreError(null);
    setScanning(true);
  };

  // ----------------------------------------------------
  // RECEIVER: Camera scan loop (GetUserMedia & RAF)
  // ----------------------------------------------------
  useEffect(() => {
    if (subMode !== "receive" || !scanning || parsedDump) {
      stopCamera();
      return;
    }

    let active = true;
    let animId: number | null = null;
    let lastScanTime = 0;

    const startCamera = async () => {
      setCameraError(null);
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera API (getUserMedia) is not supported in this browser.");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        const scanFrame = async (timestamp: number) => {
          if (!active) return;
          // Throttle to ~25 scans/sec (every 40ms)
          if (timestamp - lastScanTime >= 40) {
            lastScanTime = timestamp;
            const video = videoRef.current;
            if (video && video.readyState >= 2 && !parsedDumpRef.current) {
              let detectedText: string | null = null;

              // 1. Native BarcodeDetector if available
              if (typeof window !== "undefined" && "BarcodeDetector" in window) {
                try {
                  if (!barcodeDetectorRef.current) {
                    barcodeDetectorRef.current = new (window as any).BarcodeDetector({
                      formats: ["qr_code"],
                    });
                  }
                  const barcodes = await barcodeDetectorRef.current.detect(video);
                  if (barcodes.length > 0 && barcodes[0].rawValue) {
                    detectedText = barcodes[0].rawValue;
                  }
                } catch {
                  // Fallback to jsQR
                }
              }

              // 2. jsQR fallback if BarcodeDetector not supported or failed
              if (!detectedText && video.videoWidth > 0 && video.videoHeight > 0) {
                try {
                  if (!offscreenCanvasRef.current) {
                    offscreenCanvasRef.current = document.createElement("canvas");
                  }
                  const canvas = offscreenCanvasRef.current;
                  if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                  }
                  const ctx = canvas.getContext("2d", { willReadFrequently: true });
                  if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const jsqrModule = await import("jsqr");
                    const jsQR = jsqrModule.default || jsqrModule;
                    const code = jsQR(imgData.data, canvas.width, canvas.height, {
                      inversionAttempts: "dontInvert",
                    });
                    if (code && code.data) {
                      detectedText = code.data;
                    }
                  }
                } catch {
                  // ignore frame decode error
                }
              }

              if (detectedText) {
                await handleDetectedText(detectedText);
              }
            }
          }

          if (active && !parsedDumpRef.current) {
            animId = requestAnimationFrame(scanFrame);
          }
        };

        animId = requestAnimationFrame(scanFrame);
      } catch (err) {
        if (active) {
          setCameraError(
            err instanceof Error
              ? err.message
              : "Could not access camera. Check browser permissions."
          );
        }
      }
    };

    void startCamera();

    return () => {
      active = false;
      if (animId !== null) cancelAnimationFrame(animId);
      stopCamera();
    };
  }, [subMode, scanning, facingMode, parsedDump]);

  // ----------------------------------------------------
  // Manual frame paste helper
  // ----------------------------------------------------
  const handleManualFeed = async () => {
    if (!manualInput.trim()) return;
    const lines = manualInput.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      await handleDetectedText(line);
    }
    setManualInput("");
  };

  // ----------------------------------------------------
  // Apply Sync Restore
  // ----------------------------------------------------
  const handleApplySync = async () => {
    if (!parsedDump) return;
    setRestoring(true);
    setRestoreError(null);

    try {
      if (restoreMode === "overwrite" && autoSafetyBackup) {
        try {
          const safety = await extVault.export(today());
          const blob = new Blob([new Uint8Array(safety.data).buffer], {
            type: "application/zip",
          });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `pre-air-sync-safety-backup-${today()}.zip`;
          link.click();
          URL.revokeObjectURL(url);
        } catch {
          // Continue restore attempt even if safety download fails
        }
      }

      if (typeof extVault.restoreSyncPayload === "function") {
        const summary = await extVault.restoreSyncPayload(parsedDump, {
          mode: restoreMode === "overwrite" ? "OVERWRITE" : "MERGE",
          includeRecords: restoreRecords,
          includeWalletsAndProfile: restoreWalletsAndProfile,
          includeAttachments: restoreAttachments,
        });
        setRestoreSuccess(summary);
      } else {
        throw new Error("restoreSyncPayload is not supported on this VaultService.");
      }
    } catch (err) {
      setRestoreError(
        err instanceof Error ? err.message : "Restoring air-sync payload failed."
      );
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Sub-mode Switcher */}
      <div className="flex rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--bg-muted)] p-1 shadow-[2px_2px_0px_var(--shadow-ink)]">
        <button
          type="button"
          onClick={() => {
            setSubMode("send");
            stopCamera();
          }}
          className={`flex-1 rounded-xl py-2 px-3 text-xs font-black transition cursor-pointer select-none ${
            subMode === "send"
              ? "border-2 border-[var(--border-ink)] bg-[#D9F938] text-black shadow-[1px_1px_0px_var(--shadow-ink)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-2 border-transparent"
          }`}
        >
          Send (Stream QR)
        </button>
        <button
          type="button"
          onClick={() => {
            setSubMode("receive");
            setScanning(true);
          }}
          className={`flex-1 rounded-xl py-2 px-3 text-xs font-black transition cursor-pointer select-none ${
            subMode === "receive"
              ? "border-2 border-[var(--border-ink)] bg-[#D9F938] text-black shadow-[1px_1px_0px_var(--shadow-ink)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-2 border-transparent"
          }`}
        >
          Receive (Scan QR)
        </button>
      </div>

      {/* ==================================================== */}
      {/* SENDER MODE                                          */}
      {/* ==================================================== */}
      {subMode === "send" && (
        <div className="space-y-4">
          <p className="text-xs font-medium text-neutral-600 leading-relaxed">
            Continuously streams your offline ledger as animated, gzip-compressed QR chunks.
            Point a receiving device&apos;s camera here to sync in seconds without internet.
          </p>

          {/* Controls Bar */}
          <div className="rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] p-3.5 shadow-[2px_2px_0px_var(--shadow-ink)] space-y-3">
            {/* Attachment Toggle */}
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[var(--text-primary)] select-none">
              <input
                type="checkbox"
                checked={includeAttachments}
                onChange={(e) => setIncludeAttachments(e.target.checked)}
                className="h-4 w-4 rounded accent-[#D9F938]"
              />
              <span>Include Receipt Attachments (WebP)</span>
            </label>

            {/* Speed & Density Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
                  Speed (FPS)
                </label>
                <div className="flex gap-1">
                  {[
                    { label: "Slow (4 FPS)", value: 4 },
                    { label: "Fast (8 FPS)", value: 8 },
                    { label: "Turbo (12 FPS)", value: 12 },
                  ].map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setFps(s.value)}
                      className={`flex-1 py-1.5 px-1 rounded-xl text-[11px] font-mono font-bold border-2 transition cursor-pointer ${
                        fps === s.value
                          ? "border-[var(--border-ink)] bg-[#D9F938] text-black shadow-[1px_1px_0px_var(--shadow-ink)]"
                          : "border-transparent bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {s.label.split(" ")[0]} ({s.value}F)
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
                  Density
                </label>
                <div className="flex gap-1">
                  {[
                    { label: "Compact (250B)", value: 250 },
                    { label: "Standard (400B)", value: 400 },
                    { label: "Dense (650B)", value: 650 },
                  ].map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setChunkSize(d.value)}
                      className={`flex-1 py-1.5 px-1 rounded-xl text-[11px] font-mono font-bold border-2 transition cursor-pointer ${
                        chunkSize === d.value
                          ? "border-[var(--border-ink)] bg-[#D9F938] text-black shadow-[1px_1px_0px_var(--shadow-ink)]"
                          : "border-transparent bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {d.label.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Canvas Display */}
          <div className="rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] p-4 shadow-[2px_2px_0px_var(--shadow-ink)] flex flex-col items-center justify-center">
            {exporting ? (
              <div className="py-20 text-center space-y-2">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-black border-t-[#D9F938]" />
                <p className="text-xs font-mono font-bold text-[var(--text-secondary)]">
                  Generating sync frames…
                </p>
              </div>
            ) : senderError ? (
              <div className="py-12 text-center text-xs font-bold text-[var(--status-danger-text,#BE123C)]">
                {senderError}
              </div>
            ) : batch ? (
              <div className="space-y-3.5 w-full flex flex-col items-center">
                <canvas
                  ref={qrCanvasRef}
                  width={260}
                  height={260}
                  className="rounded-xl border-2 border-[var(--border-ink)] shadow-[2px_2px_0px_var(--shadow-ink)] bg-white mx-auto block"
                />

                {/* Stats Badge */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="rounded-xl border-2 border-[var(--border-ink)] bg-[var(--bg-muted)] px-2.5 py-1 text-xs font-mono font-bold shadow-[1px_1px_0px_var(--shadow-ink)]">
                    📦 {(batch.compressedBytes / 1024).toFixed(1)} KB
                  </span>
                  <span className="rounded-xl border-2 border-[var(--border-ink)] bg-[#D9F938] text-black px-2.5 py-1 text-xs font-mono font-black shadow-[1px_1px_0px_var(--shadow-ink)]">
                    Frame {frameIndex + 1} / {batch.totalFrames}
                  </span>
                  <span className="rounded-xl border-2 border-[var(--border-ink)] bg-[var(--bg-muted)] px-2.5 py-1 text-xs font-mono font-bold shadow-[1px_1px_0px_var(--shadow-ink)]">
                    ⏱ {(batch.totalFrames / fps).toFixed(1)}s / loop
                  </span>
                </div>

                {/* Playback Controls */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setFrameIndex((prev) => (prev - 1 + batch.totalFrames) % batch.totalFrames)
                    }
                    title="Previous Frame"
                    className="font-mono font-black px-3"
                  >
                    ←
                  </Button>
                  <Button
                    type="button"
                    variant={playing ? "secondary" : "primary"}
                    size="sm"
                    onClick={() => setPlaying(!playing)}
                    className="min-w-24 text-xs font-bold"
                  >
                    {playing ? "Pause ⏸" : "Play ▶"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setFrameIndex((prev) => (prev + 1) % batch.totalFrames)
                    }
                    title="Next Frame"
                    className="font-mono font-black px-3"
                  >
                    →
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* RECEIVER MODE                                        */}
      {/* ==================================================== */}
      {subMode === "receive" && (
        <div className="space-y-4">
          {!parsedDump ? (
            <>
              <p className="text-xs font-medium text-neutral-600 leading-relaxed">
                Aim this camera at the sending device&apos;s animated QR code. Chunks assemble in real-time as frames are detected.
              </p>

              {/* Camera Error Message */}
              {cameraError && (
                <div className="rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--status-danger-bg,#FFE4E6)] p-3 text-xs font-bold text-[var(--status-danger-text,#BE123C)] shadow-[2px_2px_0px_var(--shadow-ink)]">
                  Camera error: {cameraError}
                </div>
              )}

              {reassembling && (
                <div className="rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] p-6 text-center space-y-2 shadow-[2px_2px_0px_var(--shadow-ink)]">
                  <div className="inline-block h-7 w-7 animate-spin rounded-full border-4 border-black border-t-[#D9F938]" />
                  <p className="text-xs font-mono font-bold text-[var(--text-secondary)]">
                    Decompressing & reassembling snapshot…
                  </p>
                </div>
              )}

              {/* Viewfinder & Controls */}
              <div className="space-y-2">
                <div className="relative mx-auto w-full max-w-[320px] aspect-square rounded-2xl border-2 border-[var(--border-ink)] bg-black overflow-hidden shadow-[2px_2px_0px_var(--shadow-ink)] flex items-center justify-center">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className="h-full w-full object-cover"
                  />
                  {/* Aiming Reticle */}
                  <div className="pointer-events-none absolute inset-8 border-2 border-dashed border-[#D9F938] rounded-2xl opacity-80 animate-pulse" />
                </div>

                <div className="flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))
                    }
                    className="text-xs font-bold"
                  >
                    Flip Camera 🔄
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={resetReceiver}
                    className="text-xs font-bold"
                  >
                    Reset ↺
                  </Button>
                </div>
              </div>

              {/* Live Chunk Matrix Grid */}
              {progress.totalFrames > 0 && (
                <div className="rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] p-3.5 shadow-[2px_2px_0px_var(--shadow-ink)] space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono font-bold">
                    <span className="text-[var(--text-secondary)]">Capturing Stream</span>
                    <span className="text-black font-black bg-[#D9F938] px-2 py-0.5 rounded-lg border border-[var(--border-ink)]">
                      {Math.round(progress.progressRatio * 100)}% ({progress.receivedCount} / {progress.totalFrames} frames captured)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[var(--bg-muted)] h-2.5 rounded-full border border-[var(--border-ink)] overflow-hidden">
                    <div
                      className="bg-[#D9F938] h-full transition-all duration-150"
                      style={{ width: `${Math.round(progress.progressRatio * 100)}%` }}
                    />
                  </div>

                  {/* Chunk Matrix Cells */}
                  <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 p-2 bg-[var(--bg-muted)] rounded-xl border border-[var(--border-ink)] max-h-32 overflow-y-auto">
                    {Array.from({ length: progress.totalFrames }, (_, i) => {
                      const isReceived = progress.receivedIndices.includes(i);
                      return (
                        <div
                          key={i}
                          className={`h-6 flex items-center justify-center text-[10px] font-mono font-black rounded border transition-colors ${
                            isReceived
                              ? "bg-[#D9F938] text-black border-[var(--border-ink)] shadow-[1px_1px_0px_var(--shadow-ink)]"
                              : "bg-[var(--bg-card)] text-[var(--text-tertiary)] border-[var(--border-ink)] opacity-40"
                          }`}
                          title={`Frame ${i + 1} ${isReceived ? "Captured" : "Pending"}`}
                        >
                          {i + 1}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Manual Frame Paste Helper */}
              <div className="rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] p-3 shadow-[2px_2px_0px_var(--shadow-ink)]">
                <button
                  type="button"
                  onClick={() => setShowManualPaste(!showManualPaste)}
                  className="w-full text-left flex items-center justify-between text-xs font-bold text-[var(--text-primary)] cursor-pointer"
                >
                  <span>No camera? Paste or test QR stream</span>
                  <span className="font-mono text-sm">{showManualPaste ? "▲" : "▼"}</span>
                </button>

                {showManualPaste && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      rows={3}
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="Paste KB1|... frame string here"
                      className="w-full rounded-xl border-2 border-[var(--border-ink)] bg-[var(--bg-muted)] p-2 font-mono text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#D9F938]"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => void handleManualFeed()}
                      disabled={!manualInput.trim()}
                      className="w-full text-xs font-bold"
                    >
                      Feed Frame
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* ==================================================== */
            /* POST-SCAN RESTORE CONTROL PANEL                      */
            /* ==================================================== */
            <div className="space-y-4">
              <div className="rounded-2xl border-2 border-[var(--border-ink)] bg-[#D9F938] p-3 text-xs font-black text-black shadow-[2px_2px_0px_var(--shadow-ink)] flex items-center justify-between">
                <span>✓ Stream Captured & Decompressed</span>
                <span className="font-mono font-bold text-[11px] bg-black text-white px-2 py-0.5 rounded-md">
                  100% Locked
                </span>
              </div>

              {/* Snapshot Summary Card */}
              <div className="rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] p-3.5 shadow-[2px_2px_0px_var(--shadow-ink)] space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
                    Incoming Snapshot
                  </p>
                  <span className="font-mono text-xs font-bold text-[var(--text-secondary)]">
                    Date: {parsedDump.exportedAt}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-xs">
                  <div className="rounded-xl border border-[var(--border-ink)] bg-[var(--bg-muted)] p-2">
                    <div className="text-[10px] uppercase font-sans font-bold text-[var(--text-tertiary)]">
                      Transactions
                    </div>
                    <div className="font-bold text-sm text-[var(--text-primary)]">
                      {parsedDump.transactions?.length ?? 0}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--border-ink)] bg-[var(--bg-muted)] p-2">
                    <div className="text-[10px] uppercase font-sans font-bold text-[var(--text-tertiary)]">
                      Wallets
                    </div>
                    <div className="font-bold text-sm text-[var(--text-primary)]">
                      {parsedDump.wallets?.length ?? 0}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--border-ink)] bg-[var(--bg-muted)] p-2">
                    <div className="text-[10px] uppercase font-sans font-bold text-[var(--text-tertiary)]">
                      Subscriptions
                    </div>
                    <div className="font-bold text-sm text-[var(--text-primary)]">
                      {parsedDump.subscriptions?.length ?? 0}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--border-ink)] bg-[var(--bg-muted)] p-2">
                    <div className="text-[10px] uppercase font-sans font-bold text-[var(--text-tertiary)]">
                      Invoices
                    </div>
                    <div className="font-bold text-sm text-[var(--text-primary)]">
                      {parsedDump.invoices?.length ?? 0}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--border-ink)] bg-[var(--bg-muted)] p-2">
                    <div className="text-[10px] uppercase font-sans font-bold text-[var(--text-tertiary)]">
                      Attachments
                    </div>
                    <div className="font-bold text-sm text-[var(--text-primary)]">
                      {parsedDump.attachments?.length ??
                        parsedDump.attachmentFiles?.length ??
                        0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Restore Options Form */}
              <div className="rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] p-4 shadow-[2px_2px_0px_var(--shadow-ink)] space-y-3.5">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
                    Restore Mode
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRestoreMode("merge")}
                      className={`p-2.5 rounded-xl border-2 text-left transition cursor-pointer ${
                        restoreMode === "merge"
                          ? "border-[var(--border-ink)] bg-[#D9F938] text-black shadow-[1px_1px_0px_var(--shadow-ink)]"
                          : "border-[var(--border-ink)] bg-[var(--bg-muted)] text-[var(--text-secondary)] opacity-70"
                      }`}
                    >
                      <div className="text-xs font-black">Smart Merge (Recommended)</div>
                      <div className="text-[10px] font-medium mt-0.5">
                        Upserts incoming data without deleting local records.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRestoreMode("overwrite")}
                      className={`p-2.5 rounded-xl border-2 text-left transition cursor-pointer ${
                        restoreMode === "overwrite"
                          ? "border-[var(--border-ink)] bg-[var(--status-danger-bg,#FFE4E6)] text-[var(--status-danger-text,#BE123C)] shadow-[1px_1px_0px_var(--shadow-ink)]"
                          : "border-[var(--border-ink)] bg-[var(--bg-muted)] text-[var(--text-secondary)] opacity-70"
                      }`}
                    >
                      <div className="text-xs font-black">Full Overwrite (Replace All)</div>
                      <div className="text-[10px] font-medium mt-0.5">
                        Permanently replaces local data with this snapshot.
                      </div>
                    </button>
                  </div>
                </div>

                {/* Granular Checkboxes */}
                <div className="space-y-2 pt-1 border-t border-[var(--border-ink)]">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--text-tertiary)] pt-1">
                    Select Data to Restore
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[var(--text-primary)] select-none">
                    <input
                      type="checkbox"
                      checked={restoreRecords}
                      onChange={(e) => setRestoreRecords(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#D9F938]"
                    />
                    <span>Transactions, Subscriptions, Invoices & Categories</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[var(--text-primary)] select-none">
                    <input
                      type="checkbox"
                      checked={restoreWalletsAndProfile}
                      onChange={(e) => setRestoreWalletsAndProfile(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#D9F938]"
                    />
                    <span>Wallets, Balances & Profile</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[var(--text-primary)] select-none">
                    <input
                      type="checkbox"
                      checked={restoreAttachments}
                      disabled={
                        (parsedDump.attachments?.length ??
                          parsedDump.attachmentFiles?.length ??
                          0) === 0
                      }
                      onChange={(e) => setRestoreAttachments(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#D9F938]"
                    />
                    <span>
                      Receipt Attachments (WebP)
                      {(parsedDump.attachments?.length ??
                        parsedDump.attachmentFiles?.length ??
                        0) === 0 && " (None in snapshot)"}
                    </span>
                  </label>
                </div>

                {/* Overwrite Safety Backup Option */}
                {restoreMode === "overwrite" && (
                  <div className="rounded-xl border border-[var(--border-ink)] bg-[var(--status-warning-bg,#FEF3C7)] p-2.5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[var(--status-warning-text,#92400E)] select-none">
                      <input
                        type="checkbox"
                        checked={autoSafetyBackup}
                        onChange={(e) => setAutoSafetyBackup(e.target.checked)}
                        className="h-4 w-4 rounded accent-black"
                      />
                      <span>Download safety ZIP backup before overwriting</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Restore Result / Error Notice */}
              {restoreError && (
                <div className="rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--status-danger-bg,#FFE4E6)] p-3 text-xs font-bold text-[var(--status-danger-text,#BE123C)] shadow-[2px_2px_0px_var(--shadow-ink)]">
                  {restoreError}
                </div>
              )}

              {restoreSuccess && (
                <div className="rounded-2xl border-2 border-[var(--border-ink)] bg-[#D9F938] p-3 text-xs font-black text-black shadow-[2px_2px_0px_var(--shadow-ink)] space-y-2">
                  <p>✓ Air-Sync restore completed successfully!</p>
                  <div className="flex gap-2">
                    {onClose && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={onClose}
                        className="flex-1 text-xs font-bold"
                      >
                        Close
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => location.reload()}
                      className="flex-1 text-xs font-bold bg-black text-white hover:bg-neutral-800"
                    >
                      Reload App
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={resetReceiver}
                  disabled={restoring}
                  className="flex-1 text-xs font-bold"
                >
                  Scan Again
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => void handleApplySync()}
                  disabled={restoring}
                  className="flex-1 text-xs font-bold"
                >
                  {restoring ? "Applying Sync…" : "Apply Sync"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
