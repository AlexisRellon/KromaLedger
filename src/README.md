# Source Root (`src`)

## Overview
Entrypoint and top-level application shell for Kaban (KromaLedger), wiring `WebBootstrap` persistence initialization, `WebPresentationProvider`, `App` tab routing, lazy-loaded modals/screens, and Vite client ambient types.

## Subdirectories & Boundaries
- **[`./core/README.md`](./core/README.md)**: Platform-agnostic domain models, port interfaces (`IStorageRepo`, `IFileStore`, `IAIEngine`), and financial calculation/reconciliation engines.
- **[`./adapters/README.md`](./adapters/README.md)**: Concrete browser/Dexie IndexedDB persistence (`WebBootstrap`, `DexieStorageRepo`, `DexieFileStore`), Netlify Gemma AI client, QR/ZIP backup codecs, and Web Notifications engine.
- **[`./state/README.md`](./state/README.md)**: `StorageContext`, Zustand stores (`useUIStore`, `useAIStore`), theme DOM synchronization, entry draft/save workflows, `presentation` port, and `queries` hooks.
- **[`./ui/README.md`](./ui/README.md)**: React DOM presentation layer (`WebPresentationProvider`, `primitives`, `components`, `screens`).

## Interface
- `App()`: [App.tsx:App] — Top-level application shell switching between `HomeDashboard`, `WalletsScreen`, `PendingAndSubsHub`, and `SettingsScreen`, rendering `BaulitoTour` while onboarding is `"pending"`, and lazily mounting `QuickAddDrawer`, `VaultBackupModal`, `EditProfileModal`, `NotificationCenterModal`, and `AIAssistantModal`.
- Application DOM mount: [main.tsx:main.tsx] — Mounts `<React.StrictMode><WebBootstrap><WebPresentationProvider><App /></WebPresentationProvider></WebBootstrap></React.StrictMode>` onto `#root` and imports `./index.css`.
- Vite ambient types: [vite-env.d.ts:vite-env.d.ts] — Declares `/// <reference types="vite/client" />`.

## Invariants
- `App` renders `BaulitoTour` exclusively when `localStorage` key `kaban_onboarding` (or legacy `kromaledger_onboarding`) equals `"pending"`, and hides the month selector on `"SETTINGS"` and `"WALLETS"` tabs [App.tsx:App].
- `main.tsx` enforces provider nesting order (`WebBootstrap` outside `WebPresentationProvider` outside `App`) so storage and presentation contexts are initialized before screen rendering [main.tsx:main.tsx].

## Side Effects
- Reads and writes `kaban_onboarding` / `kromaledger_onboarding` in `localStorage` and switches `useUIStore` tab on onboarding start/reset [App.tsx:App].
- Calls React `createRoot(document.getElementById("root")!).render(...)` on module evaluation [main.tsx:main.tsx].

## Verification
- Run: `npm test`