# MASTER PROMPT: KromaLedger — Local-First Mobile Expense, Subscription & Invoice Tracker

## 0. AGENT SKILL ACTIVATION & ORCHESTRATION DIRECTIVES

You are the **Lead Architect & Orchestrator** for **KromaLedger** (`kromaledger`). Before writing any application code, you MUST activate and strictly follow your loaded skills:

1. **`superpowers`**:
   * Enforce `brainstorming` / `writing-plans` to validate the implementation plan before touching code.
   * Enforce `test-driven-development` (TDD): Every core calculation, reconciler rule, and storage adapter method must have failing unit tests written BEFORE implementation.
   * Enforce `subagent-driven-development` & `dispatching-parallel-agents`: Decompose the build into isolated workstreams and spawn dedicated subagents with strict directory ownership.
   * Enforce `verification-before-completion`: Run typechecks (`tsc --noEmit`), dependency lock checks (`npm run verify:lock`), unit test suites (`vitest run`), and production builds (`vite build`) before declaring any task complete.

2. **`ponytail`**:
   * Maintain structured task tracking, clean context handoffs between subagents, atomic commits, and deterministic execution state across phases.

---

## 1. BRANDING, IDENTITY & ARCHITECTURAL CONSTRAINTS

* **App Name**: **KromaLedger**
* **Package / Repo Slug**: `kromaledger`
* **Local IndexedDB Name**: `KromaLedgerDB`
* **Backup Archive Prefix**: `kromaledger-vault-YYYY-MM-DD.zip`
* **Header / Logo Lockup**: Rendered in **`JetBrains Mono`** uppercase tracking-wider: **`KROMA`** in crisp white (`#FFFFFF`), **`LEDGER`** in muted silver (`#A3A3A3`), followed by a glowing **`#D9F938` Electric Volt dot** (`KROMA` + `LEDGER` + `●`).

### Architectural Pillars
Build a **100% Local-First, Mobile-First Progressive Web App (PWA)** for tracking **Daily Expenses, Recurring Subscriptions, and Itemized Invoices (Payables & Receivables)**.
* **Zero Cloud Dependency**: No remote backend, no auth wall, no external API calls. All data lives on-device inside `KromaLedgerDB`.
* **React Native (Expo) Port-Ready ("Headless Core" Pattern)**:
  * **75%–85% of the codebase (`src/core/` and `src/state/`) MUST have ZERO DOM, `window`, `document`, or `dexie` imports.**
  * All UI components interact with local storage exclusively through **TanStack Query (`useQuery` / `useMutation`)** calling an injected `IStorageRepo` interface (never `useLiveQuery` directly inside React components).
* **Progressive Disclosure UX ("3-Second Entry")**:
  * Adding an entry requires only **Amount**, **Title/Merchant**, and **Item Type** (`Expense | Subscription | Invoice`) on the primary numpad drawer, with progressive accordions/sheets for line items, tax/discounts, billing cycles, and receipt attachments.

---

## 2. TECH STACK & DETERMINISTIC DEPENDENCY GUARDRAILS

* **Framework & Build**: Vite + **React 19** (`react` & `react-dom` pinned to exact stable 19.x release) + TypeScript (Strict Mode).
  * *React 19 Portability Rule*: Leverage React 19 ref-as-prop and client hooks, but DO NOT use Server Actions (`"use server"`) so 100% of state logic ports directly to React Native.
* **Styling**: Tailwind CSS (configured with standard utility classes compatible with `NativeWind` for future React Native migration).
* **Typography**: `Satoshi` for UI labels and body text; `Cabinet Grotesk` for display headers and the `KROMALEDGER●` brand lockup; `JetBrains Mono` (`font-mono tabular-nums`) for all currency amounts, numpad keys, invoice math, and badges.
* **State & Async Reactivity**:
  * `TanStack Query v5` (`@tanstack/react-query`) for reactive DB reads/writes and cache invalidation.
  * `Zustand` for ephemeral UI state (active month filter, numpad buffer, active drawer tab).
* **Local Storage Adapter (Web)**:
  * `Dexie.js` (IndexedDB) initialized as `new Dexie('KromaLedgerDB')`.g
  * `browser-image-compression` + IndexedDB `Blob` / OPFS for storing receipt photos & invoice PDFs inside a dedicated `attachments` store (never bloat transaction list queries with raw blobs).
  * `navigator.storage.persist()` triggered on boot to protect local storage.
* **Validation & Date Math**: `Zod` + `React Hook Form` + `date-fns`
* **Testing**: `Vitest` + `fake-indexeddb` (for testing Dexie adapters headlessly)

### STRICT SUPPLY-CHAIN & VERSION-LOCK POLICY (MANDATORY GUARDRAILS)
1. **100% Exact Version Pinning**:
   * Set `"name": "kromaledger"` and `"private": true` in `package.json`.
   * Every single dependency and devDependency in `package.json` MUST use an exact semantic version (e.g., `"19.1.0"`, NEVER `"^19.1.0"`, `"~19.1.0"`, `"*"`, or `"latest"`).
2. **Hardened `.npmrc` Configuration**:
   * Create a root `.npmrc` containing:
     ```ini
     save-exact=true
     engine-strict=true
     ignore-scripts=true
     audit-level=critical
     ```
   * `ignore-scripts=true` blocks malicious `postinstall` scripts during supply-chain attacks. Explicitly allowlist only required native/WASM build scripts if strictly needed.
3. **Immutable Lockfile Policy ("Freeze Until Zero-Day")**:
   * Once initialized and verified working, `package.json` and `package-lock.json` are **FROZEN**.
   * Subagents and contributors are **STRICTLY FORBIDDEN** from running `npm update`, adding unrequested packages, or bumping versions unless addressing a documented **Zero-Day Vulnerability (Critical CVE)** or **Supply-Chain Attack**.
   * All automated installs must use `npm ci` to verify cryptographic SHA-512 lockfile integrity.
4. **Automated Lock Verification Script (`scripts/verify-lock.mjs`)**:
   * Wire `"verify:lock": "node scripts/verify-lock.mjs"` into `package.json`. The script must parse `package.json` and exit with code `1` if any dependency version string starts with `^`, `~`, `>`, `<`, `*`, `latest`, `next`, `http`, or `git`.

---

## 3. DESIGN SYSTEM: "STEALTH SMOKED-GLASS & ELECTRIC VOLT"

Follow the exact visual language of the **KromaLedger** prototype:

* **Canvas Base**: Deep Obsidian `#070806` (`bg-[#070806] text-white`).
* **Top Atmospheric Bleed**: Subtle olive-lime radial glow behind the top status header (`bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#3a4714]/40 via-[#0d0f0a] to-[#070806]`).
* **Brand Header Lockup**:
  ```tsx
  <div className="font-mono text-sm font-bold tracking-widest flex items-center gap-0.5">
    <span className="text-white">KROMA</span>
    <span className="text-neutral-400 font-normal">LEDGER</span>
    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#D9F938] ml-0.5 shadow-[0_0_8px_#D9F938]" />
  </div>
  ```
* **Smoked-Glass Surface**: `bg-white/[0.03] backdrop-blur-md border border-white/[0.08] rounded-3xl` (razor-thin `1px` specular borders, never milky/opaque white frost).
* **Grouped List Stack**: `bg-white/[0.02] border border-white/[0.07] divide-y divide-white/[0.05] rounded-3xl`.
* **Primary Accent (Electric Volt)**: `#D9F938` (`bg-[#D9F938] text-[#070806] font-semibold shadow-[0_4px_20px_rgba(217,249,56,0.2)]`) for primary CTAs (`+ Quick Add Entry`), active segmented pills (`Dining`), active bottom-nav pills, and positive receivable figures (`+₱18,000.00`).
* **Secondary Warm CTA**: Warm Amber `#F59E0B` (`bg-amber-400 text-[#070806]`) for the final `Save Entry` bar on the numpad drawer.
* **Semantic Status Colors**:
  * Receivable / Paid: `#D9F938` or `#10B981`
  * Pending / Upcoming Alert Dot: `#FBBF24` (Amber)
  * Overdue / Urgent: `#F43F5E` (Rose)
* **Data Visualizations**:
  * Fixed Subscriptions vs. Variable Spend **Donut Ring** (`#D9F938` active arc over `#262626` track).
  * Partially Paid Invoices **Hatched/Diagonal-Stripe Progress Bars** (`repeating-linear-gradient(-45deg, #D9F938, #D9F938 6px, transparent 6px, transparent 12px)`).

---

## 4. TARGET DIRECTORY ARCHITECTURE

```text
.npmrc                            # Enforces save-exact=true & ignore-scripts=true
scripts/
└── verify-lock.mjs               # Guardrail script rejecting ^ or ~ in package.json
src/
├── core/                         # 100% PORTABLE (NO DOM / NO DEXIE IMPORTS)
│   ├── models/                   # Zod schemas & TS interfaces (Transaction, Subscription, Invoice, InvoiceItem, Category, AttachmentMeta)
│   ├── engine/
│   │   ├── reconciler.ts         # Deterministic Boot-Up Reconciler (backfills missed subscription cycles & marks overdue invoices)
│   │   ├── invoiceCalculator.ts  # Line-item subtotal, tax rate, discount, grand total, and remaining balance math
│   │   ├── numpadEvaluator.ts    # Safe inline math parser for numpad (e.g., "150 + 45" -> 195)
│   │   └── cashflowAnalytics.ts  # Net outflow, fixed burn rate %, category distribution, and partial invoice progress
│   └── ports/
│       ├── IStorageRepo.ts       # Abstract repository contract for all CRUD & queries
│       └── IFileStore.ts         # Abstract contract for saving/loading binary receipt & PDF blobs
├── adapters/                     # WEB-SPECIFIC IMPLEMENTATIONS
│   ├── web-dexie/
│   │   ├── db.ts                 # Dexie('KromaLedgerDB') schema definition (transactions, subscriptions, invoices, categories, attachments, appMeta)
│   │   ├── DexieStorageRepo.ts   # Implements IStorageRepo
│   │   └── DexieFileStore.ts     # Implements IFileStore with browser-image-compression
│   └── backup/
│       └── zipVault.ts           # Exports/imports entire KromaLedgerDB + binary blobs as kromaledger-vault-YYYY-MM-DD.zip
├── state/                        # 95% PORTABLE (ZUSTAND + TANSTACK QUERY)
│   ├── StorageContext.tsx        # Dependency injection provider for IStorageRepo & IFileStore
│   ├── useUIStore.ts             # Zustand store (selectedMonth, activeNavTab, quickAddOpen, quickAddMode)
│   └── queries/                  # React Query hooks (useTransactions, useSubscriptions, useInvoices, useBootReconciler)
└── ui/                           # MOBILE-FIRST VIEWPORT SHELL & SCREENS
    ├── primitives/               # SmokedCard, VoltButton, SegmentedPill, HatchedProgressBar, StatusDot, BrandLogo
    ├── components/
    │   ├── TopStatusHeader.tsx   # KROMALEDGER● lockup + "● Local Storage Protected • Tap to Backup" pill
    │   ├── QuickAddDrawer.tsx    # Morphing 3-mode sheet (Expense | Subscription | Invoice) + Tactile Numpad
    │   ├── LineItemBuilder.tsx   # Dynamic invoice line-item sheet
    │   └── FloatingNavPill.tsx   # Bottom floating glass dock
    └── screens/
        ├── HomeDashboard.tsx     # Screen 1: Net Outflow Hero Card + Recent Activity Feed
        ├── PendingAndSubsHub.tsx # Screen 3: Upcoming 7-Day Alerts + Fixed Subs Donut + Hatched Partial Invoices
        └── VaultBackupModal.tsx  # Local storage persistence badge, storage quota meter, 1-tap ZIP export/restore
```

---

## 5. SUBAGENT WORKSTREAM DECOMPOSITION (`subagent-driven-development`)

Spawn and coordinate **4 specialized subagents**. Enforce strict file-ownership boundaries so parallel subagents never create merge conflicts:

### Subagent 1: `core-domain-architect`
* **Ownership**: `src/core/**`, `tests/core/**`, `.npmrc`, and `scripts/verify-lock.mjs`
* **Forbidden**: Any browser/DOM APIs or UI libraries.
* **Deliverables (Strict TDD via `superpowers`)**:
  1. Configure `.npmrc` (`save-exact=true`, `ignore-scripts=true`) and `scripts/verify-lock.mjs` to lock React 19 and all `kromaledger` dependencies with zero floating ranges.
  2. Define all Zod schemas and TypeScript models (`Transaction`, `Subscription`, `Invoice`, `InvoiceItem`, `Category`, `AppMeta`) with default PHP (`₱`) currency formatting.
  3. Define `IStorageRepo` and `IFileStore` interfaces in `src/core/ports/`.
  4. Build & test `invoiceCalculator.ts` (line-item quantities, unit prices, tax %, discounts, partial payments, and status transitions: `DRAFT -> PENDING -> PARTIAL -> PAID | OVERDUE`).
  5. Build & test `reconciler.ts` (The **Deterministic Boot-Up Reconciler**):
     * Given `lastReconciledDate` and `currentDate`, loop through all active subscriptions where `nextBillingDate <= currentDate`.
     * If `autoLog === true`, generate backfilled `SUBSCRIPTION_PAYMENT` transactions for every missed cycle chronologically and advance `nextBillingDate`.
     * If `autoLog === false`, emit pending confirmation items.
     * Automatically transition any `PENDING` or `PARTIAL` invoice where `dueDate < currentDate` to `OVERDUE`.
  6. Build & test `numpadEvaluator.ts` and `cashflowAnalytics.ts`.

### Subagent 2: `local-vault-engineer`
* **Ownership**: `src/adapters/**`, `src/state/**`, and `tests/adapters/**`
* **Depends On**: `src/core/ports/` and `src/core/models/` from `core-domain-architect`.
* **Deliverables (Strict TDD with `fake-indexeddb`)**:
  1. Implement `db.ts` using `new Dexie('KromaLedgerDB')` with indexed stores: `transactions`, `subscriptions`, `invoices`, `categories`, `attachments`, and `appMeta`.
  2. Keep binary `Blob` attachments strictly isolated in the `attachments` table so transaction/invoice list queries remain sub-millisecond.
  3. Implement `DexieStorageRepo.ts` and `DexieFileStore.ts` (with client-side WebP receipt compression).
  4. Implement `zipVault.ts` for 1-tap full local backup (`kromaledger-vault-YYYY-MM-DD.zip` containing `db-dump.json` + `/attachments/*`) and atomic restore.
  5. Build `StorageContext.tsx`, `useUIStore.ts` (Zustand), and TanStack Query hooks (`useTransactions`, `useSubscriptions`, `useInvoices`, `useReconcileOnForeground` tied to `visibilitychange`).
  6. Seed rich, realistic demo data matching the prototype (`GitHub Copilot Pro -₱560.00`, `Client UI Milestone +₱18,000.00`, `GrabCar Commute -₱245.00`, `Netflix ₱549.00`, `Invoice #104 ₱1,200.00`) on first initialization of `KromaLedgerDB`.

### Subagent 3: `stealth-ui-builder`
* **Ownership**: `src/ui/primitives/**`, `src/ui/components/TopStatusHeader.tsx`, `src/ui/components/FloatingNavPill.tsx`, `src/ui/screens/**`, `src/App.tsx`, and `tailwind.config.js`
* **Deliverables**:
  1. Configure Tailwind CSS with the **Stealth Smoked-Glass & Volt** tokens (`#070806` base, `#D9F938` Volt accent, `JetBrains Mono` font stack).
  2. Build reusable React 19 primitives: `BrandLogo` (`KROMALEDGER●` in `JetBrains Mono`), `SmokedCard`, `VoltButton`, `HatchedProgressBar` (diagonal Volt stripes for partially paid invoices), `DonutChartSVG` (Fixed Subs 40% vs Variable), and `FloatingNavPill`.
  3. Build **Screen 1 (`HomeDashboard.tsx`)**:
     * Top header featuring the `KROMALEDGER●` lockup and `● Local Storage Protected • Tap to Backup` status pill.
     * Smoked-glass Hero Card showing `NET OUTFLOW • OCT 2026`, `₱24,500.00` in `JetBrains Mono`, and the full-width Volt `+ Quick Add Entry` button.
     * Grouped `Recent Activity` stack with micro-badges (`Subscription • Monthly`, `Invoice #103 • Receivable`).
  4. Build **Screen 3 (`PendingAndSubsHub.tsx`)**:
     * `UPCOMING (Next 7 Days)` card with status dots (`Netflix (Tomorrow) ₱549.00`, `Invoice #104 (Oct 24) ₱1,200.00`).
     * Split Bento row: `FIXED SUBS 40%` Donut Ring card on the left + `Partially Paid Invoices` Hatched Progress Bars card on the right (with 1-tap partial/full settlement modal).

### Subagent 4: `quick-add-ux-specialist`
* **Ownership**: `src/ui/components/QuickAddDrawer.tsx` and `src/ui/components/LineItemBuilder.tsx`
* **Deliverables**:
  1. Build **Screen 2 (`QuickAddDrawer.tsx`)** matching the center prototype screen:
     * Top 3-way Segmented Pill: `Expense | Subscription | Invoice`.
     * Giant `JetBrains Mono` tabular amount display (`₱ 0`) with subtitle `Tap keypad or attach receipt`.
     * Horizontal scrollable category/action pills (`Dining` active in `#D9F938`, `Utilities`, `Services`, `Receipt Attach`).
     * **Dynamic Morphing Middle Zone**:
       * *Expense Mode*: Merchant/Note, Date, Category selector.
       * *Subscription Mode*: Service Name, Billing Cycle (`Weekly | Monthly | Yearly`), Next Billing Date, Auto-Log toggle.
       * *Invoice Mode*: Direction (`Payable | Receivable`), `Client/Vendor` input, `Due Date` picker, and expandable `Line Items` drawer trigger (showing live item count & subtotal).
     * Tactile 3x4 dark smoked-glass keypad (`1-9`, `.`, `0`, `⌫`) + full-width warm amber `Save Entry` CTA button (`#F59E0B`).

---

## 6. EXECUTION PROTOCOL & VERIFICATION GATES

1. **Phase 1 (Guardrails, Contract & Core)**: Run `core-domain-architect` first to lock `.npmrc`, `scripts/verify-lock.mjs`, `src/core/models/`, and `src/core/ports/`. Verify 100% unit test pass rate on `reconciler.test.ts` and `invoiceCalculator.test.ts`.
2. **Phase 2 (Parallel Build)**: Dispatch `local-vault-engineer`, `stealth-ui-builder`, and `quick-add-ux-specialist` in parallel. Use `ponytail` to track progress and handoff states.
3. **Phase 3 (Integration & Verification)**:
   * Wire `StorageContext` and `useReconcileOnForeground` into `App.tsx`.
   * Run `npm run verify:lock` (zero floating `^` or `~` versions in `package.json`).
   * Run `tsc --noEmit` (zero type errors).
   * Run `vitest run` (all unit & adapter tests green).
   * Verify ZERO imports from `dexie` or `window` inside `src/core/`.
   * Run `vite build` to confirm a clean production bundle for `kromaledger`.