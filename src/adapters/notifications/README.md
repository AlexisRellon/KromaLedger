# Notification Adapters

## Overview
Bridges in-app `AppNotification` records to the browser Web Notifications API with per-session deduplication.

## Interface
- `isBrowserNotificationSupported(): boolean`: [notificationEngine.ts:isBrowserNotificationSupported] — Checks if `window.Notification` is available.
- `getBrowserNotificationPermission(): NotificationPermission | "unsupported"`: [notificationEngine.ts:getBrowserNotificationPermission] — Returns current browser notification permission state.
- `requestBrowserNotificationPermission(): Promise<NotificationPermission | "unsupported">`: [notificationEngine.ts:requestBrowserNotificationPermission] — Prompts the user for Web Notification permission.
- `dispatchBrowserNotification(alert: AppNotification): void`: [notificationEngine.ts:dispatchBrowserNotification] — Fires a single browser notification if supported, granted, and not yet shown in this session.
- `syncBrowserNotifications(notifications: AppNotification[]): void`: [notificationEngine.ts:syncBrowserNotifications] — Dispatches up to 3 unseen unread notifications per call.

## Invariants
- Tracks shown notification IDs in `sessionStorage` under `kaban_shown_browser_notifications` (reading legacy `kromaledger_shown_browser_notifications` as fallback) to prevent duplicate OS alerts in the same session [notificationEngine.ts:dispatchBrowserNotification].
- Never constructs a browser `Notification` unless `Notification.permission === "granted"` [notificationEngine.ts:dispatchBrowserNotification].
- `syncBrowserNotifications` caps batch dispatch to `unreadAlerts.slice(0, 3)` per invocation [notificationEngine.ts:syncBrowserNotifications].

## Side Effects
- Reads and writes `sessionStorage` (`kaban_shown_browser_notifications`) [notificationEngine.ts:dispatchBrowserNotification].
- Calls `Notification.requestPermission()` and instantiates `new Notification(alert.title, ...)` [notificationEngine.ts:requestBrowserNotificationPermission], [notificationEngine.ts:dispatchBrowserNotification].

## Verification
- Run: `npm test`