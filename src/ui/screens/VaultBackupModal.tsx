import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useStorage } from "../../state/StorageContext";
import { Button, ModalShell, KabanMascot } from "../primitives";
import { QrSyncPanel } from "../components/QrSyncPanel";

const today = () => format(new Date(), "yyyy-MM-dd");
const formatBytes = (value: number | null) =>
  value === null
    ? "Unavailable"
    : value < 1024 ** 2
      ? `${Math.round(value / 1024)} KB`
      : `${(value / 1024 ** 2).toFixed(1)} MB`;

export function VaultBackupModal({ onClose }: { onClose: () => void }) {
  const { vault, storageStatus } = useStorage();
  const [mainTab, setMainTab] = useState<"qr" | "zip">("qr");
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
    <ModalShell
      isOpen={true}
      onClose={onClose}
      title="Local Vault Backup"
      subtitle="Offline Snapshot & Restoration"
      busy={busy}
      maxWidth="md"
      // relative anchors .tnalak-band to the card, independent of the entrance animation's transform
      className="relative"
    >
      {/* Tnalak texture, modal header band only; no-op until shared defs exist */}
      <svg
        aria-hidden="true"
        className="tnalak-band pointer-events-none text-current"
      >
        <rect width="100%" height="100%" fill="url(#pattern-tnalak-circuit)" />
      </svg>
      <div className="space-y-4">
        {/* Top-Level Mode Tabs */}
        <div className="flex rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--bg-muted)] p-1 shadow-[2px_2px_0px_var(--shadow-ink)]">
          <button
            type="button"
            onClick={() => setMainTab("qr")}
            className={`flex-1 rounded-xl py-2 px-3 text-xs font-black transition cursor-pointer select-none ${
              mainTab === "qr"
                ? "border-2 border-[var(--border-ink)] bg-[#D9F938] text-black shadow-[1px_1px_0px_var(--shadow-ink)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-2 border-transparent"
            }`}
          >
            QR Air-Sync
          </button>
          <button
            type="button"
            onClick={() => setMainTab("zip")}
            className={`flex-1 rounded-xl py-2 px-3 text-xs font-black transition cursor-pointer select-none ${
              mainTab === "zip"
                ? "border-2 border-[var(--border-ink)] bg-[#D9F938] text-black shadow-[1px_1px_0px_var(--shadow-ink)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-2 border-transparent"
            }`}
          >
            ZIP File Archive
          </button>
        </div>

        {mainTab === "qr" ? (
          <QrSyncPanel onClose={onClose} />
        ) : (
          <>
            <p className="text-sm font-medium leading-relaxed text-neutral-700">
              Your financial data stays securely on this device. Export a standalone ZIP archive or restore a previous Kaban vault snapshot.
            </p>

            <div className="rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--status-warning-bg,#FEF3C7)] p-3 text-xs leading-relaxed text-[var(--text-primary)] shadow-[2px_2px_0px_var(--shadow-ink)]">
              <span className="font-bold text-[var(--status-warning-text,#92400E)]">Privacy Notice:</span> Backups are unencrypted ZIP archives holding your raw ledger records and attachments. Store exported copies in a secure, private location.
            </div>

            <div className="rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] p-3.5 shadow-[2px_2px_0px_var(--shadow-ink)] flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Local device storage</p>
                <p className="mt-1 font-mono text-xs font-bold text-[var(--text-primary)]">
                  {formatBytes(usage?.usage ?? null)} used of {formatBytes(usage?.quota ?? null)}
                </p>
              </div>
              <KabanMascot pose="vault-locked" size={88} />
            </div>

            {/* Destructive restore confirmation step */}
            {pendingFile ? (
              <div className="rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--status-danger-bg,#FFE4E6)] p-4 shadow-[3px_3px_0px_var(--shadow-ink)]">
                <p className="text-xs font-black tracking-wider text-[var(--status-danger-text,#BE123C)]">WARNING: DESTRUCTIVE RESTORE</p>
                <p className="mt-1.5 text-xs font-medium leading-relaxed text-[var(--text-primary)]">
                  Restoring <span className="font-mono font-bold text-[var(--text-primary)]">{pendingFile.name}</span> will permanently overwrite and replace all current transactions, subscriptions, and accounts on this device.
                </p>
                <label className="mt-3 flex items-center gap-2 cursor-pointer text-xs font-bold text-[var(--text-secondary)] select-none">
                  <input
                    type="checkbox"
                    checked={autoBackupBeforeRestore}
                    onChange={(e) => setAutoBackupBeforeRestore(e.target.checked)}
                    className="h-4 w-4 rounded accent-[var(--theme-primary)]"
                  />
                  <span>Download safety backup before overwriting</span>
                </label>
                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={busy}
                    onClick={() => setPendingFile(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={busy}
                    onClick={() => void confirmRestore()}
                    className="flex-1"
                  >
                    {busy ? "Restoring…" : "Overwrite & Restore"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 pt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={busy}
                  onClick={() => void backup()}
                  className="w-full"
                >
                  {busy ? "Exporting…" : "Download ZIP backup"}
                </Button>

                <label className="inline-flex items-center justify-center cursor-pointer rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] px-5 py-3 text-sm font-bold text-[var(--text-primary)] shadow-[3px_3px_0px_var(--shadow-ink)] neo-btn-interactive transition-all hover:bg-[var(--bg-muted)]">
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
          </>
        )}

        {message && (
          <p role="status" className="mt-2 text-center text-xs font-bold text-neutral-800">
            {message}
          </p>
        )}
      </div>
    </ModalShell>
  );
}
