# Graph Report - KromaLedger  (2026-10-21)

## Corpus Check
- 82 files · ~46,129 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .woff2 3, .toml 1)

## Summary
- 578 nodes · 1503 edges · 29 communities (20 shown, 9 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 29 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `12e9fe44`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Invoice
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
- Transaction
- Integration Verification Guidelines
- Cabinet Grotesk Typography Asset
- JetBrains Mono Code Font
- Satoshi Sans-Serif Font
- lineItemWorkflow.ts
- zipVault.ts
- Subscription
- DexieStorageRepo
- PresentationContext.tsx
- Transaction
- ledgerCommands.test.ts
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
- `Capabilities and Constraints` --references--> `KromaLedgerDB`  [INFERRED]
  PRODUCT.md → src/adapters/web-dexie/db.ts
- `Atomic ZIP Vault Restore` --conceptually_related_to--> `restoreVault()`  [INFERRED]
  docs/acceptance-checklist.md → src/adapters/backup/zipVault.ts
- `PWA Application Icon` --references--> `Web App HTML Entrypoint`  [INFERRED]
  public/pwa-icon.svg → index.html
- `App()` --calls--> `calculateCashflow()`  [EXTRACTED]
  src/App.tsx → src/core/engine/cashflowAnalytics.ts
- `App()` --calls--> `HomeDashboard()`  [EXTRACTED]
  src/App.tsx → src/ui/screens/HomeDashboard.tsx

## Import Cycles
- None detected.

## Communities (29 total, 9 thin omitted)

### Community 0 - "Invoice"
Cohesion: 0.15
Nodes (4): commitInvoice(), LedgerCommandGateway, settleInvoice(), Invoice

### Community 1 - "IStorageRepo"
Cohesion: 0.10
Nodes (6): DemoSeed, AppMeta, Category, InvoiceItem, UserProfile, IStorageRepo

### Community 2 - "models/index.ts"
Cohesion: 0.14
Nodes (22): Offline Double-Entry Ledger, KromaLedger Master Specification, vitest, createDemoSeed(), ALLOWED_ATTACHMENT_MIME_TYPES, amountSchema, appMetaSchema, AttachmentMimeType (+14 more)

### Community 3 - "queries/index.ts"
Cohesion: 0.08
Nodes (50): Web App HTML Entrypoint, PWA Application Icon, date-fns, react, App(), evaluateNumpad(), EntrySaveProgress, saveEntryAndAttachment() (+42 more)

### Community 4 - "PendingAndSubsHub.tsx"
Cohesion: 0.10
Nodes (43): PWA & Mobile UI Phase, calculateCashflow(), CashflowAnalytics, CashflowInput, blockInvalidNumberKeys(), parseMinorInput(), sanitizeMoneyInput(), buildInvoicePayment() (+35 more)

### Community 5 - "package.json"
Cohesion: 0.04
Nodes (47): dependencies, browser-image-compression, date-fns, dexie, jszip, react, react-dom, react-hook-form (+39 more)

### Community 6 - "TypeScript and Build Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+12 more)

### Community 7 - "PendingAndSubsHub.tsx"
Cohesion: 0.12
Nodes (20): Wallet, WalletType, formatCardNumber(), getNetworkBadge(), PhysicalWalletCard(), PhysicalWalletCardProps, StackedWalletDeck(), CURRENCIES (+12 more)

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
Cohesion: 0.24
Nodes (7): Deterministic Reconciliation Cycle, Portable Core Engine Phase, asUtcDate(), cycleDate(), PendingConfirmation, reconcile(), ReconcileInput

### Community 13 - "Transaction"
Cohesion: 0.20
Nodes (9): dateOnlySchema, Common, EntryDraft, EntryDraftInput, EntryMode, ExpenseInput, InvoiceInput, InvoiceLineDraft (+1 more)

### Community 19 - "lineItemWorkflow.ts"
Cohesion: 0.21
Nodes (16): Minor-Unit Integer Money Math, calculateInvoice(), InvoiceCalculation, InvoiceCalculationInput, safeMinor(), addLineItem(), LineItemDraft, lineTotalMinor() (+8 more)

### Community 20 - "zipVault.ts"
Cohesion: 0.06
Nodes (28): Local-First Vault Architecture, Atomic ZIP Vault Restore, Local Vault & State Phase, KromaLedger, browser-image-compression, fake-indexeddb, jszip, dumpSchema (+20 more)

### Community 21 - "Subscription"
Cohesion: 0.21
Nodes (3): confirmSubscriptionCycle(), LedgerCommandUnit, Subscription

### Community 22 - "DexieStorageRepo"
Cohesion: 0.15
Nodes (3): appDefaults(), DexieStorageRepo, LedgerTable

### Community 23 - "PresentationContext.tsx"
Cohesion: 0.08
Nodes (21): react-dom, PresentationBoxProps, PresentationButtonProps, PresentationComponents, PresentationContext, PresentationIconProps, PresentationInputProps, PresentationModalProps (+13 more)

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

- **Why does `react` connect `queries/index.ts` to `PendingAndSubsHub.tsx`, `package.json`, `PendingAndSubsHub.tsx`, `lineItemWorkflow.ts`, `zipVault.ts`, `PresentationContext.tsx`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **What connects `react-hook-form`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _19 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Invoice` be split into smaller, more focused modules?**
  _Cohesion score 0.14705882352941177 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `models/index.ts` to `queries/index.ts`, `PendingAndSubsHub.tsx`, `package.json`, `PendingAndSubsHub.tsx`, `verify-portability.mjs`, `reconciler.ts`, `lineItemWorkflow.ts`, `zipVault.ts`, `PresentationContext.tsx`, `ledgerCommands.test.ts`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Should `IStorageRepo` be split into smaller, more focused modules?**
  _Cohesion score 0.09852216748768473 - nodes in this community are weakly interconnected._
- **Why does `DexieStorageRepo` connect `DexieStorageRepo` to `Invoice`, `IStorageRepo`, `models/index.ts`, `PendingAndSubsHub.tsx`, `zipVault.ts`, `Subscription`, `Transaction`, `ledgerCommands.test.ts`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `models/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.135632183908046 - nodes in this community are weakly interconnected._