# Graph Report - KromaLedger  (2026-10-21)

## Corpus Check
- 82 files · ~46,640 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .woff2 3, .toml 1)

## Summary
- 585 nodes · 1509 edges · 32 communities (23 shown, 9 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 29 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `82fc93ad`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ledgerCommands.test.ts
- IStorageRepo
- models/index.ts
- queries/index.ts
- PendingAndSubsHub.tsx
- package.json
- TypeScript and Build Configuration
- PendingAndSubsHub.tsx
- Design System: KromaLedger
- verify-portability.mjs
- Product
- reconciler.ts
- Repository Agent Instructions
- StorageContext.tsx
- Integration Verification Guidelines
- Cabinet Grotesk Typography Asset
- JetBrains Mono Code Font
- Satoshi Sans-Serif Font
- QuickAddDrawer.tsx
- storage.test.ts
- Subscription
- DexieStorageRepo
- PresentationContext.tsx
- Transaction
- db.ts
- zipVault.ts
- WebBootstrap.tsx
- DexieFileStore
- MASTER PROMPT: KromaLedger — Local-First Mobile Expense, Subscription & Invoice Tracker
- KromaLedger implementation plan
- AGENTS.md

## God Nodes (most connected - your core abstractions)
1. `DexieStorageRepo` - 42 edges
2. `IStorageRepo` - 38 edges
3. `Invoice` - 36 edges
4. `Transaction` - 34 edges
5. `Subscription` - 31 edges
6. `useStorage()` - 31 edges
7. `react` - 28 edges
8. `App()` - 24 edges
9. `formatCurrency()` - 24 edges
10. `Wallet` - 22 edges

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

## Communities (32 total, 9 thin omitted)

### Community 0 - "ledgerCommands.test.ts"
Cohesion: 0.16
Nodes (5): commitInvoice(), confirmSubscriptionCycle(), LedgerCommandGateway, LedgerCommandUnit, settleInvoice()

### Community 1 - "IStorageRepo"
Cohesion: 0.08
Nodes (7): DemoSeed, ReconcileResult, AppMeta, Category, InvoiceItem, Wallet, IStorageRepo

### Community 2 - "models/index.ts"
Cohesion: 0.13
Nodes (23): Offline Double-Entry Ledger, KromaLedger Master Specification, date-fns, detachSubscriptionHistory(), detachWalletReferences(), LedgerTable, amountSchema, appMetaSchema (+15 more)

### Community 3 - "queries/index.ts"
Cohesion: 0.09
Nodes (56): PWA & Mobile UI Phase, zustand, App(), EditProfileModal, PendingAndSubsHub, QuickAddDrawer, SettingsScreen, TabSkeleton() (+48 more)

### Community 4 - "PendingAndSubsHub.tsx"
Cohesion: 0.18
Nodes (24): blockInvalidNumberKeys(), parseMinorInput(), sanitizeMoneyInput(), buildInvoicePayment(), selectPendingOverview(), formatWalletLabel(), useConfirmSubscriptionPayment(), useDeleteInvoice() (+16 more)

### Community 5 - "package.json"
Cohesion: 0.04
Nodes (45): dependencies, browser-image-compression, date-fns, dexie, jszip, react, react-dom, react-hook-form (+37 more)

### Community 6 - "TypeScript and Build Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+12 more)

### Community 7 - "PendingAndSubsHub.tsx"
Cohesion: 0.16
Nodes (16): WalletType, formatCardNumber(), getNetworkBadge(), PhysicalWalletCardProps, CURRENCIES, getWalletPalette(), hexToRgb(), WALLET_PALETTES (+8 more)

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
Cohesion: 0.14
Nodes (8): Deterministic Reconciliation Cycle, Portable Core Engine Phase, asUtcDate(), cycleDate(), PendingConfirmation, reconcile(), ReconcileInput, Invoice

### Community 13 - "StorageContext.tsx"
Cohesion: 0.17
Nodes (7): IFileStore, StorageContext, StorageServices, VaultService, formatBytes(), today(), VaultBackupModal()

### Community 19 - "QuickAddDrawer.tsx"
Cohesion: 0.09
Nodes (35): Minor-Unit Integer Money Math, calculateInvoice(), InvoiceCalculation, InvoiceCalculationInput, safeMinor(), addLineItem(), LineItemDraft, lineTotalMinor() (+27 more)

### Community 20 - "storage.test.ts"
Cohesion: 0.18
Nodes (7): Atomic ZIP Vault Restore, fake-indexeddb, jszip, vitest, exportVault(), restoreVault(), attachmentMetaSchema

### Community 22 - "DexieStorageRepo"
Cohesion: 0.12
Nodes (4): appDefaults(), DexieStorageRepo, createDemoSeed(), UserProfile

### Community 23 - "PresentationContext.tsx"
Cohesion: 0.07
Nodes (26): Web App HTML Entrypoint, PWA Application Icon, react, react-dom, PresentationBoxProps, PresentationButtonProps, PresentationComponents, PresentationContext (+18 more)

### Community 24 - "Transaction"
Cohesion: 0.18
Nodes (4): calculateCashflow(), CashflowAnalytics, CashflowInput, Transaction

### Community 25 - "db.ts"
Cohesion: 0.22
Nodes (4): AttachmentFileRecord, KromaLedgerDB, AttachmentMeta, attachmentMimeTypeSchema

### Community 26 - "zipVault.ts"
Cohesion: 0.18
Nodes (7): Local-First Vault Architecture, Local Vault & State Phase, KromaLedger, dumpSchema, fileMetaSchema, MAX_ATTACHMENT_COUNT, MAX_VAULT_BYTES

### Community 27 - "WebBootstrap.tsx"
Cohesion: 0.24
Nodes (9): @tanstack/react-query, db, files, ForegroundReconcile(), queryClient, repo, services, WebBootstrap() (+1 more)

### Community 33 - "MASTER PROMPT: KromaLedger — Local-First Mobile Expense, Subscription & Invoice Tracker"
Cohesion: 0.12
Nodes (15): KromaLedger acceptance checklist, 0. AGENT SKILL ACTIVATION & ORCHESTRATION DIRECTIVES, 1. BRANDING, IDENTITY & ARCHITECTURAL CONSTRAINTS, 2. TECH STACK & DETERMINISTIC DEPENDENCY GUARDRAILS, 3. DESIGN SYSTEM: "STEALTH SMOKED-GLASS & ELECTRIC VOLT", 4. TARGET DIRECTORY ARCHITECTURE, 5. SUBAGENT WORKSTREAM DECOMPOSITION (`subagent-driven-development`), 6. EXECUTION PROTOCOL & VERIFICATION GATES (+7 more)

### Community 44 - "KromaLedger implementation plan"
Cohesion: 0.33
Nodes (5): KromaLedger implementation plan, Phase 1: guardrails and portable core — complete, Phase 2: local vault and state — complete, Phase 3: mobile-first interface and installability — complete, Phase 4: integration verification — complete

## Knowledge Gaps
- **19 isolated node(s):** `react-hook-form`, `@types/react`, `@types/react-dom`, `tailwindcss`, `typescript` (+14 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 224 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `PresentationContext.tsx` to `queries/index.ts`, `PendingAndSubsHub.tsx`, `package.json`, `PendingAndSubsHub.tsx`, `StorageContext.tsx`, `QuickAddDrawer.tsx`, `WebBootstrap.tsx`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **What connects `react-hook-form`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _19 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `IStorageRepo` be split into smaller, more focused modules?**
  _Cohesion score 0.08067226890756303 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `storage.test.ts` to `ledgerCommands.test.ts`, `models/index.ts`, `PendingAndSubsHub.tsx`, `package.json`, `PendingAndSubsHub.tsx`, `verify-portability.mjs`, `reconciler.ts`, `QuickAddDrawer.tsx`, `DexieStorageRepo`, `PresentationContext.tsx`, `Transaction`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Should `models/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12688172043010754 - nodes in this community are weakly interconnected._
- **Why does `DexieStorageRepo` connect `DexieStorageRepo` to `ledgerCommands.test.ts`, `IStorageRepo`, `models/index.ts`, `reconciler.ts`, `storage.test.ts`, `Subscription`, `Transaction`, `db.ts`, `WebBootstrap.tsx`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `queries/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09366901147723065 - nodes in this community are weakly interconnected._