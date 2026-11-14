# Skeleton UI Components

## Overview
Provides screen-matched neobrutalist loading skeleton layouts (`DashboardSkeleton`, `WalletsSkeleton`, `PendingSkeleton`, `SettingsSkeleton`) and a tab router (`ScreenSkeleton`) used during bootstrap and lazy route Suspense fallbacks.

## Interface
- `DashboardSkeleton()`: [DashboardSkeleton.tsx:DashboardSkeleton] — Loading placeholder mirroring `HomeDashboard`.
- `PendingSkeleton()`: [PendingSkeleton.tsx:PendingSkeleton] — Loading placeholder mirroring `PendingAndSubsHub`.
- `SettingsSkeleton()`: [SettingsSkeleton.tsx:SettingsSkeleton] — Loading placeholder mirroring `SettingsScreen`.
- `WalletsSkeleton()`: [WalletsSkeleton.tsx:WalletsSkeleton] — Loading placeholder mirroring `WalletsScreen`.
- `ScreenSkeleton({ tab = "HOME" }: { tab?: NavTab })`: [ScreenSkeleton.tsx:ScreenSkeleton] — Dispatches to the matching screen skeleton for `"HOME"`, `"WALLETS"`, `"PENDING"`, or `"SETTINGS"`.
- Re-exports all five skeleton components from `index.ts`: [index.ts:ScreenSkeleton].

## Invariants
- `ScreenSkeleton` falls back to `DashboardSkeleton` when `tab` is `"HOME"` or unrecognized [ScreenSkeleton.tsx:ScreenSkeleton].

## Side Effects
- None

## Verification
- Run: `npm test`