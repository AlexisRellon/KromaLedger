import { useEffect, useState } from "react";
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
import { Button, ModalShell } from "../primitives";

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

  return (
    <ModalShell
      isOpen={true}
      onClose={onClose}
      title="Notifications & Reminders"
      subtitle={unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? "s" : ""}` : "All alerts caught up"}
      footer={
        notifications.length > 0 ? (
          <div className="flex items-center justify-between text-xs">
            <Button
              type="button"
              variant="subtle"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
            >
              Mark all read
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => clearNotifsMutation.mutate()}
            >
              Clear all
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-3">
        {/* Browser Permission Banner if not enabled */}
        {permission === "default" && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--theme-subtle)] p-3 text-xs shadow-[2px_2px_0px_var(--shadow-ink)]">
            <span className="font-semibold text-[var(--text-primary)]">Enable desktop browser alerts for subscription reminders</span>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleRequestPermission}
              className="shrink-0"
            >
              Enable
            </Button>
          </div>
        )}

        {/* Notification List */}
        <div className="space-y-2.5">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--bg-muted)] text-[var(--text-muted)] mb-3 shadow-[2px_2px_0px_var(--shadow-ink)]">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                  />
                </svg>
              </div>
              <p className="text-sm font-bold text-[var(--text-primary)]">No notifications</p>
              <p className="mt-1 text-xs text-[var(--text-muted)] max-w-xs">
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
                  className={`group relative flex cursor-pointer items-start gap-3 rounded-2xl p-3.5 transition-all ${
                    notif.read
                      ? "border border-[var(--border-divider)] bg-[var(--bg-card)] hover:border-[var(--border-ink)]"
                      : "border-2 border-[var(--border-ink)] bg-[var(--status-warning-bg,#FFFBEB)] shadow-[2px_2px_0px_var(--shadow-ink)]"
                  }`}
                >
                  {/* Status Indicator Icon */}
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-[var(--border-ink)] text-xs shadow-[1px_1px_0px_var(--shadow-ink)] ${
                      isWarning
                        ? "bg-[#FFE4E6] text-[#BE123C]"
                        : isAlert
                          ? "bg-[#FEF3C7] text-[#92400E]"
                          : isSuccess
                            ? "bg-[#D1FAE5] text-[#047857]"
                            : "bg-[#E0F2FE] text-[#0369A1]"
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
                      <p className={`text-xs font-bold ${notif.read ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)]"}`}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="h-2 w-2 rounded-full border border-[var(--border-ink)] bg-[#F59E0B]" title="Unread" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-tertiary)] leading-relaxed break-words">{notif.message}</p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-mono">
                      <span>{formattedDate}</span>
                      {notif.actionLink && (
                        <>
                          <span>•</span>
                          <span className="text-[var(--theme-accent-text)] font-bold hover:underline">Tap to view</span>
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
                      className="rounded-lg p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition cursor-pointer"
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
      </div>
    </ModalShell>
  );
}
