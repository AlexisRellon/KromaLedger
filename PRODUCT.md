# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Independent professionals, freelancers, and privacy-conscious operators who manage personal and business cash flow, recurring subscriptions, and itemized client invoices without cloud lock-in.

## Product Purpose
Provide an uncompromisingly fast, local-first tracker for daily expenses, recurring subscriptions, and client invoices. Operates with zero remote tracking, zero account sign-up, and zero subscription fee to track subscriptions.

## Positioning
100% on-device, local-first financial ledger with deterministic offline math, a 3-second tactile numpad entry drawer, and an exportable IndexedDB vault archive (`kromaledger-vault-YYYY-MM-DD.zip`).

## Operating Context
Mobile-first Progressive Web App (PWA) with installable offline capabilities, floating dock navigation, glassmorphic dark interface, and tactile touch targets. Designed with a headless core pattern (zero DOM dependencies in calculations or state) for straightforward future portability to React Native/Expo.

## Capabilities and Constraints
- Local IndexedDB storage (`KromaLedgerDB`) via Dexie.js with persistent storage permission requests.
- Discrete attachment vault with WebP compression for receipts and invoice PDFs.
- Strict minor-unit integer arithmetic and date-only validation (zero floating-point drift).
- Single-transaction atomic backup and restore with archive validation.
- 100% exact version pinning and zero third-party telemetry.

## Brand Commitments
- Name: KromaLedger
- Brand Lockup: JetBrains Mono uppercase tracking-wider `KROMA` (pure white `#FFFFFF`) + `LEDGER` (muted silver `#A3A3A3`) + glowing Electric Volt dot (`#D9F938`).
- Aesthetic: Obsidian dark-mode canvas with subtle emerald/olive top aura, smoked glassmorphism (`backdrop-blur-md`, fine translucent borders), and high-contrast Electric Volt functional accents.
- Typography: Satoshi (body and UI labels), Cabinet Grotesk (display headings and headers), JetBrains Mono (monospaced currency amounts, tabular numbers, badges, and calculator numpad).

## Evidence on Hand
- Full portable core test suite with 43 passing Vitest tests.
- Operational PWA shell with dashboard, subscription hub, floating dock, and numpad drawer.
- Bundled self-hosted variable woff2 fonts (`public/fonts/`).

## Product Principles
1. **Local-First Absolute**: Data never leaves the device unless explicitly exported by the user as an encrypted/validated ZIP vault.
2. **Tactile 3-Second Input**: Adding daily entries requires zero cognitive friction—numpad drawer with inline math evaluation handles amounts in seconds.
3. **Deterministic Math**: Every minor unit calculation, invoice tax line, discount, and cash flow reconciliation is strictly deterministic.
4. **Headless Core**: UI logic and presentation remain decoupled from storage adapters and business algorithms.

## Accessibility & Inclusion
- High-contrast text on dark surfaces adhering to WCAG AA contrast standards.
- Tabular numeric alignment for all financial figures.
- Clear ARIA labels for icon-only actions and accessible touch targets (minimum 44x44px).
