import type { AppNotification } from "../../core/models";

const SHOWN_BROWSER_NOTIFS_KEY = "kromaledger_shown_browser_notifications";

function getShownIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SHOWN_BROWSER_NOTIFS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function markShownId(id: string): void {
  try {
    const ids = getShownIds();
    ids.add(id);
    sessionStorage.setItem(SHOWN_BROWSER_NOTIFS_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // Ignore storage errors
  }
}

export function isBrowserNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getBrowserNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isBrowserNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!isBrowserNotificationSupported()) return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function dispatchBrowserNotification(title: string, options?: NotificationOptions): boolean {
  if (!isBrowserNotificationSupported() || Notification.permission !== "granted") {
    return false;
  }
  try {
    new Notification(title, {
      icon: "/favicon.ico",
      ...options,
    });
    return true;
  } catch {
    return false;
  }
}

export function syncBrowserNotifications(notifications: AppNotification[]): void {
  if (!isBrowserNotificationSupported() || Notification.permission !== "granted") {
    return;
  }
  const shown = getShownIds();
  const unreadAlerts = notifications.filter((n) => !n.read && !shown.has(n.id));

  for (const n of unreadAlerts.slice(0, 3)) {
    const dispatched = dispatchBrowserNotification(n.title, {
      body: n.message,
      tag: n.id,
    });
    if (dispatched) {
      markShownId(n.id);
    }
  }
}
