# Application State Layer

## Overview
Coordinates storage dependency injection (`StorageContext`), Zustand UI/AI stores (`useUIStore`, `useAIStore`), theme DOM synchronization, onboarding status, entry draft building, and idempotent save workflows, alongside TanStack Query hooks and presentation ports.

## Subdirectories & Boundaries
- **[`./presentation/README.md`](./presentation/README.md)**: UI-toolkit-agnostic presentation context (`PresentationProvider`, `usePresentationComponents`, `WalletOverviewPanel`).
- **[`./queries/README.md`](./queries/README.md)**: TanStack React Query `queryKeys`, 10 query hooks, and 20 mutation hooks over `IStorageRepo` / `IFileStore`.

## Interface
- `VaultService`, `StorageServices`, `StorageProvider`, `useStorage(): StorageServices`: [StorageContext.tsx:StorageProvider] — Provides `repo`, `files`, `vault`, and `storageStatus` across the React tree.
- `parseMinorInput` (re-export), `EntryMode`, `EntryKind`, `ENTRY_FIELD_META`, `InvoiceLineDraft`, `EntryDraftInput`, `EntryDraft`, `buildEntryDraft(input)`: [entryDraft.ts:buildEntryDraft] — Validates form inputs and constructs Zod-parsed payloads for `EXPENSE`, `INCOME`, `TRANSFER`, `CASH_IN`, `SUBSCRIPTION`, `LOAN`, `INSTALLMENT`, and `INVOICE`.
- `EntrySaveProgress`, `saveEntryAndAttachment(progress, saveEntry, saveAttachment?)`: [entrySaveWorkflow.ts:saveEntryAndAttachment] — Saves an entry before its optional attachment with retry tracking.
- `parseStartingBalance(raw: string): number`, `restartOnboarding(storage)`, `markFirstBoot(storage)`: [onboarding.ts:restartOnboarding] — Onboarding flag and starting-balance helpers.
- `ThemeMode`, `AppThemeId`, `AppThemeConfig`, `ThemePreferences`, `APP_THEMES`, `getThemeConfig`, `resolveEffectiveMode`, `applyThemeToDom`, `getStoredThemePreferences`, `saveThemePreferences`: [theme.ts:applyThemeToDom] — Manages 7 app theme palettes, light/dark/system mode, and accessibility CSS classes/variables.
- `AIChatMessage`, `AIChatThread` (re-exports), `useAIStore`: [useAIStore.ts:useAIStore] — Zustand store managing AI modal/sidebar state, thread CRUD backed by `chatHistoryStorage`, rate-limit status, and `askBudgetQuestion`.
- `ThemeMode`, `AppThemeId` (re-exports), `NavTab`, `QuickAddMode`, `QuickAddPrefill`, `useUIStore`: [useUIStore.ts:useUIStore] — Zustand store managing `selectedMonth`, `activeNavTab`, modal flags, and theme preferences.

## Invariants
- `useStorage` throws if called outside `StorageProvider` [StorageContext.tsx:useStorage].
- `saveEntryAndAttachment` sets `progress.entrySaved = true` before invoking `saveAttachment`, preventing duplicate ledger entries on attachment retry [entrySaveWorkflow.ts:saveEntryAndAttachment].
- `useAIStore.askBudgetQuestion` persists the user message to the active thread before calling `IAIEngine.askWeeklyBudget` and refreshes rate-limit state afterward [useAIStore.ts:useAIStore].
- `useUIStore` synchronizes `activeNavTab` with URL hash fragments and theme changes with `applyThemeToDom` [useUIStore.ts:useUIStore].

## Side Effects
- Reads and dual-writes `localStorage` keys (`kaban_*` and legacy `kromaledger_*`) for onboarding, theme preferences, and active navigation tab [onboarding.ts:markFirstBoot], [theme.ts:saveThemePreferences], [useUIStore.ts:useUIStore].
- Mutates `document.documentElement` attributes (`data-theme`, `data-app-theme`), accessibility classes (`.dark`, `.high-contrast`, `.reduce-motion`, `.large-text`), CSS custom properties (`--theme-*`), `window.location.hash`, and `window.matchMedia("(prefers-color-scheme: dark)")` listeners [theme.ts:applyThemeToDom], [useUIStore.ts:useUIStore].

## Verification
- Run: `npm test`