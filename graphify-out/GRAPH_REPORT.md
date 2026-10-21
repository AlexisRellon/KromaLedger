# Graph Report - KromaLedger  (2026-10-21)

## Corpus Check
- 82 files · ~45,668 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: .woff2 3, (none) 2, .css 1)

## Summary
- 571 nodes · 1490 edges · 28 communities (20 shown, 8 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 29 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7dd69c38`
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
- WalletFormModal.tsx
- Design System: KromaLedger
- verify-portability.mjs
- Product
- reconciler.ts
- Repository Agent Instructions
- entryDraft.ts
- Integration Verification Guidelines
- Cabinet Grotesk Typography Asset
- JetBrains Mono Code Font
- Satoshi Sans-Serif Font
- KromaLedger
- WebBootstrap.tsx
- DexieStorageRepo
- PresentationContext.tsx
- db.ts
- storage.test.ts
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
8. `formatCurrency()` - 24 edges
9. `App()` - 23 edges
10. `Wallet` - 22 edges

## Surprising Connections (you probably didn't know these)
- `Atomic ZIP Vault Restore` --conceptually_related_to--> `restoreVault()`  [INFERRED]
  docs/acceptance-checklist.md → src/adapters/backup/zipVault.ts
- `Capabilities and Constraints` --references--> `KromaLedgerDB`  [INFERRED]
  PRODUCT.md → src/adapters/web-dexie/db.ts
- `PWA Application Icon` --references--> `Web App HTML Entrypoint`  [INFERRED]
  public/pwa-icon.svg → index.html
- `PhysicalWalletCardProps` --references--> `Wallet`  [EXTRACTED]
  src/ui/components/PhysicalWalletCard.tsx → src/core/models/index.ts
- `WebBox()` --calls--> `SmokedCard()`  [EXTRACTED]
  src/ui/adapters/WebPresentationProvider.tsx → src/ui/primitives/index.tsx

## Import Cycles
- None detected.

## Communities (28 total, 8 thin omitted)

### Community 0 - "ledgerCommands.test.ts"
Cohesion: 0.15
Nodes (4): commitInvoice(), confirmSubscriptionCycle(), LedgerCommandUnit, settleInvoice()

### Community 1 - "IStorageRepo"
Cohesion: 0.07
Nodes (5): CashflowInput, ReconcileResult, Subscription, Transaction, IStorageRepo

### Community 2 - "models/index.ts"
Cohesion: 0.12
Nodes (29): Offline Double-Entry Ledger, KromaLedger Master Specification, Local Vault & State Phase, zod, dumpSchema, fileMetaSchema, createDemoSeed(), detachSubscriptionHistory() (+21 more)

### Community 3 - "queries/index.ts"
Cohesion: 0.08
Nodes (59): PWA & Mobile UI Phase, Web App HTML Entrypoint, PWA Application Icon, date-fns, react, App(), calculateCashflow(), CashflowAnalytics (+51 more)

### Community 4 - "PendingAndSubsHub.tsx"
Cohesion: 0.08
Nodes (49): Minor-Unit Integer Money Math, calculateInvoice(), InvoiceCalculation, InvoiceCalculationInput, safeMinor(), addLineItem(), LineItemDraft, lineTotalMinor() (+41 more)

### Community 5 - "package.json"
Cohesion: 0.04
Nodes (45): dependencies, browser-image-compression, date-fns, dexie, jszip, react, react-dom, react-hook-form (+37 more)

### Community 6 - "TypeScript and Build Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+12 more)

### Community 7 - "WalletFormModal.tsx"
Cohesion: 0.15
Nodes (18): WalletType, formatCardNumber(), getNetworkBadge(), PhysicalWalletCardProps, CURRENCIES, getWalletPalette(), hexToRgb(), WALLET_PALETTES (+10 more)

### Community 8 - "Design System: KromaLedger"
Cohesion: 0.09
Nodes (22): Buttons, Cards / Containers, Colors, Components, Design System: KromaLedger, Do:, Do's and Don'ts, Don't: (+14 more)

### Community 9 - "verify-portability.mjs"
Cohesion: 0.15
Nodes (6): isExactVersion(), verifyPackage(), errors, files(), root, violations

### Community 10 - "Product"
Cohesion: 0.18
Nodes (10): Accessibility & Inclusion, Brand Commitments, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Principles (+2 more)

### Community 11 - "reconciler.ts"
Cohesion: 0.13
Nodes (8): Deterministic Reconciliation Cycle, Portable Core Engine Phase, asUtcDate(), cycleDate(), PendingConfirmation, reconcile(), ReconcileInput, Invoice

### Community 13 - "entryDraft.ts"
Cohesion: 0.22
Nodes (8): Common, EntryDraft, EntryDraftInput, EntryMode, ExpenseInput, InvoiceInput, InvoiceLineDraft, SubscriptionInput

### Community 20 - "WebBootstrap.tsx"
Cohesion: 0.09
Nodes (15): @tanstack/react-query, DexieFileStore, db, files, ForegroundReconcile(), queryClient, repo, services (+7 more)

### Community 22 - "DexieStorageRepo"
Cohesion: 0.09
Nodes (3): appDefaults(), DexieStorageRepo, Wallet

### Community 23 - "PresentationContext.tsx"
Cohesion: 0.08
Nodes (18): react-dom, PresentationBoxProps, PresentationButtonProps, PresentationComponents, PresentationContext, PresentationIconProps, PresentationInputProps, PresentationModalProps (+10 more)

### Community 24 - "db.ts"
Cohesion: 0.16
Nodes (10): Capabilities and Constraints, dexie, AttachmentFileRecord, KromaLedgerDB, DemoSeed, AppMeta, AttachmentMeta, Category (+2 more)

### Community 26 - "storage.test.ts"
Cohesion: 0.18
Nodes (6): Atomic ZIP Vault Restore, fake-indexeddb, jszip, vitest, exportVault(), restoreVault()

### Community 33 - "MASTER PROMPT: KromaLedger — Local-First Mobile Expense, Subscription & Invoice Tracker"
Cohesion: 0.12
Nodes (15): KromaLedger acceptance checklist, 0. AGENT SKILL ACTIVATION & ORCHESTRATION DIRECTIVES, 1. BRANDING, IDENTITY & ARCHITECTURAL CONSTRAINTS, 2. TECH STACK & DETERMINISTIC DEPENDENCY GUARDRAILS, 3. DESIGN SYSTEM: "STEALTH SMOKED-GLASS & ELECTRIC VOLT", 4. TARGET DIRECTORY ARCHITECTURE, 5. SUBAGENT WORKSTREAM DECOMPOSITION (`subagent-driven-development`), 6. EXECUTION PROTOCOL & VERIFICATION GATES (+7 more)

### Community 44 - "KromaLedger implementation plan"
Cohesion: 0.33
Nodes (5): KromaLedger implementation plan, Phase 1: guardrails and portable core — complete, Phase 2: local vault and state — complete, Phase 3: mobile-first interface and installability — complete, Phase 4: integration verification — complete

## Knowledge Gaps
- **19 isolated node(s):** `react-hook-form`, `@types/react`, `@types/react-dom`, `tailwindcss`, `typescript` (+14 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 219 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `queries/index.ts` to `PendingAndSubsHub.tsx`, `package.json`, `WalletFormModal.tsx`, `WebBootstrap.tsx`, `PresentationContext.tsx`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **What connects `react-hook-form`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _19 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `IStorageRepo` be split into smaller, more focused modules?**
  _Cohesion score 0.0748663101604278 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `storage.test.ts` to `ledgerCommands.test.ts`, `models/index.ts`, `queries/index.ts`, `PendingAndSubsHub.tsx`, `package.json`, `WalletFormModal.tsx`, `verify-portability.mjs`, `reconciler.ts`, `PresentationContext.tsx`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Should `models/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11861861861861862 - nodes in this community are weakly interconnected._
- **Why does `DexieStorageRepo` connect `DexieStorageRepo` to `ledgerCommands.test.ts`, `IStorageRepo`, `models/index.ts`, `reconciler.ts`, `WebBootstrap.tsx`, `db.ts`, `storage.test.ts`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Should `queries/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08347338935574229 - nodes in this community are weakly interconnected._