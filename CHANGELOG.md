# Changelog

All notable changes to KromaLedger (Kaban) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2026-11-15
<!-- cta: Open Wallets | WALLETS -->

### Fixed
- Disallow automated savings interest rules and accrued previews on `CASH` (Cash on hand) wallets in UI and `interestEngine`.
- Fixed low-contrast label text on the `"Enable automated interest posting"` checkbox in `WalletInterestSettings` and `BaulitoMissedDaysModal` using theme foreground variables.

### Added
- App version (`v1.1.1`) and author copyright footer at the bottom of `SettingsScreen`.

## [1.1.0] - 2026-11-15
<!-- cta: Explore Bank Interest | WALLETS -->

### Added
- **Automated PH Digital Bank Interest Posting**: Built-in interest presets for MariBank, Maya Bank, GoTyme Bank, CIMB Bank, and OwnBank with editable custom tiers, promo boosts, 20% withholding tax, and payout frequency (`DAILY` / `MONTHLY`).
- **Midnight `Asia/Manila` (`UTC+8`) Catch-Up**: Deterministic interest calculation using `BigInt` fixed-point math (`src/core/engine/interestEngine.ts`) with in-window recalculation and non-ledger monthly accrued previews on wallet cards.
- **Estimated to Verified Receipt Control**: Auto-posted `INTEREST` entries start as `Estimated` and can be verified against bank receipts inline or in `EditEntryModal`, atomically reconciling wallet balances without inflating `totalInflowMinor`.
- **Baulito Missed-Days Reminder**: `BaulitoMissedDaysModal` prompts users on app open after multi-day absences to log missed transactions before automated interest runs.
- **App Update Changelog Modal & Notification CTA**: `AppUpdateModal` and `SYSTEM` changelog notifications in `NotificationCenterModal` with direct navigation to the new feature.
- **Storage & Vault Support**: `KabanDB` schema `v6` (`interestRules` store) and ZIP/QR vault export/restore support.

## [1.0.0] - 2026-11-14

### Added
- Initial local-first personal financial vault release with wallets, ledger entries, commitments & pending tracking, cashflow analytics, Baulito onboarding tour, and encrypted ZIP/QR vault backup.
