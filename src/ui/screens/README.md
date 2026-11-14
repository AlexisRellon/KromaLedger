# Application Screens

## Overview
Top-level screen views and full-page modal containers composing `state/queries`, `core/engine`, `ui/components`, and `ui/primitives` for the Dashboard, Wallets, Commitments/Pending, Settings, Analytics Insights, and Vault Backup workflows.

## Interface
- `useAnalyticsInsightsData`, `AnalyticsInsightsSection` (plus re-exports of the 4 analytics cards): [AnalyticsInsightsSection.tsx:AnalyticsInsightsSection] — Computes 5 monthly analytics models (fee leakage, committed waterfall, payoff horizons, per-wallet liquidity, invoice aging) and renders the Bento grid.
- `DashboardViewMode`, `HomeDashboard`: [HomeDashboard.tsx:HomeDashboard] — Main ledger dashboard with `FrontPageHero`, `dailyInsight` banner, 3-way view switcher (`ALL` | `CORE` | `ANALYTICS`), cashflow forecast card, activity feed with attachment preview, `CashflowBreakdownGraph`, `StackedWalletDeck`, burn donut, and category breakdown.
- `PendingAndSubsHub`: [PendingAndSubsHub.tsx:PendingAndSubsHub] — 7-day upcoming due list with confirm/postpone actions, fixed commitments donut, segmented Installments & Loans vs. Trade Invoices tabs, `InvoicePaymentModal`, and embedded `AnalyticsInsightsSection`.
- `WalletsScreen`: [WalletsScreen.tsx:WalletsScreen] — `WalletOverviewPanel`, `StackedWalletDeck`, accounts list, selected card inspector, `WalletActivity`, and wallet/entry CRUD modals.
- `SettingsScreen`: [SettingsScreen.tsx:SettingsScreen] — Local profile summary, light/dark/system mode and 7-theme palette switcher, accessibility toggles, wallet management, `AppPermissionsSection`, tour replay, and Danger Zone (reset to demo / factory wipe requiring `"DELETE"` confirmation).
- `VaultBackupModal`: [VaultBackupModal.tsx:VaultBackupModal] — Tabbed `QR Air-Sync` (`QrSyncPanel`) and `ZIP File Archive` export/restore modal with optional pre-restore safety ZIP download.

## Invariants
- `SettingsScreen` factory wipe (`CLEAR`) remains disabled until the user types `"DELETE"` verbatim [SettingsScreen.tsx:SettingsScreen].
- `HomeDashboard` selects `"CORE"` view by default below `1024px` viewport width unless `defaultViewMode` is provided, and waits until all 5 queries succeed before rendering `dailyInsight` [HomeDashboard.tsx:HomeDashboard].
- `PendingAndSubsHub` guards `confirmPayment` against missing linked wallets or insufficient wallet balance before invoking `useConfirmSubscriptionPayment` [PendingAndSubsHub.tsx:PendingAndSubsHub].

## Side Effects
- Renders portal status toasts and attachment/entry/backup modals into `document.body` (`createPortal`), loads attachment Object URLs via `attachmentCache.getOrLoad`, schedules a midnight `setTimeout` rollover for `today`, and triggers browser ZIP downloads or `location.reload()` after ZIP restore [HomeDashboard.tsx:HomeDashboard], [SettingsScreen.tsx:SettingsScreen], [WalletsScreen.tsx:WalletsScreen], [VaultBackupModal.tsx:VaultBackupModal].

## Verification
- Run: `npm test`