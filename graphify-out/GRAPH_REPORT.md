# Graph Report - KromaLedger  (2026-10-23)

## Corpus Check
- 114 files · ~69,598 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .woff2 3, .toml 1)

## Summary
- 765 nodes · 2108 edges · 38 communities (29 shown, 9 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 43 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b2841a12`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ledgerCommands.test.ts
- IStorageRepo
- models/index.ts
- MarkdownRenderer.tsx
- DexieStorageRepo
- package.json
- TypeScript and Build Configuration
- entryDraft.ts
- Design System: KromaLedger
- verify-portability.mjs
- Product
- reconciler.ts
- Repository Agent Instructions
- App.tsx
- Integration Verification Guidelines
- Cabinet Grotesk Typography Asset
- JetBrains Mono Code Font
- Satoshi Sans-Serif Font
- zipVault.ts
- AIAssistantModal.tsx
- Subscription
- WalletsScreen.tsx
- Category
- bank-transfer-fee-chart.md
- devDependencies
- Transaction
- WebPresentationProvider.tsx
- dependencies
- index.tsx
- gemma.ts
- AttachmentCacheManager
- scripts
- MASTER PROMPT: KromaLedger — Local-First Mobile Expense, Subscription & Invoice Tracker
- notificationEngine.ts
- engines
- KromaLedger implementation plan
- AGENTS.md

## God Nodes (most connected - your core abstractions)
1. `DexieStorageRepo` - 48 edges
2. `IStorageRepo` - 44 edges
3. `Invoice` - 39 edges
4. `Transaction` - 37 edges
5. `useStorage()` - 37 edges
6. `react` - 34 edges
7. `Subscription` - 34 edges
8. `Wallet` - 30 edges
9. `formatCurrency()` - 29 edges
10. `vitest` - 28 edges

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

## Communities (38 total, 9 thin omitted)

### Community 0 - "ledgerCommands.test.ts"
Cohesion: 0.13
Nodes (5): commitInvoice(), confirmSubscriptionCycle(), LedgerCommandUnit, settleInvoice(), Invoice

### Community 1 - "IStorageRepo"
Cohesion: 0.08
Nodes (7): DemoSeed, ReconcileResult, AppMeta, AppNotification, InvoiceItem, UserProfile, IStorageRepo

### Community 2 - "models/index.ts"
Cohesion: 0.10
Nodes (31): Offline Double-Entry Ledger, KromaLedger Master Specification, date-fns, vitest, detachSubscriptionHistory(), detachWalletReferences(), LedgerCommandGateway, LedgerTable (+23 more)

### Community 3 - "MarkdownRenderer.tsx"
Cohesion: 0.33
Nodes (8): Block, BlockComponent(), CodeBlock(), InlineContent(), MarkdownRenderer(), MarkdownRendererProps, parseMarkdownBlocks(), parseTable()

### Community 4 - "DexieStorageRepo"
Cohesion: 0.10
Nodes (3): appDefaults(), DexieStorageRepo, createDemoSeed()

### Community 5 - "package.json"
Cohesion: 0.15
Nodes (13): name, private, type, version, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom (+5 more)

### Community 6 - "TypeScript and Build Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+12 more)

### Community 7 - "entryDraft.ts"
Cohesion: 0.07
Nodes (44): Minor-Unit Integer Money Math, calculateInvoice(), InvoiceCalculation, InvoiceCalculationInput, safeMinor(), addLineItem(), LineItemDraft, lineTotalMinor() (+36 more)

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
Cohesion: 0.27
Nodes (8): Deterministic Reconciliation Cycle, Portable Core Engine Phase, addDaysUtc(), asUtcDate(), cycleDate(), daysBetweenUtc(), PendingConfirmation, reconcile()

### Community 13 - "App.tsx"
Cohesion: 0.06
Nodes (35): Web App HTML Entrypoint, PWA Application Icon, @tanstack/react-query, restoreQueryCache(), setupQueryCachePersistence(), db, files, ForegroundReconcile() (+27 more)

### Community 19 - "zipVault.ts"
Cohesion: 0.06
Nodes (21): Local-First Vault Architecture, Atomic ZIP Vault Restore, Local Vault & State Phase, Capabilities and Constraints, KromaLedger, browser-image-compression, dexie, fake-indexeddb (+13 more)

### Community 20 - "AIAssistantModal.tsx"
Cohesion: 0.10
Nodes (44): zod, clearAllChatThreads(), clearChatHistory(), createEmptyThread(), createNewThread(), deleteThreadFromStorage(), exportChatHistoryAsMarkdown(), exportThreadAsMarkdown() (+36 more)

### Community 21 - "Subscription"
Cohesion: 0.16
Nodes (3): selectPendingOverview(), dateOnlySchema, Subscription

### Community 22 - "WalletsScreen.tsx"
Cohesion: 0.07
Nodes (88): PWA & Mobile UI Phase, react, react-dom, attachmentCache, calculateCashflow(), calculateCashForecast(), blockInvalidNumberKeys(), parseMinorInput() (+80 more)

### Community 23 - "Category"
Cohesion: 0.16
Nodes (9): addDaysUtc(), BuildSnapshotInput, buildWeeklyBudgetSnapshot(), formatDateUtc(), getIsoWeekBoundaries(), parseDateUtc(), ReconcileInput, Category (+1 more)

### Community 24 - "bank-transfer-fee-chart.md"
Cohesion: 0.50
Nodes (3): Digital-First Banks, E-Wallets, Traditional Banks

### Community 25 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, fake-indexeddb, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom, typescript, vite (+3 more)

### Community 26 - "Transaction"
Cohesion: 0.17
Nodes (5): CashflowAnalytics, CashflowInput, CashForecast, CashForecastInput, Transaction

### Community 27 - "WebPresentationProvider.tsx"
Cohesion: 0.09
Nodes (19): PresentationBoxProps, PresentationButtonProps, PresentationComponents, PresentationContext, PresentationIconProps, PresentationInputProps, PresentationModalProps, PresentationProvider() (+11 more)

### Community 28 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, browser-image-compression, date-fns, dexie, jszip, react, react-dom, @tanstack/react-query (+2 more)

### Community 29 - "index.tsx"
Cohesion: 0.27
Nodes (19): zustand, currentMonth, getInitialTab(), NavTab, parseNavTab(), QuickAddMode, DashboardSkeleton(), PendingSkeleton() (+11 more)

### Community 30 - "gemma.ts"
Cohesion: 0.33
Nodes (7): checkRateLimit(), getApiKeys(), handler(), ipRateLimitStore, MAX_REQUESTS_PER_HOUR, RateLimitRecord, recordUsage()

### Community 32 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, test, typecheck, verify:lock

### Community 33 - "MASTER PROMPT: KromaLedger — Local-First Mobile Expense, Subscription & Invoice Tracker"
Cohesion: 0.12
Nodes (15): KromaLedger acceptance checklist, 0. AGENT SKILL ACTIVATION & ORCHESTRATION DIRECTIVES, 1. BRANDING, IDENTITY & ARCHITECTURAL CONSTRAINTS, 2. TECH STACK & DETERMINISTIC DEPENDENCY GUARDRAILS, 3. DESIGN SYSTEM: "STEALTH SMOKED-GLASS & ELECTRIC VOLT", 4. TARGET DIRECTORY ARCHITECTURE, 5. SUBAGENT WORKSTREAM DECOMPOSITION (`subagent-driven-development`), 6. EXECUTION PROTOCOL & VERIFICATION GATES (+7 more)

### Community 34 - "notificationEngine.ts"
Cohesion: 0.54
Nodes (7): dispatchBrowserNotification(), getBrowserNotificationPermission(), getShownIds(), isBrowserNotificationSupported(), markShownId(), requestBrowserNotificationPermission(), syncBrowserNotifications()

### Community 44 - "KromaLedger implementation plan"
Cohesion: 0.33
Nodes (5): KromaLedger implementation plan, Phase 1: guardrails and portable core — complete, Phase 2: local vault and state — complete, Phase 3: mobile-first interface and installability — complete, Phase 4: integration verification — complete

## Knowledge Gaps
- **17 isolated node(s):** `@types/react`, `@types/react-dom`, `tailwindcss`, `typescript`, `Deterministic Reconciliation Cycle` (+12 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 263 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `models/index.ts` to `MarkdownRenderer.tsx`, `DexieStorageRepo`, `package.json`, `entryDraft.ts`, `verify-portability.mjs`, `reconciler.ts`, `zipVault.ts`, `AIAssistantModal.tsx`, `Subscription`, `WalletsScreen.tsx`, `Category`, `WebPresentationProvider.tsx`, `index.tsx`, `gemma.ts`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **What connects `@types/react`, `@types/react-dom`, `tailwindcss` to the rest of the system?**
  _17 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ledgerCommands.test.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13043478260869565 - nodes in this community are weakly interconnected._
- **Why does `react` connect `WalletsScreen.tsx` to `MarkdownRenderer.tsx`, `package.json`, `entryDraft.ts`, `App.tsx`, `AIAssistantModal.tsx`, `WebPresentationProvider.tsx`, `index.tsx`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Should `IStorageRepo` be split into smaller, more focused modules?**
  _Cohesion score 0.07899159663865546 - nodes in this community are weakly interconnected._
- **Why does `DexieStorageRepo` connect `DexieStorageRepo` to `ledgerCommands.test.ts`, `IStorageRepo`, `models/index.ts`, `App.tsx`, `zipVault.ts`, `Subscription`, `Category`, `Transaction`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Should `models/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._