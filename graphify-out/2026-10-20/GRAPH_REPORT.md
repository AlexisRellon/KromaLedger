# Graph Report - KromaLedger  (2026-10-20)

## Corpus Check
- 61 files · ~22,866 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 387 nodes · 829 edges · 25 communities (14 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Reconciliation and Dexie Storage
- UI Entrypoints and Draft State
- Core Ledger Architecture and Specs
- Vault ZIP Backup and Restore
- Integer Invoice Calculation Engine
- Runtime Production Dependencies
- TypeScript and Build Configuration
- Cashflow Analytics and Reporting
- Development Dependencies and Tooling
- Lockfile and Dependency Policy
- Architecture Portability Enforcement
- Numpad Expression Evaluator
- Repository Agent Instructions
- Graphify Knowledge Graph Rules
- Integration Verification Guidelines
- Cabinet Grotesk Typography Asset
- JetBrains Mono Code Font
- Satoshi Sans-Serif Font
- IStorageRepo
- WebBootstrap.tsx
- Subscription
- Transaction
- graphify.md

## God Nodes (most connected - your core abstractions)
1. `Invoice` - 35 edges
2. `DexieStorageRepo` - 34 edges
3. `Transaction` - 30 edges
4. `IStorageRepo` - 30 edges
5. `Subscription` - 26 edges
6. `useStorage()` - 21 edges
7. `InvoiceItem` - 19 edges
8. `compilerOptions` - 19 edges
9. `KromaLedgerDB` - 17 edges
10. `Category` - 12 edges

## Surprising Connections (you probably didn't know these)
- `Atomic ZIP Vault Restore` --conceptually_related_to--> `restoreVault()`  [INFERRED]
  docs/acceptance-checklist.md → src/adapters/backup/zipVault.ts
- `PWA Application Icon` --references--> `Web App HTML Entrypoint`  [INFERRED]
  public/pwa-icon.svg → index.html
- `useConfirmSubscriptionPayment()` --indirect_call--> `payment()`  [INFERRED]
  src/state/queries/index.ts → tests/core/ledgerCommands.test.ts
- `useRecordInvoicePayment()` --indirect_call--> `payment()`  [INFERRED]
  src/state/queries/index.ts → tests/core/ledgerCommands.test.ts
- `exportVault()` --references--> `jszip`  [EXTRACTED]
  src/adapters/backup/zipVault.ts → package.json

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Core Accounting Engine Pattern** — docs_acceptance_checklist_integer_math, docs_acceptance_checklist_deterministic_reconciler, concept_double_entry_ledger [INFERRED 0.85]
- **Local-First Persistence & Vault Pattern** — concept_local_first_vault, docs_acceptance_checklist_atomic_zip_restore, readme_kromaledger [INFERRED 0.95]

## Communities (25 total, 11 thin omitted)

### Community 0 - "Reconciliation and Dexie Storage"
Cohesion: 0.12
Nodes (3): appDefaults(), DexieStorageRepo, WebBootstrap()

### Community 1 - "UI Entrypoints and Draft State"
Cohesion: 0.08
Nodes (38): Web App HTML Entrypoint, PWA Application Icon, App(), evaluateNumpad(), buildEntryDraft(), EntrySaveProgress, saveEntryAndAttachment(), queryKeys (+30 more)

### Community 2 - "Core Ledger Architecture and Specs"
Cohesion: 0.05
Nodes (49): Offline Double-Entry Ledger, Local-First Vault Architecture, Portability Rule (75%+ in core/state), Atomic ZIP Vault Restore, Deterministic Reconciliation Cycle, KromaLedger Master Specification, Local Vault & State Phase, Portable Core Engine Phase (+41 more)

### Community 3 - "Vault ZIP Backup and Restore"
Cohesion: 0.15
Nodes (3): DexieFileStore, AttachmentMeta, IFileStore

### Community 4 - "Integer Invoice Calculation Engine"
Cohesion: 0.21
Nodes (16): Minor-Unit Integer Money Math, calculateInvoice(), InvoiceCalculation, InvoiceCalculationInput, safeMinor(), addLineItem(), LineItemDraft, lineTotalMinor() (+8 more)

### Community 5 - "Runtime Production Dependencies"
Cohesion: 0.06
Nodes (31): browser-image-compression, date-fns, dexie, dependencies, browser-image-compression, date-fns, dexie, react (+23 more)

### Community 6 - "TypeScript and Build Configuration"
Cohesion: 0.07
Nodes (27): DOM, DOM.Iterable, ES2022, src, tests, vite.config.ts, vitest/globals, compilerOptions (+19 more)

### Community 7 - "Cashflow Analytics and Reporting"
Cohesion: 0.14
Nodes (19): PWA & Mobile UI Phase, calculateCashflow(), CashflowAnalytics, CashflowInput, BrandLogo(), DonutChartSVG(), HatchedProgressBar(), SmokedCard() (+11 more)

### Community 8 - "Development Dependencies and Tooling"
Cohesion: 0.10
Nodes (21): fake-indexeddb, devDependencies, fake-indexeddb, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom, typescript (+13 more)

### Community 9 - "Lockfile and Dependency Policy"
Cohesion: 0.60
Nodes (3): isExactVersion(), verifyPackage(), errors

### Community 11 - "Numpad Expression Evaluator"
Cohesion: 0.14
Nodes (12): parseMinorInput(), buildInvoicePayment(), selectPendingOverview(), Common, EntryDraft, EntryDraftInput, EntryMode, ExpenseInput (+4 more)

### Community 21 - "WebBootstrap.tsx"
Cohesion: 0.25
Nodes (8): db, files, ForegroundReconcile(), queryClient, repo, services, useReconcileCommand(), StorageProvider()

## Knowledge Gaps
- **103 isolated node(s):** `name`, `version`, `private`, `type`, `node` (+98 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Runtime Production Dependencies` to `Core Ledger Architecture and Specs`?**
  _High betweenness centrality (0.210) - this node is a cross-community bridge._
- **Why does `jszip` connect `Core Ledger Architecture and Specs` to `Runtime Production Dependencies`?**
  _High betweenness centrality (0.206) - this node is a cross-community bridge._
- **Why does `restoreVault()` connect `Core Ledger Architecture and Specs` to `WebBootstrap.tsx`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _103 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Reconciliation and Dexie Storage` be split into smaller, more focused modules?**
  _Cohesion score 0.12280701754385964 - nodes in this community are weakly interconnected._
- **Should `UI Entrypoints and Draft State` be split into smaller, more focused modules?**
  _Cohesion score 0.0777323202805377 - nodes in this community are weakly interconnected._
- **Should `Core Ledger Architecture and Specs` be split into smaller, more focused modules?**
  _Cohesion score 0.054858934169279 - nodes in this community are weakly interconnected._