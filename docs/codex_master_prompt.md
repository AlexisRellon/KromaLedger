# MASTER PROMPT: Kaban — Local-First Financial Vault & Ledger

## 0. AGENT SKILL ACTIVATION & ORCHESTRATION DIRECTIVES

You are the **Lead Architect & Orchestrator** for **Kaban** (`kromaledger`). Before writing any application code, you MUST activate and strictly follow your loaded skills:

1. **`superpowers`**:
   * Enforce `brainstorming` / `writing-plans` to validate the implementation plan before touching code.
   * Enforce `test-driven-development` (TDD): Every core calculation, reconciler rule, and storage adapter method must have failing unit tests written BEFORE implementation.
   * Enforce `subagent-driven-development` & `dispatching-parallel-agents`: Decompose the build into isolated workstreams and spawn dedicated subagents with strict directory ownership.
   * Enforce `verification-before-completion`: Run typechecks (`tsc --noEmit`), dependency lock checks (`npm run verify:lock`), unit test suites (`vitest run`), portability checks (`node scripts/verify-portability.mjs`), and production builds (`npm run build`) before declaring any task complete.

2. **`ponytail`**:
   * Maintain structured task tracking, clean context handoffs between subagents, atomic changes, and deterministic execution state across phases.

---

## 1. BRANDING, IDENTITY & ARCHITECTURAL CONSTRAINTS

* **App Name**: **Kaban** (formerly KromaLedger)
* **Brand Metaphor**: Traditional Filipino wooden or iron-bound treasure chest/vault for family heirlooms, land titles, and private savings.
* **Package / Repo Slug**: `kromaledger` (preserved for package and tool consistency)
* **Local IndexedDB Database Name**: `KromaLedgerDB` (strictly maintained for backwards-compatibility so users never lose on-device data)
* **Backup Archive Prefix**: `kromaledger-vault-YYYY-MM-DD.zip` (strictly maintained for archive compatibility)
* **Header / Logo Lockup**:
  * Vault Emblem: High-contrast neobrutalist treasure chest SVG with gold/amber body (`#FBBF24` / `#F59E0B`), plum straps (`#4A154B`), and 1.5px ink outline.
  * Typography: `KABAN` rendered in bold display typography (`font-display font-black text-neutral-900`) accompanied by a monospace pill badge `Vault` (`bg-[#EDE9FE] text-neutral-900 border border-neutral-900 font-mono font-bold`).

### Architectural Pillars
Build a **100% Local-First, Mobile-First Progressive Web App (PWA)** for tracking **Daily Expenses, Recurring Subscriptions, Itemized Invoices (Payables & Receivables), and Physical Wallets**.
* **Zero Cloud Dependency**: No remote backend, no auth wall, no external telemetry or network API calls. All data lives on-device inside `KromaLedgerDB`.
* **React Native (Expo) Port-Ready ("Headless Core" Pattern)**:
  * **Strict Portability**: `src/core/` and `src/state/` MUST contain ZERO DOM, `window`, `document`, or `dexie` imports.
  * All UI components interact with local storage exclusively through **TanStack Query (`useQuery` / `useMutation`)** calling an injected `IStorageRepo` interface (never `useLiveQuery` directly inside React components).
  * Enforced continuously by `node scripts/verify-portability.mjs`.
* **Progressive Disclosure UX ("3-Second Entry")**:
  * Adding an entry requires only **Amount**, **Title/Merchant**, and **Item Type** (`Expense | Subscription | Invoice | Transfer`) on the primary tactile drawer, with progressive sheets for line items, taxes/discounts, convenience fees, and receipt attachments.

---

## 2. TECH STACK & DETERMINISTIC DEPENDENCY GUARDRAILS

* **Framework & Build**: Vite + **React 19** (`react` & `react-dom` pinned to exact stable 19.x release) + TypeScript (Strict Mode).
  * *React 19 Portability Rule*: Leverage React 19 ref-as-prop and client hooks, but DO NOT use Server Actions (`"use server"`) so 100% of state logic ports directly to React Native.
* **Styling**: Tailwind CSS configured with Neobrutalist design tokens and utilities (`.neo-box`, `.neo-box-sm`, `.neo-box-lg`, `.neo-btn-interactive`).
* **Typography Stack**:
  * `Dangwa` (`.font-brand`): Brush typeface by Aaron Amar (Manila, Philippines), 100% free for commercial & personal use. Used for brand accents and decorative headers.
  * `Bantayog` (`.font-display`): Rough monument display typeface by Jad Maza (© 2020), single-user free license, web embedding permitted via local `@font-face`. Used for display headings and hero metrics.
  * `Satoshi` (`.font-sans`): Clean grotesque body text by Indian Type Foundry (free commercial license).
  * `JetBrains Mono` (`.font-mono`, `.tabular-nums`): Monospaced tabular numerals for all financial figures, keypad buttons, and timestamps.
  * *Font Loading Constraint*: All fonts are strictly self-hosted in `public/fonts/`. No external CDN font requests allowed.
* **State & Async Reactivity**:
  * `TanStack Query v5` (`@tanstack/react-query`) for reactive DB reads/writes and cache invalidation.
  * `Zustand` for ephemeral UI state (active month filter, numpad buffer, active drawer tab).
* **Local Storage Adapter (Web)**:
  * `Dexie.js` (IndexedDB) initialized as `new Dexie('KromaLedgerDB')`.
  * `browser-image-compression` + IndexedDB `Blob` for storing receipt photos & invoice PDFs inside a dedicated `attachments` store (never bloat transaction list queries with raw blobs).
  * `navigator.storage.persist()` triggered on boot to protect local storage from browser eviction.
* **Validation & Date Math**: `Zod` + `React Hook Form` + `date-fns`
* **Testing**: `Vitest` + `fake-indexeddb` (for testing Dexie adapters headlessly).

### STRICT SUPPLY-CHAIN & VERSION-LOCK POLICY (MANDATORY GUARDRAILS)
1. **100% Exact Version Pinning**:
   * Set `"name": "kromaledger"` and `"private": true` in `package.json`.
   * Every single dependency and devDependency in `package.json` MUST use an exact semantic version (e.g., `"19.1.0"`, NEVER `"^19.1.0"`, `"~19.1.0"`, `"*"`, or `"latest"`).
2. **Hardened `.npmrc` Configuration**:
   * Root `.npmrc` enforces:
     ```ini
     save-exact=true
     engine-strict=true
     ignore-scripts=true
     audit-level=critical
     ```
   * `ignore-scripts=true` blocks arbitrary lifecycle scripts during package installation.
3. **Immutable Lockfile Policy**:
   * `package.json` and `package-lock.json` are frozen. No unrequested package additions or version bumps.
   * All automated CI installs must use `npm ci` to verify cryptographic SHA-512 lockfile integrity.
4. **Automated Lock Verification Script (`scripts/verify-lock.mjs`)**:
   * Enforced via `"verify:lock": "node scripts/verify-lock.mjs"`. Exits with code `1` if any dependency starts with `^`, `~`, `>`, `<`, `*`, or unpinned ranges.

---

## 3. DESIGN SYSTEM: "TACTILE PAPER & NEOBRUTALIST HERITAGE"

Follow the visual language specified in [`DESIGN.md`](file:///DESIGN.md) and [`docs/ui-components.md`](file:///docs/ui-components.md):

* **Canvas Base**: Cream Paper `#FAF8F5` (`bg-[#FAF8F5] text-neutral-900`) with subtle 28px graph paper grid texture.
* **Surface Containers**: Solid white `#FFFFFF` cards with 2px solid charcoal ink borders (`border-2 border-neutral-900`) and hard offset shadows (`shadow-[3px_3px_0px_#18181B]`).
* **Brand Lockup**:
  ```tsx
  <BrandLogo />
  ```
* **Primary Interactive Button**: Royal Plum `#4A154B` (`bg-[#4A154B] text-white hover:bg-[#3B0764] active:bg-[#2E0854]`) with 2px ink border and tactile 3px hard offset shadow.
* **Secondary / Subtle Button**: Lavender `#EDE9FE` (`bg-[#EDE9FE] text-neutral-900 hover:bg-[#DDD6FE]`).
* **Accent Warm Amber / Gold**: `#F59E0B` / `#FBBF24` for quick-add drawer save actions, warning badges, and brand highlights.
* **Semantic Status Colors**:
  * Receivable / Paid / Positive Cashflow: `#10B981` (Mint Emerald)
  * Pending / Upcoming 7-Day Alert Dot: `#F59E0B` (Amber)
  * Overdue / Expense Outflow / Destructive Action: `#F43F5E` or `#BE123C` (Rose Crimson)
* **Tactile Press Physics (`.neo-btn-interactive`)**:
  * Default: `shadow-[3px_3px_0px_#18181B]`
  * Hover: `translate(-1px, -1px) shadow-[4px_4px_0px_#18181B]`
  * Active (Pressed): `translate(2px, 2px) shadow-[1px_1px_0px_#18181B]`
* **Data Visualizations**:
  * `DonutChartSVG`: Fixed subscriptions vs. variable spend arc in `#4A154B` over neutral `#E4E4E7` track.
  * `HatchedProgressBar`: Partially paid invoices progress meter with cream track `#F4F1EA` and `#10B981` fill.
  * `ChartFrame` & `ChartLegend`: Structured semantic container for cashflow breakdown bars and schedules.

---

## 4. TARGET DIRECTORY ARCHITECTURE & COMPONENT CONVENTIONS

```text
.npmrc                            # Enforces save-exact=true & ignore-scripts=true
scripts/
├── verify-lock.mjs               # Guardrail rejecting ^ or ~ in package.json
└── verify-portability.mjs        # Portability check enforcing headless core
src/
├── core/                         # 100% PORTABLE (NO DOM, NO DEXIE IMPORTS)
│   ├── models/                   # Zod schemas & TS interfaces (Transaction, Subscription, Invoice, Wallet, Profile)
│   ├── engine/
│   │   ├── reconciler.ts         # Boot-up subscription reconciler & overdue invoice transitions
│   │   ├── invoiceCalculator.ts  # Line items, discounts, taxes, and status transitions
│   │   ├── convenienceFee.ts     # Cash-in fees and payment transfer calculations
│   │   ├── obligationSchedule.ts # Upcoming 7-day payments and due dates
│   │   └── cashflowAnalytics.ts  # Net outflow, burn rate %, category distributions
│   └── ports/
│       ├── IStorageRepo.ts       # Abstract repository contract for all CRUD & queries
│       └── IFileStore.ts         # Abstract contract for saving/loading binary receipt blobs
├── adapters/                     # BROWSER IMPLEMENTATIONS
│   ├── web-dexie/
│   │   ├── db.ts                 # Dexie('KromaLedgerDB') schema definition
│   │   ├── DexieStorageRepo.ts   # Implements IStorageRepo
│   │   └── DexieFileStore.ts     # Implements IFileStore with WebP compression
│   └── backup/
│       └── zipVault.ts           # Full ZIP export/restore (kromaledger-vault-YYYY-MM-DD.zip)
├── state/                        # 95% PORTABLE (ZUSTAND + TANSTACK QUERY)
│   ├── StorageContext.tsx        # Dependency injection provider for IStorageRepo & IFileStore
│   ├── useUIStore.ts             # Ephemeral UI state (selectedMonth, activeNavTab, modal states)
│   └── queries/                  # React Query hooks (useTransactions, useSubscriptions, useWallets, etc.)
└── ui/                           # RESPONSIVE NEOBRUTALIST VIEWPORT SHELL
    ├── primitives/               # Centralized design system controls (Button, Field, Modal, ChartFrame, Skeleton)
    ├── components/
    │   ├── TopStatusHeader.tsx   # Kaban logo lockup + storage protection badge
    │   ├── QuickAddDrawer.tsx    # Tactile 4-mode entry sheet (Expense | Subscription | Invoice | Transfer)
    │   ├── LineItemBuilder.tsx   # Dynamic invoice item builder
    │   ├── PhysicalWalletCard.tsx# Tactile physical account card with balance and quick-add actions
    │   ├── StackedWalletDeck.tsx # Multi-wallet deck view
    │   └── FloatingNavPill.tsx   # Bottom floating navigation dock
    └── screens/
        ├── HomeDashboard.tsx     # Hero net outflow card, cashflow graph, recent activity
        ├── PendingAndSubsHub.tsx # Upcoming 7-day obligations, subs donut, partial invoice progress
        ├── WalletsScreen.tsx     # Physical and digital wallet accounts management
        └── SettingsScreen.tsx    # Local storage persistence status, backup ZIP export & restore
```

---

## 5. CENTRALIZED COMPONENT CONTRACTS

All screen builders and feature subagents must strictly adhere to the centralized component system in [`docs/ui-components.md`](file:///docs/ui-components.md):
1. **No Bespoke Buttons**: Import `Button` from `src/ui/primitives` rather than declaring custom `<button className="border-2..." />`.
2. **No Unwrapped Inputs**: Form fields must use `FormField` and `Input` / `Select` / `Textarea` from `src/ui/primitives` to guarantee consistent focus states, `aria-describedby` links, and error indicators.
3. **Portal Modals**: Dialogs and popups must use `ModalShell` from `src/ui/primitives` to handle focus trapping, Escape key dismissals, and responsive backdrop blurring.

---

## 6. EXECUTION PROTOCOL & VERIFICATION GATES

1. **Phase 1 (Guardrails & Portability)**:
   * Run `node scripts/verify-lock.mjs` to ensure zero unpinned dependencies.
   * Run `node scripts/verify-portability.mjs` to certify that `src/core` and `src/state` remain 100% headless.
2. **Phase 2 (Unit & Adapter Verification)**:
   * Run `npm test` with Vitest to certify all math engines, models, reconcilers, and storage repos pass with 100% test coverage.
3. **Phase 3 (Production Build & Bundle Verification)**:
   * Run `npm run typecheck` (`tsc --noEmit`) to verify strict TypeScript adherence with zero type errors.
   * Run `npm run build` (`vite build`) to confirm a clean production bundle.
