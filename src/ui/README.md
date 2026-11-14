# UI Layer

## Overview
React presentation layer implementing Kaban's neobrutalist design system, presentation context adapter, feature components, and top-level application screens over `../state` and `../core`.

## Subdirectories & Boundaries
- **[`./adapters/README.md`](./adapters/README.md)**: Web DOM implementation (`WebPresentationProvider`) of `state/presentation`'s `PresentationComponents` contract.
- **[`./primitives/README.md`](./primitives/README.md)**: Reusable design-system primitives (`SmokedCard`, `Button`, `Input`, `Select`, `Textarea`, `Toggle`, `FormField`, `ModalShell`, `ChartFrame`, `Skeleton`, `KabanMascot`, `FilipinoWeaveDefs`, `TactileEmptyState`).
- **[`./components/README.md`](./components/README.md)**: Interactive feature components (drawers, editors, `StackedWalletDeck`, `PhysicalWalletCard`, `TopStatusHeader`, `FloatingNavPill`, `AIAssistantModal`, `QrSyncPanel`, `BaulitoTour`) plus analytics and skeleton subpackages.
- **[`./screens/README.md`](./screens/README.md)**: Route-level screens (`HomeDashboard`, `WalletsScreen`, `PendingAndSubsHub`, `SettingsScreen`, `AnalyticsInsightsSection`, `VaultBackupModal`).