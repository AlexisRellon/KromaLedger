import { useEffect, useState, useCallback } from "react";
import { Button, SmokedCard } from "../primitives";
import { useStorage } from "../../state/StorageContext";
import {
  isBrowserNotificationSupported,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  dispatchBrowserNotification,
} from "../../adapters/notifications/notificationEngine";

function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || isNaN(bytes)) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

export interface AppPermissionsSectionProps {
  onShowNotice?: (message: string) => void;
}

export function AppPermissionsSection({ onShowNotice }: AppPermissionsSectionProps) {
  const { storageStatus } = useStorage();

  // 1. Notification Permission State
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">(() =>
    getBrowserNotificationPermission()
  );
  const [isTestingNotification, setIsTestingNotification] = useState(false);

  // 2. Storage Persistence State
  const [isPersistent, setIsPersistent] = useState<boolean | null>(null);
  const [storageUsage, setStorageUsage] = useState<number | null>(null);
  const [storageQuota, setStorageQuota] = useState<number | null>(null);
  const [isRequestingStorage, setIsRequestingStorage] = useState(false);

  // 3. Camera / Media Access State
  const [cameraStatus, setCameraStatus] = useState<"granted" | "denied" | "prompt" | "unsupported">("prompt");
  const [isCheckingCamera, setIsCheckingCamera] = useState(false);

  // 4. Clipboard Access State
  const [clipboardStatus, setClipboardStatus] = useState<"granted" | "denied" | "prompt" | "unsupported">("prompt");

  // Fetch initial storage persistence & estimates
  const refreshStorageStats = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.storage) {
      try {
        const persisted = await navigator.storage.persisted();
        setIsPersistent(persisted);
        const est = await navigator.storage.estimate();
        setStorageUsage(est.usage ?? null);
        setStorageQuota(est.quota ?? null);
        return;
      } catch {
        // Fallback below
      }
    }
    try {
      const s = await storageStatus();
      setIsPersistent(s.persistent);
      setStorageUsage(s.usage);
      setStorageQuota(s.quota);
    } catch {
      setIsPersistent(false);
    }
  }, [storageStatus]);

  useEffect(() => {
    let mounted = true;

    // Refresh notifications
    setNotificationPermission(getBrowserNotificationPermission());

    // Refresh storage
    void refreshStorageStats();

    // Query camera permission if API is supported
    if (typeof navigator !== "undefined") {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraStatus("unsupported");
      } else if (navigator.permissions?.query) {
        try {
          navigator.permissions
            .query({ name: "camera" as PermissionName })
            .then((perm) => {
              if (mounted) {
                setCameraStatus(perm.state as "granted" | "denied" | "prompt");
                perm.onchange = () => {
                  if (mounted) {
                    setCameraStatus(perm.state as "granted" | "denied" | "prompt");
                  }
                };
              }
            })
            .catch(() => {
              if (mounted) setCameraStatus("prompt");
            });
        } catch {
          if (mounted) setCameraStatus("prompt");
        }
      } else {
        setCameraStatus("prompt");
      }

      // Check clipboard
      if (!navigator.clipboard) {
        setClipboardStatus("unsupported");
      } else if (navigator.permissions?.query) {
        try {
          navigator.permissions
            .query({ name: "clipboard-read" as PermissionName })
            .then((perm) => {
              if (mounted) {
                setClipboardStatus(perm.state as "granted" | "denied" | "prompt");
                perm.onchange = () => {
                  if (mounted) {
                    setClipboardStatus(perm.state as "granted" | "denied" | "prompt");
                  }
                };
              }
            })
            .catch(() => {
              if (mounted) setClipboardStatus("granted");
            });
        } catch {
          if (mounted) setClipboardStatus("granted");
        }
      } else {
        setClipboardStatus("granted");
      }
    }

    return () => {
      mounted = false;
    };
  }, [refreshStorageStats]);

  // Handler: Request notification permission
  const handleRequestNotification = async () => {
    if (!isBrowserNotificationSupported()) {
      onShowNotice?.("Browser notification API is not supported on this device.");
      return;
    }
    const result = await requestBrowserNotificationPermission();
    setNotificationPermission(result);
    if (result === "granted") {
      onShowNotice?.("Notification alerts enabled.");
      dispatchBrowserNotification("Kaban Alerts Enabled", {
        body: "You will receive reminders for upcoming subscription renewals and due dates.",
      });
    } else if (result === "denied") {
      onShowNotice?.("Notifications were blocked in your browser site settings.");
    }
  };

  // Handler: Send test notification
  const handleTestNotification = () => {
    setIsTestingNotification(true);
    const sent = dispatchBrowserNotification("Kaban Test Alert", {
      body: "Browser alerts are working properly on this device.",
    });
    if (sent) {
      onShowNotice?.("Test notification dispatched.");
    } else {
      onShowNotice?.("Unable to dispatch notification. Please check browser permissions.");
    }
    setTimeout(() => setIsTestingNotification(false), 500);
  };

  // Handler: Request persistent storage
  const handleRequestStorage = async () => {
    if (typeof navigator === "undefined" || !navigator.storage?.persist) {
      onShowNotice?.("Storage persistence is not supported in this browser.");
      return;
    }
    setIsRequestingStorage(true);
    try {
      const granted = await navigator.storage.persist();
      setIsPersistent(granted);
      await refreshStorageStats();
      if (granted) {
        onShowNotice?.("Persistent storage granted. Data is protected from browser eviction.");
      } else {
        onShowNotice?.("Browser retained best-effort storage mode under current device constraints.");
      }
    } catch {
      onShowNotice?.("Failed to request persistent storage.");
    } finally {
      setIsRequestingStorage(false);
    }
  };

  // Handler: Test camera access
  const handleTestCamera = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      onShowNotice?.("Camera API is not supported in this browser.");
      setCameraStatus("unsupported");
      return;
    }
    setIsCheckingCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      // Stop all tracks immediately
      stream.getTracks().forEach((track) => track.stop());
      setCameraStatus("granted");
      onShowNotice?.("Camera access confirmed for QR Air-Sync.");
    } catch (err: unknown) {
      console.warn("Camera request error:", err);
      const isDenied =
        err instanceof Error &&
        (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");
      const isNotFound =
        err instanceof Error &&
        (err.name === "NotFoundError" || err.name === "DevicesNotFoundError");

      if (isDenied) {
        setCameraStatus("denied");
        onShowNotice?.("Camera permission was denied in browser settings.");
      } else if (isNotFound) {
        setCameraStatus("unsupported");
        onShowNotice?.("No camera device was detected on this system.");
      } else {
        setCameraStatus("prompt");
        onShowNotice?.(
          err instanceof Error
            ? `Camera error: ${err.message}`
            : "Could not open camera device."
        );
      }
    } finally {
      setIsCheckingCamera(false);
    }
  };

  // Handler: Test clipboard copy
  const handleTestClipboard = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      onShowNotice?.("Clipboard API is unavailable in this environment.");
      setClipboardStatus("unsupported");
      return;
    }
    try {
      await navigator.clipboard.writeText("Kaban: Local-First Financial Vault");
      setClipboardStatus("granted");
      onShowNotice?.("Clipboard copy verified successfully.");
    } catch {
      setClipboardStatus("denied");
      onShowNotice?.("Clipboard access blocked by browser.");
    }
  };

  // Compute ready / active permissions count
  const readyCount = [
    notificationPermission === "granted",
    isPersistent === true,
    cameraStatus === "granted",
    clipboardStatus === "granted",
    true, // Sandboxed file system always available
  ].filter(Boolean).length;

  const percentUsed =
    storageQuota && storageUsage ? Math.min(100, Math.round((storageUsage / storageQuota) * 100)) : 0;

  return (
    <SmokedCard>
      {/* Category Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[var(--border-ink)] bg-[var(--theme-subtle)] text-[var(--theme-subtle-text)] shadow-[1px_1px_0px_var(--shadow-ink)]"
              aria-hidden="true"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-display text-lg font-black text-[var(--text-primary)]">App permissions</h3>
              <p className="text-xs font-medium text-[var(--text-tertiary)] mt-0.5">
                Review and configure on-device hardware access, notification alerts, and storage durability.
              </p>
            </div>
          </div>
        </div>
        <span className="self-start sm:self-auto rounded-md border border-[var(--border-ink)] bg-[var(--theme-subtle)] px-2.5 py-1 text-xs font-mono font-bold text-[var(--theme-subtle-text)] shadow-[1px_1px_0px_var(--shadow-ink)]">
          {readyCount}/5 Permissions Ready
        </span>
      </div>

      {/* Permissions List */}
      <div className="mt-6 border-t-2 border-[var(--border-divider)] pt-2 divide-y divide-[var(--border-divider)]">
        {/* Permission 1: Push & Local Notifications */}
        <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[var(--border-ink)] bg-[var(--bg-subtle)] text-[var(--text-primary)] shadow-[1px_1px_0px_var(--shadow-ink)] mt-0.5"
              aria-hidden="true"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                />
              </svg>
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-black text-[var(--text-primary)]">Notifications & Alerts</h4>
                {notificationPermission === "granted" && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-ink)] bg-[var(--status-success-bg)] px-2 py-0.5 text-xs font-mono font-bold text-[var(--status-success-text)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-success-text)] animate-pulse" />
                    Allowed
                  </span>
                )}
                {notificationPermission === "default" && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-ink)] bg-[var(--status-warning-bg)] px-2 py-0.5 text-xs font-mono font-bold text-[var(--status-warning-text)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-warning-text)]" />
                    Not Configured
                  </span>
                )}
                {notificationPermission === "denied" && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-ink)] bg-[var(--status-danger-bg)] px-2 py-0.5 text-xs font-mono font-bold text-[var(--status-danger-text)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-danger-text)]" />
                    Blocked by Browser
                  </span>
                )}
                {notificationPermission === "unsupported" && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-2 py-0.5 text-xs font-mono font-bold text-[var(--text-tertiary)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                    Unavailable
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-[var(--text-tertiary)] max-w-xl leading-relaxed">
                Sends timely reminders for recurring subscription payments, invoice due dates, and warranty alerts.
              </p>
              {notificationPermission === "denied" && (
                <p className="text-[11px] font-semibold text-[var(--status-danger-text)] mt-1">
                  Alerts are blocked in browser preferences. Click the lock or settings icon next to your URL bar to allow notifications.
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
            {notificationPermission === "granted" && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                busy={isTestingNotification}
                onClick={handleTestNotification}
              >
                Send Test Alert
              </Button>
            )}
            {notificationPermission === "default" && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleRequestNotification}
              >
                Enable Alerts
              </Button>
            )}
            {notificationPermission === "denied" && (
              <Button
                type="button"
                variant="subtle"
                size="sm"
                onClick={() => onShowNotice?.("Re-enable notifications in your browser's site settings.")}
              >
                Blocked
              </Button>
            )}
          </div>
        </div>

        {/* Permission 2: Persistent Local Storage */}
        <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[var(--border-ink)] bg-[var(--bg-subtle)] text-[var(--text-primary)] shadow-[1px_1px_0px_var(--shadow-ink)] mt-0.5"
              aria-hidden="true"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
                />
              </svg>
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-black text-[var(--text-primary)]">Persistent Local Storage</h4>
                {isPersistent === true && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-ink)] bg-[var(--status-success-bg)] px-2 py-0.5 text-xs font-mono font-bold text-[var(--status-success-text)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-success-text)]" />
                    Protected (Persistent)
                  </span>
                )}
                {isPersistent === false && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-ink)] bg-[var(--status-warning-bg)] px-2 py-0.5 text-xs font-mono font-bold text-[var(--status-warning-text)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-warning-text)]" />
                    Best-Effort (Evictable)
                  </span>
                )}
                {isPersistent === null && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-2 py-0.5 text-xs font-mono font-bold text-[var(--text-tertiary)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                    Checking...
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-[var(--text-tertiary)] max-w-xl leading-relaxed">
                Prevents your browser from clearing IndexedDB records, offline invoices, and receipt attachments during device storage pressure.
              </p>

              {/* Storage Quota Usage bar */}
              {storageQuota !== null && storageUsage !== null && (
                <div className="mt-2.5 max-w-md space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-tertiary)]">
                    <span>
                      Quota Used: <strong className="text-[var(--text-primary)] font-bold">{formatBytes(storageUsage)}</strong> / {formatBytes(storageQuota)}
                    </span>
                    <span className="font-bold text-[var(--text-secondary)]">{percentUsed}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full border border-[var(--border-ink)] bg-[var(--bg-muted)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                    <div
                      className="h-full rounded-full bg-[var(--theme-primary)] transition-all duration-500"
                      style={{ width: `${Math.max(1, percentUsed)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
            {isPersistent ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await refreshStorageStats();
                  onShowNotice?.("Storage quota metrics updated.");
                }}
              >
                Refresh Stats
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="sm"
                busy={isRequestingStorage}
                onClick={handleRequestStorage}
              >
                Protect Storage
              </Button>
            )}
          </div>
        </div>

        {/* Permission 3: Camera / Optical Scanner (QR Air-Sync) */}
        <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[var(--border-ink)] bg-[var(--bg-subtle)] text-[var(--text-primary)] shadow-[1px_1px_0px_var(--shadow-ink)] mt-0.5"
              aria-hidden="true"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
              </svg>
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-black text-[var(--text-primary)]">Camera (Air-Sync Optical Scanner)</h4>
                {cameraStatus === "granted" && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-ink)] bg-[var(--status-success-bg)] px-2 py-0.5 text-xs font-mono font-bold text-[var(--status-success-text)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-success-text)] animate-pulse" />
                    Allowed
                  </span>
                )}
                {cameraStatus === "prompt" && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-ink)] bg-[var(--status-info-bg)] px-2 py-0.5 text-xs font-mono font-bold text-[var(--status-info-text)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                    Prompt on Use
                  </span>
                )}
                {cameraStatus === "denied" && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-ink)] bg-[var(--status-danger-bg)] px-2 py-0.5 text-xs font-mono font-bold text-[var(--status-danger-text)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-danger-text)]" />
                    Blocked
                  </span>
                )}
                {cameraStatus === "unsupported" && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-2 py-0.5 text-xs font-mono font-bold text-[var(--text-tertiary)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                    Unavailable
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-[var(--text-tertiary)] max-w-xl leading-relaxed">
                Used strictly when scanning animated QR codes in Air-Sync for air-gapped device synchronization without network access.
              </p>
              {cameraStatus === "denied" && (
                <p className="text-[11px] font-semibold text-[var(--status-danger-text)] mt-1">
                  Camera permission is blocked. Click the lock icon in your browser URL bar to re-enable camera access for Air-Sync.
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
            {cameraStatus !== "unsupported" && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                busy={isCheckingCamera}
                onClick={handleTestCamera}
              >
                Test Camera Access
              </Button>
            )}
          </div>
        </div>

        {/* Permission 4: Clipboard Access */}
        <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[var(--border-ink)] bg-[var(--bg-subtle)] text-[var(--text-primary)] shadow-[1px_1px_0px_var(--shadow-ink)] mt-0.5"
              aria-hidden="true"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
                />
              </svg>
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-black text-[var(--text-primary)]">System Clipboard</h4>
                {clipboardStatus !== "denied" && clipboardStatus !== "unsupported" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-ink)] bg-[var(--status-success-bg)] px-2 py-0.5 text-xs font-mono font-bold text-[var(--status-success-text)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-success-text)]" />
                    Available
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-ink)] bg-[var(--status-warning-bg)] px-2 py-0.5 text-xs font-mono font-bold text-[var(--status-warning-text)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                    Restricted
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-[var(--text-tertiary)] max-w-xl leading-relaxed">
                Copies financial summaries, AI markdown insights, and raw QR air-sync payloads to your system clipboard.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleTestClipboard}
            >
              Verify Copy
            </Button>
          </div>
        </div>

        {/* Permission 5: Local File System & Receipts */}
        <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[var(--border-ink)] bg-[var(--bg-subtle)] text-[var(--text-primary)] shadow-[1px_1px_0px_var(--shadow-ink)] mt-0.5"
              aria-hidden="true"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
                />
              </svg>
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-black text-[var(--text-primary)]">File System & Encrypted Backups</h4>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-ink)] bg-[var(--status-success-bg)] px-2 py-0.5 text-xs font-mono font-bold text-[var(--status-success-text)] shadow-[1px_1px_0px_var(--shadow-ink)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-success-text)]" />
                  Sandboxed (Safe)
                </span>
              </div>
              <p className="text-xs font-medium text-[var(--text-tertiary)] max-w-xl leading-relaxed">
                Vault exports (.zip / .kaban) and receipt media uploads use standard sandboxed browser dialogues. Kaban cannot read your disk outside selected files.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Local-First Privacy Guarantee Banner */}
      <div className="mt-5 rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--bg-subtle)] p-3.5 shadow-[2px_2px_0px_var(--shadow-ink)] flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border-ink)] bg-[var(--theme-subtle)] text-[var(--theme-subtle-text)] shadow-[1px_1px_0px_var(--shadow-ink)]">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
        </div>
        <div className="text-xs">
          <p className="font-bold text-[var(--text-primary)]">100% Local-First Device Privacy</p>
          <p className="text-[11px] font-medium text-[var(--text-tertiary)] mt-0.5">
            Kaban does not transmit camera feeds, notification payloads, or personal financial records to external servers. All permissions run strictly inside your local browser.
          </p>
        </div>
      </div>
    </SmokedCard>
  );
}
