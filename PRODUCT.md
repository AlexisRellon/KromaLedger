# Product: Kaban

<!-- impeccable:product-schema 1 -->

## Platform

Web (Mobile-first Progressive Web App, PWA)

## Users

Freelancers, independent contractors, micro-business owners, and privacy-conscious operators who manage personal and business cash flow, recurring subscriptions, physical wallets, and itemized invoices without cloud subscriptions or surveillance.

## Product Purpose

Provide an uncompromisingly fast, local-first personal financial vault. Operates with zero remote tracking, zero account sign-up, zero external servers, and zero subscription fees to track subscriptions. Data lives entirely on the user's device.

## Positioning

100% on-device, local-first financial ledger with deterministic integer math, a 3-second tactile numpad entry drawer, multi-wallet balance tracking, and an exportable IndexedDB vault archive (`kromaledger-vault-YYYY-MM-DD.zip`). 

## Operating Context

Mobile-first Progressive Web App (PWA) with offline execution, floating dock navigation, tactile neobrutalist cream paper interface, and physical touch targets. Built with a decoupled headless core (`src/core/` and `src/state/` have zero DOM or browser dependencies) ready for seamless portability to native mobile (React Native / Expo).

## Capabilities and Constraints

- **Local Storage Sovereign**: Local IndexedDB storage engine (`KromaLedgerDB`) via Dexie.js with persistent storage permission requests (`navigator.storage.persist()`). Database identifier maintained for full backwards-compatibility.
- **Discrete Attachment Vault**: WebP image compression for receipts and invoice PDFs stored in an isolated `attachments` object store to guarantee instant query performance.
- **Deterministic Math**: Strict minor-unit integer arithmetic (centavos/cents) and date-only ISO validation to eliminate floating-point drift.
- **Atomic Backup & Restore**: Single-transaction full-archive export and atomic restore with checksum validation (`kromaledger-vault-YYYY-MM-DD.zip`).
- **Subscription Boot Reconciler**: Automatic detection and chronological backfilling of recurring charges upon application boot.
- **Dynamic Cashflow Analytics**: Real-time net outflow calculations, burn rate meters, fixed vs. variable spending breakdown, and upcoming obligation schedules.
- **Physical Wallets Deck**: Support for tracking multiple physical accounts (cash, bank, e-wallets) with live balances and transfer fees.
- **Supply-Chain Guardrails**: 100% exact dependency pinning, `.npmrc` script restrictions (`ignore-scripts=true`), and zero third-party telemetry or network runtime analytics.

## Brand Identity & Visual Language

- **Name**: **Kaban** (Filipino for family treasure trunk / heirloom vault)
- **Brand Lockup**: Kaban Chest SVG icon (gold `#FBBF24` / `#F59E0B` with plum `#4A154B` straps and ink outline) + `KABAN` wordmark in bold display typography.
- **Aesthetic**: Neobrutalist paper aesthetic—warm cream paper `#FAF8F5`, 2px solid charcoal ink outlines `#18181B`, punchy hard offset shadows (`3px 3px 0px #18181B`), royal plum `#4A154B`, lavender `#EDE9FE`, gold chest accents, fresh mint `#10B981`, and rose `#F43F5E`.
- **Typography Stack**:
  - *Brand Accent*: **Dangwa** (Aaron Amar, Manila; inspired by Filipino public utility jeepney hand-painted signs; 100% free for commercial & personal use).
  - *Display Headings*: **Bantayog** (Jad Maza, 2020; inspired by Philippine historical markers; single-user free license, web embedding permitted via local `@font-face`).
  - *Body Text*: **Satoshi** (Indian Type Foundry; modern grotesque; free commercial license).
  - *Financial Numerics*: **JetBrains Mono** (SIL OFL; monospaced tabular numerals for all currency amounts, calculator numpads, and dates).
- **Self-Hosted Offline Runtime**: All font files bundled locally in `public/fonts/`. No external CDN or web font runtime requests.

## Evidence on Hand

- Passing automated Vitest test suites covering core calculations, invoice math, reconcilers, cashflow analytics, and payment workflows.
- Fully functional PWA shell with dashboard, physical wallet deck, quick-add drawer, and floating dock navigation.
- Verified local font assets (`.woff2` and `.otf`) with authentic licensing provenance recorded.

## Product Principles

1. **Local-First Sovereignty**: Financial data never leaves the device unless explicitly exported as a ZIP vault archive by the user.
2. **Tactile 3-Second Input**: Creating transactions requires minimal cognitive friction—numpad drawer with inline arithmetic evaluation captures entries in seconds.
3. **Deterministic Math**: Every minor unit calculation, invoice tax line, discount, convenience fee, and cashflow reconciliation is strictly deterministic and test-backed.
4. **Headless Decoupling**: Business algorithms and state orchestration remain strictly decoupled from DOM, browser, and storage adapters.
5. **Cultural Tangibility**: The interface honors Philippine craftsmanship and material culture through tactile paper neobrutalism, warm colors, and authentic local typography.

## Accessibility & Inclusion

- High contrast text on paper surfaces adhering to WCAG 2.1 AA standards.
- Tabular numeric alignment (`font-mono tabular-nums`) for all monetary amounts and balance meters.
- Clear ARIA labels for icon-only actions and accessible touch targets (minimum 44x44px).
- Robust keyboard navigation and Escape-key dialog dismissals across all modals.
