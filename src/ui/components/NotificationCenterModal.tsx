import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { format, parseISO } from "date-fns";
import type { AppNotification } from "../../core/models";
import {
  useClearNotifications,
  useDeleteNotification,
  useMarkNotificationRead,
  useNotifications,
} from "../../state/queries";
import { useUIStore } from "../../state/useUIStore";
import {
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  syncBrowserNotifications,
} from "../../adapters/notifications/notificationEngine";

export function NotificationCenterModal({ onClose }: { onClose: () => void }) {
  const notificationsQuery = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const deleteNotifMutation = useDeleteNotification();
  const clearNotifsMutation = useClearNotifications();
  const setTab = useUIStore((s) => s.setTab);

  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const [permission, setPermission] = useState(getBrowserNotificationPermission());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Sync to browser notifications if permission is granted
  useEffect(() => {
    if (notifications.length > 0) {
      syncBrowserNotifications(notifications);
    }
  }, [notifications]);

  const handleRequestPermission = async () => {
    const res = await requestBrowserNotificationPermission();
    setPermission(res);
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.read) {
      await markReadMutation.mutateAsync(notif.id);
    }
    if (notif.actionLink === "PENDING" || notif.entityType === "SUBSCRIPTION" || notif.entityType === "INVOICE") {
      setTab("PENDING");
      onClose();
    }
  };

  const handleMarkAllRead = async () => {
    for (const n of notifications.filter((item) => !item.read)) {
      await markReadMutation.mutateAsync(n.id);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm animate-entrance"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Notification Center"
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#11120f] shadow-2xl"
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-white/[0.08] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.05] text-[#D9F938]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                />
              </svg>
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white">Notifications & Reminders</h2>
              <p className="text-xs text-neutral-400">
                {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? "s" : ""}` : "All alerts caught up"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close notifications"
            className="rounded-full p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Browser Permission Banner if not enabled */}
        {permission === "default" && (
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] bg-[#D9F938]/[0.05] px-5 py-2.5 text-xs">
            <span className="text-neutral-300">Enable desktop browser alerts for subscription reminders</span>
            <button
              onClick={handleRequestPermission}
              className="shrink-0 rounded-full bg-[#D9F938] px-2.5 py-1 font-semibold text-black hover:bg-[#c8e827] transition"
            >
              Enable
            </button>
          </div>
        )}

        {/* Quick Actions Bar */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-2 text-xs">
            <button
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              className="text-neutral-400 hover:text-[#D9F938] disabled:opacity-40 transition"
            >
              Mark all as read
            </button>
            <button
              onClick={() => clearNotifsMutation.mutate()}
              className="text-neutral-500 hover:text-rose-400 transition"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04] p-2 sm:p-3">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-neutral-500 mb-3">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-white">No notifications</p>
              <p className="mt-1 text-xs text-neutral-500 max-w-xs">
                Subscription reminders, insufficient balance warnings, and pending alerts will appear here.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const isWarning = notif.type === "WARNING";
              const isAlert = notif.type === "ALERT";
              const isSuccess = notif.type === "SUCCESS";

              let formattedDate = notif.createdAt;
              try {
                formattedDate = format(parseISO(notif.createdAt), "MMM d, yyyy");
              } catch {
                // Keep raw string
              }

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`group relative flex cursor-pointer items-start gap-3 rounded-2xl p-3 sm:p-3.5 transition ${
                    notif.read ? "bg-transparent hover:bg-white/[0.02]" : "bg-white/[0.04] hover:bg-white/[0.06]"
                  }`}
                >
                  {/* Status Indicator Icon */}
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${
                      isWarning
                        ? "bg-rose-500/15 text-rose-400"
                        : isAlert
                          ? "bg-amber-500/15 text-amber-300"
                          : isSuccess
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-[#007DFE]/15 text-[#007DFE]"
                    }`}
                  >
                    {isWarning ? (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                      </svg>
                    ) : isAlert ? (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                    ) : (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-2">
                      <p className={`text-xs font-semibold ${notif.read ? "text-neutral-300" : "text-white"}`}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#D9F938]" title="Unread" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-neutral-400 leading-relaxed break-words">{notif.message}</p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-neutral-500 font-mono">
                      <span>{formattedDate}</span>
                      {notif.actionLink && (
                        <>
                          <span>•</span>
                          <span className="text-[#D9F938] font-medium hover:underline">Tap to view</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotifMutation.mutate(notif.id);
                      }}
                      title="Dismiss notification"
                      className="rounded-lg p-1 text-neutral-500 hover:text-neutral-300 hover:bg-white/10 transition"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>,
    document.body
  );
}
