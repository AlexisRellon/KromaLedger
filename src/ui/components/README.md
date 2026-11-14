# Feature UI Components

## Overview
Domain-aware interactive modals, drawers, cards, navigation chrome, QR Air-Sync panels, onboarding tour, and PH institution brandmark/card visualizers, plus specialized analytics and skeleton component subdirectories.

## Subdirectories & Boundaries
- **[`./analytics/README.md`](./analytics/README.md)**: Bento analytics cards (`CommittedWaterfallCard`, `FeeLeakageAndPayoffRow`, `InvoiceAgingAndTaxCard`, `WalletShortfallAlertCard`).
- **[`./skeletons/README.md`](./skeletons/README.md)**: Route and card loading skeletons (`DashboardSkeleton`, `WalletsSkeleton`, `PendingSkeleton`, `SettingsSkeleton`, `ScreenSkeleton`).

## Interface
- **Entry & Modal Editors**: `QuickAddDrawer` [QuickAddDrawer.tsx:QuickAddDrawer], `EditEntryModal` [EditEntryModal.tsx:EditEntryModal], `EditInvoiceModal` [EditInvoiceModal.tsx:EditInvoiceModal], `EditSubscriptionModal` [EditSubscriptionModal.tsx:EditSubscriptionModal], `EditProfileModal` (`CURRENCIES`, `THEME_COLORS`) [EditProfileModal.tsx:EditProfileModal], `ConfirmDeleteModal` [ConfirmDeleteModal.tsx:ConfirmDeleteModal], `LineItemBuilder` (`LineDraft`) [LineItemBuilder.tsx:LineItemBuilder], `CustomLabelPicker` (`mergeCustomLabel`) [CustomLabelPicker.tsx:CustomLabelPicker].
- **Wallets, Cards & PH Institutions**: `StackedWalletDeck` [StackedWalletDeck.tsx:StackedWalletDeck], `PhysicalWalletCard` (`WALLET_PATTERNS`, `resolveWalletPattern`, `formatCardNumber`, `getCardExpiry`, `getNetworkBadge`, `YakanWeavePatternPaths`, `IbaloiWeavePatternPaths`, `WalletPatternDefs`, `WeaveVariant`) [PhysicalWalletCard.tsx:PhysicalWalletCard], `WalletFormModal` (`WALLET_TYPES`, `WALLET_PALETTES`, `hexToRgb`, `getWalletPalette`) [WalletFormModal.tsx:WalletFormModal], `WalletActivity` [WalletActivity.tsx:WalletActivity], `ActivityFilters` [ActivityFilters.tsx:ActivityFilters], `useActivityCollapse` [useActivityCollapse.ts:useActivityCollapse], `WalletTypeIcon` (`CashIcon`, `BankIcon`, `EWalletIcon`, `CryptoIcon`, `CreditCardIcon`, `OtherVaultIcon`) [WalletTypeIcon.tsx:WalletTypeIcon], `InstitutionBrandmark` (`PH_INSTITUTIONS`, `getLogoDevUrl`, `matchPhInstitution`, `resolveCardNetwork`) [phInstitutionLogos.tsx:InstitutionBrandmark].
- **Chrome, AI, Notifications, Sync & Onboarding**: `TopStatusHeader` [TopStatusHeader.tsx:TopStatusHeader], `FloatingNavPill` [FloatingNavPill.tsx:FloatingNavPill], `FrontPageHero` [FrontPageHero.tsx:FrontPageHero], `CashflowBreakdownGraph` (`Timeframe`) [CashflowBreakdownGraph.tsx:CashflowBreakdownGraph], `AIAssistantModal` [AIAssistantModal.tsx:AIAssistantModal], `MarkdownRenderer` [MarkdownRenderer.tsx:MarkdownRenderer], `NotificationCenterModal` [NotificationCenterModal.tsx:NotificationCenterModal], `QrSyncPanel` [QrSyncPanel.tsx:QrSyncPanel], `AppPermissionsSection` [AppPermissionsSection.tsx:AppPermissionsSection], `BaulitoTour` [BaulitoTour.tsx:BaulitoTour], `OnboardingPractice` [OnboardingPractice.tsx:OnboardingPractice].

## Invariants
- `QuickAddDrawer` and `EditEntryModal` validate attachments against `attachmentMimeTypeSchema`, auto-detect PH transfer fees via `detectTransferFee`, and preserve idempotent saves via `saveEntryAndAttachment` [QuickAddDrawer.tsx:QuickAddDrawer], [EditEntryModal.tsx:EditEntryModal].
- `FloatingNavPill` observes DOM `[role="dialog"]` presence via `MutationObserver` and hides whenever a modal dialog is open [FloatingNavPill.tsx:FloatingNavPill].
- `EditSubscriptionModal` dispatches a manual cycle payment (`useConfirmSubscriptionPayment`) only when `!hasChanges && active && walletId`; `CustomLabelPicker` deduplicates `#`-prefixed tags case-insensitively [EditSubscriptionModal.tsx:EditSubscriptionModal], [CustomLabelPicker.tsx:mergeCustomLabel].
- `QrSyncPanel` stops the camera stream automatically once `QrStreamAssembler` reaches 100% completion [QrSyncPanel.tsx:QrSyncPanel].

## Side Effects
- Renders portal modals (`createPortal` to `document.body`), attaches `ResizeObserver` / `MutationObserver` / `requestAnimationFrame` / `keydown` listeners, and dynamically imports `qrcode` and `jsqr` [AIAssistantModal.tsx:AIAssistantModal], [QuickAddDrawer.tsx:QuickAddDrawer], [FloatingNavPill.tsx:FloatingNavPill], [QrSyncPanel.tsx:QrSyncPanel].
- Invokes browser permissions/media APIs (`navigator.mediaDevices.getUserMedia`, `Notification`, `navigator.storage`, `navigator.clipboard`), syncs notifications via `syncBrowserNotifications`, and triggers `location.reload()` after ZIP onboarding restore or Air-Sync reload [AppPermissionsSection.tsx:AppPermissionsSection], [NotificationCenterModal.tsx:NotificationCenterModal], [BaulitoTour.tsx:BaulitoTour], [QrSyncPanel.tsx:QrSyncPanel].

## Verification
- Run: `npm test`