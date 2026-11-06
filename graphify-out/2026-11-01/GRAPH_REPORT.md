# Graph Report - KromaLedger  (2026-11-01)

## Corpus Check
- 117 files · ~72,683 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .woff2 3, .toml 1)

## Summary
- 779 nodes · 2225 edges · 37 communities (28 shown, 9 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 49 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `942bf723`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ledgerCommands.test.ts
- Subscription
- models/index.ts
- MarkdownRenderer.tsx
- DexieStorageRepo
- package.json
- TypeScript and Build Configuration
- entryDraft.ts
- Design System: KromaLedger
- verify-portability.mjs
- Product
- IStorageRepo
- Repository Agent Instructions
- dashboardAndHookOrder.test.tsx
- Integration Verification Guidelines
- Cabinet Grotesk Typography Asset
- JetBrains Mono Code Font
- Satoshi Sans-Serif Font
- Transaction
- AIAssistantModal.tsx
- queries/index.ts
- WalletsScreen.tsx
- Category
- bank-transfer-fee-chart.md
- devDependencies
- vitest
- WebPresentationProvider.tsx
- dependencies
- HomeDashboard.tsx
- gemma.ts
- AttachmentCacheManager
- scripts
- MASTER PROMPT: KromaLedger — Local-First Mobile Expense, Subscription & Invoice Tracker
- transferFees.ts
- KromaLedger implementation plan
- AGENTS.md

## God Nodes (most connected - your core abstractions)
1. `DexieStorageRepo` - 50 edges
2. `IStorageRepo` - 44 edges
3. `Invoice` - 41 edges
4. `Transaction` - 39 edges
5. `useStorage()` - 38 edges
6. `react` - 35 edges
7. `Subscription` - 34 edges
8. `Wallet` - 32 edges
9. `formatCurrency()` - 31 edges
10. `vitest` - 30 edges

## Surprising Connections (you probably didn't know these)
- `Capabilities and Constraints` --references--> `KromaLedgerDB`  [INFERRED]
  PRODUCT.md → src/adapters/web-dexie/db.ts
- `Atomic ZIP Vault Restore` --conceptually_related_to--> `restoreVault()`  [INFERRED]
  docs/acceptance-checklist.md → src/adapters/backup/zipVault.ts
- `PWA Application Icon` --references--> `Web App HTML Entrypoint`  [INFERRED]
  public/pwa-icon.svg → index.html
- `createObligation()` --calls--> `buildEntryDraft()`  [EXTRACTED]
  tests/adapters/paymentWorkflows.test.ts → src/state/entryDraft.ts
- `wrapWithProviders()` --indirect_call--> `StorageProvider()`  [INFERRED]
  tests/core/dashboardAndHookOrder.test.tsx → src/state/StorageContext.tsx

## Import Cycles
- None detected.

## Communities (37 total, 9 thin omitted)

### Community 0 - "ledgerCommands.test.ts"
Cohesion: 0.15
Nodes (12): Offline Double-Entry Ledger, KromaLedger Master Specification, commitInvoice(), confirmSubscriptionCycle(), detachSubscriptionHistory(), detachWalletReferences(), LedgerCommandGateway, LedgerCommandUnit (+4 more)

### Community 1 - "Subscription"
Cohesion: 0.11
Nodes (12): Deterministic Reconciliation Cycle, Portable Core Engine Phase, addDaysUtc(), asUtcDate(), daysBetweenUtc(), PendingConfirmation, reconcile(), ReconcileInput (+4 more)

### Community 2 - "models/index.ts"
Cohesion: 0.08
Nodes (32): Local-First Vault Architecture, Local Vault & State Phase, KromaLedger, dumpSchema, fileMetaSchema, MAX_ATTACHMENT_COUNT, MAX_VAULT_BYTES, amountSchema (+24 more)

### Community 3 - "MarkdownRenderer.tsx"
Cohesion: 0.33
Nodes (8): Block, BlockComponent(), CodeBlock(), InlineContent(), MarkdownRenderer(), MarkdownRendererProps, parseMarkdownBlocks(), parseTable()

### Community 4 - "DexieStorageRepo"
Cohesion: 0.08
Nodes (4): appDefaults(), DexieStorageRepo, createDemoSeed(), UserProfile

### Community 5 - "package.json"
Cohesion: 0.12
Nodes (16): engines, node, name, private, type, version, tailwindcss, @tailwindcss/vite (+8 more)

### Community 6 - "TypeScript and Build Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+12 more)

### Community 7 - "entryDraft.ts"
Cohesion: 0.07
Nodes (64): react-dom, convenienceFeeMinor(), calculateInvoice(), safeMinor(), addLineItem(), LineItemDraft, lineTotalMinor(), NewLine (+56 more)

### Community 8 - "Design System: KromaLedger"
Cohesion: 0.09
Nodes (22): Buttons, Cards / Containers, Colors, Components, Design System: KromaLedger, Do:, Do's and Don'ts, Don't: (+14 more)

### Community 9 - "verify-portability.mjs"
Cohesion: 0.15
Nodes (6): isExactVersion(), verifyPackage(), errors, files(), root, violations

### Community 10 - "Product"
Cohesion: 0.17
Nodes (11): Accessibility & Inclusion, Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product (+3 more)

### Community 11 - "IStorageRepo"
Cohesion: 0.06
Nodes (8): Minor-Unit Integer Money Math, DemoSeed, InvoiceCalculation, InvoiceCalculationInput, AppMeta, Invoice, InvoiceItem, IStorageRepo

### Community 13 - "dashboardAndHookOrder.test.tsx"
Cohesion: 0.09
Nodes (20): browser-image-compression, @tanstack/react-query, DexieFileStore, restoreQueryCache(), setupQueryCachePersistence(), db, files, ForegroundReconcile() (+12 more)

### Community 19 - "Transaction"
Cohesion: 0.10
Nodes (11): Atomic ZIP Vault Restore, dexie, fake-indexeddb, jszip, exportVault(), restoreVault(), AttachmentFileRecord, KromaLedgerDB (+3 more)

### Community 20 - "AIAssistantModal.tsx"
Cohesion: 0.10
Nodes (44): clearAllChatThreads(), clearChatHistory(), createEmptyThread(), createNewThread(), deleteThreadFromStorage(), exportChatHistoryAsMarkdown(), exportThreadAsMarkdown(), generateThreadTitle() (+36 more)

### Community 21 - "queries/index.ts"
Cohesion: 0.07
Nodes (56): Web App HTML Entrypoint, PWA Application Icon, date-fns, react, zustand, dispatchBrowserNotification(), getBrowserNotificationPermission(), getShownIds() (+48 more)

### Community 22 - "WalletsScreen.tsx"
Cohesion: 0.16
Nodes (24): WalletType, useDeleteTransaction(), useSaveWallet(), formatCardNumber(), getNetworkBadge(), PhysicalWalletCard, PhysicalWalletCardProps, StackedWalletDeck() (+16 more)

### Community 23 - "Category"
Cohesion: 0.29
Nodes (7): addDaysUtc(), BuildSnapshotInput, buildWeeklyBudgetSnapshot(), formatDateUtc(), getIsoWeekBoundaries(), parseDateUtc(), Category

### Community 24 - "bank-transfer-fee-chart.md"
Cohesion: 0.50
Nodes (3): Digital-First Banks, E-Wallets, Traditional Banks

### Community 25 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, fake-indexeddb, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom, typescript, vite (+3 more)

### Community 27 - "WebPresentationProvider.tsx"
Cohesion: 0.09
Nodes (18): PresentationBoxProps, PresentationButtonProps, PresentationComponents, PresentationContext, PresentationIconProps, PresentationInputProps, PresentationModalProps, PresentationProvider() (+10 more)

### Community 28 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, browser-image-compression, date-fns, dexie, jszip, react, react-dom, @tanstack/react-query (+2 more)

### Community 29 - "HomeDashboard.tsx"
Cohesion: 0.14
Nodes (33): PWA & Mobile UI Phase, attachmentCache, calculateCashflow(), calculateCashForecast(), CashflowAnalytics, CashflowInput, CashForecast, CashForecastInput (+25 more)

### Community 30 - "gemma.ts"
Cohesion: 0.33
Nodes (7): checkRateLimit(), getApiKeys(), handler(), ipRateLimitStore, MAX_REQUESTS_PER_HOUR, RateLimitRecord, recordUsage()

### Community 32 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, test, typecheck, verify:lock

### Community 33 - "MASTER PROMPT: KromaLedger — Local-First Mobile Expense, Subscription & Invoice Tracker"
Cohesion: 0.12
Nodes (15): KromaLedger acceptance checklist, 0. AGENT SKILL ACTIVATION & ORCHESTRATION DIRECTIVES, 1. BRANDING, IDENTITY & ARCHITECTURAL CONSTRAINTS, 2. TECH STACK & DETERMINISTIC DEPENDENCY GUARDRAILS, 3. DESIGN SYSTEM: "STEALTH SMOKED-GLASS & ELECTRIC VOLT", 4. TARGET DIRECTORY ARCHITECTURE, 5. SUBAGENT WORKSTREAM DECOMPOSITION (`subagent-driven-development`), 6. EXECUTION PROTOCOL & VERIFICATION GATES (+7 more)

### Community 34 - "transferFees.ts"
Cohesion: 0.36
Nodes (8): BANK_TRANSFER_FEE_RULES, detectTransferFee(), findFeeRule(), lookupTransferFee(), parseTransferRouteFromText(), TransferChannel, TransferFeeDetectionResult, TransferFeeRule

### Community 44 - "KromaLedger implementation plan"
Cohesion: 0.33
Nodes (5): KromaLedger implementation plan, Phase 1: guardrails and portable core — complete, Phase 2: local vault and state — complete, Phase 3: mobile-first interface and installability — complete, Phase 4: integration verification — complete

## Knowledge Gaps
- **17 isolated node(s):** `@types/react`, `@types/react-dom`, `tailwindcss`, `typescript`, `Deterministic Reconciliation Cycle` (+12 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 268 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `ledgerCommands.test.ts`, `Subscription`, `models/index.ts`, `MarkdownRenderer.tsx`, `DexieStorageRepo`, `package.json`, `transferFees.ts`, `entryDraft.ts`, `verify-portability.mjs`, `dashboardAndHookOrder.test.tsx`, `Transaction`, `AIAssistantModal.tsx`, `WalletsScreen.tsx`, `Category`, `WebPresentationProvider.tsx`, `HomeDashboard.tsx`, `gemma.ts`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **What connects `@types/react`, `@types/react-dom`, `tailwindcss` to the rest of the system?**
  _17 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ledgerCommands.test.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14814814814814814 - nodes in this community are weakly interconnected._
- **Why does `react` connect `queries/index.ts` to `MarkdownRenderer.tsx`, `package.json`, `entryDraft.ts`, `dashboardAndHookOrder.test.tsx`, `AIAssistantModal.tsx`, `WalletsScreen.tsx`, `WebPresentationProvider.tsx`, `HomeDashboard.tsx`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Should `Subscription` be split into smaller, more focused modules?**
  _Cohesion score 0.10591133004926108 - nodes in this community are weakly interconnected._
- **Why does `DexieStorageRepo` connect `DexieStorageRepo` to `ledgerCommands.test.ts`, `Subscription`, `models/index.ts`, `IStorageRepo`, `dashboardAndHookOrder.test.tsx`, `Transaction`, `Category`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Should `models/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08383838383838384 - nodes in this community are weakly interconnected._