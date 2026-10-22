# Graph Report - KromaLedger  (2026-10-23)

## Corpus Check
- 95 files · ~57,452 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .woff2 3, .toml 1)

## Summary
- 659 nodes · 1769 edges · 32 communities (22 shown, 10 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 40 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `564bde27`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ledgerCommands.test.ts
- IStorageRepo
- models/index.ts
- queries/index.ts
- db.ts
- package.json
- TypeScript and Build Configuration
- zipVault.ts
- Design System: KromaLedger
- verify-portability.mjs
- Product
- reconciler.ts
- Repository Agent Instructions
- WebBootstrap.tsx
- Integration Verification Guidelines
- Cabinet Grotesk Typography Asset
- JetBrains Mono Code Font
- Satoshi Sans-Serif Font
- PendingAndSubsHub.tsx
- storage.test.ts
- InvoiceItem
- DexieStorageRepo
- WalletsScreen.tsx
- bank-transfer-fee-chart.md
- KromaLedger
- StorageContext.tsx
- HomeDashboard.tsx
- DexieFileStore
- MASTER PROMPT: KromaLedger — Local-First Mobile Expense, Subscription & Invoice Tracker
- KromaLedger implementation plan
- AGENTS.md

## God Nodes (most connected - your core abstractions)
1. `DexieStorageRepo` - 47 edges
2. `IStorageRepo` - 43 edges
3. `Invoice` - 36 edges
4. `useStorage()` - 36 edges
5. `Transaction` - 34 edges
6. `react` - 31 edges
7. `Subscription` - 31 edges
8. `formatCurrency()` - 29 edges
9. `Wallet` - 27 edges
10. `App()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `Capabilities and Constraints` --references--> `KromaLedgerDB`  [INFERRED]
  PRODUCT.md → src/adapters/web-dexie/db.ts
- `Atomic ZIP Vault Restore` --conceptually_related_to--> `restoreVault()`  [INFERRED]
  docs/acceptance-checklist.md → src/adapters/backup/zipVault.ts
- `PWA Application Icon` --references--> `Web App HTML Entrypoint`  [INFERRED]
  public/pwa-icon.svg → index.html
- `PhysicalWalletCardProps` --references--> `Wallet`  [EXTRACTED]
  src/ui/components/PhysicalWalletCard.tsx → src/core/models/index.ts
- `WebBox()` --calls--> `SmokedCard()`  [EXTRACTED]
  src/ui/adapters/WebPresentationProvider.tsx → src/ui/primitives/index.tsx

## Import Cycles
- None detected.

## Communities (32 total, 10 thin omitted)

### Community 0 - "ledgerCommands.test.ts"
Cohesion: 0.11
Nodes (5): commitInvoice(), confirmSubscriptionCycle(), LedgerCommandUnit, settleInvoice(), Invoice

### Community 1 - "IStorageRepo"
Cohesion: 0.08
Nodes (5): ReconcileResult, AppNotification, Subscription, Transaction, IStorageRepo

### Community 2 - "models/index.ts"
Cohesion: 0.12
Nodes (28): Offline Double-Entry Ledger, KromaLedger Master Specification, createDemoSeed(), detachSubscriptionHistory(), detachWalletReferences(), LedgerCommandGateway, LedgerTable, amountSchema (+20 more)

### Community 3 - "queries/index.ts"
Cohesion: 0.10
Nodes (44): dispatchBrowserNotification(), getBrowserNotificationPermission(), getShownIds(), isBrowserNotificationSupported(), markShownId(), requestBrowserNotificationPermission(), syncBrowserNotifications(), App() (+36 more)

### Community 4 - "db.ts"
Cohesion: 0.12
Nodes (7): dexie, KromaLedgerDB, DemoSeed, AppMeta, AttachmentMeta, Category, UserProfile

### Community 5 - "package.json"
Cohesion: 0.05
Nodes (43): dependencies, browser-image-compression, date-fns, dexie, jszip, react, react-dom, @tanstack/react-query (+35 more)

### Community 6 - "TypeScript and Build Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+12 more)

### Community 7 - "zipVault.ts"
Cohesion: 0.17
Nodes (9): Local Vault & State Phase, zod, dumpSchema, fileMetaSchema, MAX_ATTACHMENT_COUNT, MAX_VAULT_BYTES, AttachmentFileRecord, attachmentMetaSchema (+1 more)

### Community 8 - "Design System: KromaLedger"
Cohesion: 0.09
Nodes (22): Buttons, Cards / Containers, Colors, Components, Design System: KromaLedger, Do:, Do's and Don'ts, Don't: (+14 more)

### Community 9 - "verify-portability.mjs"
Cohesion: 0.15
Nodes (6): isExactVersion(), verifyPackage(), errors, files(), root, violations

### Community 10 - "Product"
Cohesion: 0.17
Nodes (11): Accessibility & Inclusion, Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product (+3 more)

### Community 11 - "reconciler.ts"
Cohesion: 0.27
Nodes (8): Deterministic Reconciliation Cycle, Portable Core Engine Phase, addDaysUtc(), asUtcDate(), cycleDate(), daysBetweenUtc(), PendingConfirmation, reconcile()

### Community 13 - "WebBootstrap.tsx"
Cohesion: 0.19
Nodes (11): Web App HTML Entrypoint, PWA Application Icon, db, files, ForegroundReconcile(), queryClient, repo, services (+3 more)

### Community 19 - "PendingAndSubsHub.tsx"
Cohesion: 0.05
Nodes (73): Minor-Unit Integer Money Math, vitest, calculateInvoice(), InvoiceCalculation, InvoiceCalculationInput, safeMinor(), addLineItem(), LineItemDraft (+65 more)

### Community 20 - "storage.test.ts"
Cohesion: 0.23
Nodes (5): Atomic ZIP Vault Restore, fake-indexeddb, jszip, exportVault(), restoreVault()

### Community 22 - "DexieStorageRepo"
Cohesion: 0.09
Nodes (4): appDefaults(), DexieStorageRepo, ReconcileInput, Wallet

### Community 23 - "WalletsScreen.tsx"
Cohesion: 0.06
Nodes (49): react, react-dom, formatCurrency(), WalletType, PresentationBoxProps, PresentationButtonProps, PresentationComponents, PresentationContext (+41 more)

### Community 24 - "bank-transfer-fee-chart.md"
Cohesion: 0.50
Nodes (3): Digital-First Banks, E-Wallets, Traditional Banks

### Community 26 - "StorageContext.tsx"
Cohesion: 0.20
Nodes (4): IFileStore, StorageContext, StorageServices, VaultService

### Community 27 - "HomeDashboard.tsx"
Cohesion: 0.15
Nodes (33): PWA & Mobile UI Phase, date-fns, calculateCashflow(), calculateCashForecast(), CashflowAnalytics, CashflowInput, CashForecast, CashForecastInput (+25 more)

### Community 33 - "MASTER PROMPT: KromaLedger — Local-First Mobile Expense, Subscription & Invoice Tracker"
Cohesion: 0.12
Nodes (15): KromaLedger acceptance checklist, 0. AGENT SKILL ACTIVATION & ORCHESTRATION DIRECTIVES, 1. BRANDING, IDENTITY & ARCHITECTURAL CONSTRAINTS, 2. TECH STACK & DETERMINISTIC DEPENDENCY GUARDRAILS, 3. DESIGN SYSTEM: "STEALTH SMOKED-GLASS & ELECTRIC VOLT", 4. TARGET DIRECTORY ARCHITECTURE, 5. SUBAGENT WORKSTREAM DECOMPOSITION (`subagent-driven-development`), 6. EXECUTION PROTOCOL & VERIFICATION GATES (+7 more)

### Community 44 - "KromaLedger implementation plan"
Cohesion: 0.33
Nodes (5): KromaLedger implementation plan, Phase 1: guardrails and portable core — complete, Phase 2: local vault and state — complete, Phase 3: mobile-first interface and installability — complete, Phase 4: integration verification — complete

## Knowledge Gaps
- **18 isolated node(s):** `@types/react`, `@types/react-dom`, `tailwindcss`, `typescript`, `vite` (+13 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 245 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `WalletsScreen.tsx` to `queries/index.ts`, `package.json`, `WebBootstrap.tsx`, `PendingAndSubsHub.tsx`, `StorageContext.tsx`, `HomeDashboard.tsx`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **What connects `@types/react`, `@types/react-dom`, `tailwindcss` to the rest of the system?**
  _18 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ledgerCommands.test.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `PendingAndSubsHub.tsx` to `ledgerCommands.test.ts`, `models/index.ts`, `package.json`, `verify-portability.mjs`, `reconciler.ts`, `storage.test.ts`, `WalletsScreen.tsx`, `HomeDashboard.tsx`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Should `IStorageRepo` be split into smaller, more focused modules?**
  _Cohesion score 0.07936507936507936 - nodes in this community are weakly interconnected._
- **Why does `DexieStorageRepo` connect `DexieStorageRepo` to `ledgerCommands.test.ts`, `IStorageRepo`, `models/index.ts`, `db.ts`, `WebBootstrap.tsx`, `storage.test.ts`, `InvoiceItem`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Should `models/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11553030303030302 - nodes in this community are weakly interconnected._