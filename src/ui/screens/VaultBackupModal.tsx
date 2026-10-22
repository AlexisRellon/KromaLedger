import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useStorage } from "../../state/StorageContext";
import { VoltButton } from "../primitives";

const today = () => format(new Date(), "yyyy-MM-dd");
const formatBytes = (value: number | null) =>
  value === null
    ? "Unavailable"
    : value < 1024 ** 2
      ? `${Math.round(value / 1024)} KB`
      : `${(value / 1024 ** 2).toFixed(1)} MB`;

export function VaultBackupModal({ onClose }: { onClose: () => void }) {
  const { vault, storageStatus } = useStorage();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [usage, setUsage] = useState<{ usage: number | null; quota: number | null }>();
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [autoBackupBeforeRestore, setAutoBackupBeforeRestore] = useState(true);

  useEffect(() => {
    let active = true;
    void storageStatus()
      .then((status) => {
        if (active) setUsage({ usage: status.usage, quota: status.quota });
      })
      .catch((error) => {
        if (active) setMessage(error instanceof Error ? error.message : "Could not read storage status.");
      });
    return () => {
      active = false;
    };
  }, [storageStatus]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) {
        if (pendingFile) setPendingFile(null);
        else onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [busy, onClose, pendingFile]);

  const backup = async () => {
    setBusy(true);
    try {
      const result = await vault.export(today());
      const blob = new Blob([new Uint8Array(result.data).buffer], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(url);
      setMessage("Vault backup downloaded successfully.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Backup failed.");
    } finally {
      setBusy(false);
    }
  };

  const confirmRestore = async () => {
    if (!pendingFile) return;
    setBusy(true);
    try {
      if (autoBackupBeforeRestore) {
        try {
          const safety = await vault.export(today());
          const blob = new Blob([new Uint8Array(safety.data).buffer], { type: "application/zip" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `pre-restore-safety-backup-${today()}.zip`;
          link.click();
          URL.revokeObjectURL(url);
        } catch {
          // If safety backup export fails, proceed with restore attempt
        }
      }
      await vault.restore(new Uint8Array(await pendingFile.arrayBuffer()));
      setMessage("Backup restored. Reloading local data…");
      location.reload();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Restore failed.");
      setBusy(false);
      setPendingFile(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Local vault backup"
        className="flex max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#11120f] shadow-2xl animate-entrance"
      >
        {/* Modal Header (Fixed) */}
        <div className="shrink-0 flex items-start justify-between border-b border-white/[0.08] px-5 py-4 sm:px-6 sm:py-5">
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-white">Local Vault Backup</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            disabled={busy}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-neutral-400 hover:text-white transition hover:bg-white/10"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <p className="text-sm leading-relaxed text-neutral-400">
            Your ledger lives strictly on this device. Export a standalone ZIP archive or restore an existing KromaLedger vault.
          </p>

          <p className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-xs leading-relaxed text-neutral-400">
            <span className="font-semibold text-neutral-300">Privacy Notice:</span> Backups are unencrypted ZIP archives holding your raw ledger records and attachments. Store exported copies in a secure, private location.
          </p>

          <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3">
            <p className="text-xs font-medium tracking-wider text-neutral-400">Local device storage</p>
            <p className="mt-1 font-mono text-xs text-neutral-200">
              {formatBytes(usage?.usage ?? null)} used of {formatBytes(usage?.quota ?? null)}
            </p>
          </div>

        {/* Destructive restore confirmation step */}
        {pendingFile ? (
          <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-xs font-semibold tracking-wider text-amber-400">WARNING: DESTRUCTIVE RESTORE</p>
            <p className="mt-1.5 text-xs leading-relaxed text-neutral-300">
              Restoring <span className="font-mono text-white">{pendingFile.name}</span> will permanently overwrite and replace all current transactions, subscriptions, and invoices on this device.
            </p>
            <label className="mt-3 flex items-center gap-2 cursor-pointer text-xs text-neutral-300 select-none">
              <input
                type="checkbox"
                checked={autoBackupBeforeRestore}
                onChange={(e) => setAutoBackupBeforeRestore(e.target.checked)}
                className="rounded border-white/20 bg-black/40 text-[#D9F938] focus:ring-0"
              />
              <span>Download safety backup before overwriting</span>
            </label>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setPendingFile(null)}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-xs font-medium text-neutral-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void confirmRestore()}
                className="flex-1 rounded-xl bg-amber-400 py-2.5 text-xs font-bold text-[#070806] shadow-md shadow-black/40 transition hover:brightness-105 disabled:opacity-50"
              >
                {busy ? "Restoring…" : "Overwrite & Restore"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            <VoltButton disabled={busy} onClick={() => void backup()}>
              {busy ? "Exporting…" : "Download ZIP backup"}
            </VoltButton>

            <label className="cursor-pointer rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-center text-sm font-medium text-neutral-300 transition hover:border-white/20 hover:text-white">
              Restore a ZIP backup
              <input
                type="file"
                accept=".zip,application/zip"
                className="hidden"
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setPendingFile(file);
                }}
              />
            </label>
          </div>
        )}

        {message && (
          <p role="status" className="mt-4 text-center text-xs text-neutral-300">
            {message}
          </p>
        )}
        </div>
      </section>
    </div>
  );
}
