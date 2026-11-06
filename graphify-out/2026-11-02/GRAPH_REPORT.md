# Graph Report - KromaLedger  (2026-11-02)

## Corpus Check
- 150 files · ~405,548 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 19 file(s) not represented in the graph (top: .woff2 6, .otf 4, (none) 3)

## Summary
- 906 nodes · 2527 edges · 52 communities (38 shown, 14 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 67 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `942bf723`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ledgerCommands.ts
- Invoice
- Product: Kaban
- models/index.ts
- DexieStorageRepo
- package.json
- TypeScript and Build Configuration
- HomeDashboard.tsx
- CashflowBreakdownGraph.tsx
- verify-portability.mjs
- WalletFormModal.tsx
- IStorageRepo
- Repository Agent Instructions
- Kaban / Seed Keeper
- Integration Verification Guidelines
- Cabinet Grotesk Typography Asset
- JetBrains Mono Code Font
- Satoshi Sans-Serif Font
- zipVault.ts
- AIAssistantModal.tsx
- queries/index.ts
- PendingAndSubsHub.tsx
- Wallet
- bank-transfer-fee-chart.md
- devDependencies
- controls.tsx
- WebPresentationProvider.tsx
- dependencies
- WebBootstrap.tsx
- gemma.ts
- PendingAndSubsHub.tsx
- scripts
- MASTER PROMPT: KromaLedger — Local-First Mobile Expense, Subscription & Invoice Tracker
- logo-kit/build.py
- font-study/README.md
- Kaban — concept round 1
- engines
- usage-guide.md
- dashboardAndHookOrder.test.tsx
- queries/index.ts
- WalletsScreen.tsx
- NotificationCenterModal.tsx
- KromaLedger implementation plan
- MarkdownRenderer.tsx
- AttachmentCacheManager
- Kaban / chest-reference round
- useUIStore.ts
- KromaLedger
- getAvatarColors
- AGENTS.md

## God Nodes (most connected - your core abstractions)
1. `DexieStorageRepo` - 50 edges
2. `IStorageRepo` - 44 edges
3. `react` - 41 edges
4. `Invoice` - 41 edges
5. `Transaction` - 38 edges
6. `useStorage()` - 38 edges
7. `Subscription` - 34 edges
8. `Wallet` - 33 edges
9. `Button()` - 33 edges
10. `vitest` - 32 edges

## Surprising Connections (you probably didn't know these)
- `1. Overview & Brand Metaphor` --references--> `KromaLedgerDB`  [INFERRED]
  DESIGN.md → src/adapters/web-dexie/db.ts
- `Capabilities and Constraints` --references--> `KromaLedgerDB`  [INFERRED]
  PRODUCT.md → src/adapters/web-dexie/db.ts
- `6. Responsive Layout & Viewport Rules` --references--> `FloatingNavPill()`  [INFERRED]
  DESIGN.md → src/ui/components/FloatingNavPill.tsx
- `Legacy Compatibility` --references--> `VoltButton()`  [INFERRED]
  docs/ui-components.md → src/ui/primitives/index.tsx
- ``SmokedCard` (Neobrutalist Card)` --references--> `SmokedCard()`  [INFERRED]
  docs/ui-components.md → src/ui/primitives/index.tsx

## Import Cycles
- None detected.

## Communities (52 total, 14 thin omitted)

### Community 0 - "ledgerCommands.ts"
Cohesion: 0.11
Nodes (12): Offline Double-Entry Ledger, KromaLedger Master Specification, commitInvoice(), confirmSubscriptionCycle(), detachSubscriptionHistory(), detachWalletReferences(), LedgerCommandGateway, LedgerCommandUnit (+4 more)

### Community 1 - "Invoice"
Cohesion: 0.15
Nodes (9): Deterministic Reconciliation Cycle, Portable Core Engine Phase, addDaysUtc(), asUtcDate(), daysBetweenUtc(), PendingConfirmation, reconcile(), ReconcileInput (+1 more)

### Community 2 - "Product: Kaban"
Cohesion: 0.17
Nodes (11): Accessibility & Inclusion, Brand Identity & Visual Language, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product: Kaban (+3 more)

### Community 3 - "models/index.ts"
Cohesion: 0.10
Nodes (26): vitest, createDemoSeed(), amountSchema, appMetaSchema, appNotificationSchema, AttachmentMimeType, billingCycleSchema, cardNetworkSchema (+18 more)

### Community 4 - "DexieStorageRepo"
Cohesion: 0.08
Nodes (6): appDefaults(), DexieStorageRepo, DemoSeed, AppMeta, InvoiceItem, UserProfile

### Community 5 - "package.json"
Cohesion: 0.15
Nodes (13): name, private, type, version, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom (+5 more)

### Community 6 - "TypeScript and Build Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+12 more)

### Community 7 - "HomeDashboard.tsx"
Cohesion: 0.13
Nodes (20): PWA & Mobile UI Phase, attachmentCache, calculateCashflow(), calculateCashForecast(), CashflowAnalytics, CashForecast, CashForecastInput, queryKeys (+12 more)

### Community 8 - "CashflowBreakdownGraph.tsx"
Cohesion: 0.12
Nodes (15): 1. Overview & Brand Metaphor, 2. Color Palette & Semantic Tokens, 3. Typography & Sourced Typefaces, 4. Elevation, Shapes & Neobrutalist Depth, 6. Responsive Layout & Viewport Rules, 7. Do's and Don'ts, Corner Radii, Design System: Kaban (+7 more)

### Community 9 - "verify-portability.mjs"
Cohesion: 0.11
Nodes (13): call(), evaluate(), layoutOnly, pending, ready(), record(), socket, isExactVersion() (+5 more)

### Community 10 - "WalletFormModal.tsx"
Cohesion: 0.21
Nodes (22): CardNetwork, WalletPattern, WalletType, InstitutionBrandmark(), matchPhInstitution(), PH_INSTITUTIONS, PhInstitutionMeta, renderBrandmarkGlyph() (+14 more)

### Community 11 - "IStorageRepo"
Cohesion: 0.07
Nodes (6): CashflowInput, ReconcileResult, AppNotification, Subscription, Transaction, IStorageRepo

### Community 13 - "Kaban / Seed Keeper"
Cohesion: 0.40
Nodes (4): Files, Kaban / Seed Keeper, Typeface and rights, Validation

### Community 19 - "zipVault.ts"
Cohesion: 0.09
Nodes (18): Atomic ZIP Vault Restore, Local Vault & State Phase, dexie, fake-indexeddb, jszip, zod, dumpSchema, exportVault() (+10 more)

### Community 20 - "AIAssistantModal.tsx"
Cohesion: 0.10
Nodes (44): clearAllChatThreads(), clearChatHistory(), createEmptyThread(), createNewThread(), deleteThreadFromStorage(), exportChatHistoryAsMarkdown(), exportThreadAsMarkdown(), generateThreadTitle() (+36 more)

### Community 21 - "queries/index.ts"
Cohesion: 0.15
Nodes (21): ALLOWED_ATTACHMENT_MIME_TYPES, EntrySaveProgress, saveEntryAndAttachment(), useCategories(), useDeleteInvoice(), useDeleteSubscription(), useReconcileCommand(), useRecordInvoicePayment() (+13 more)

### Community 22 - "PendingAndSubsHub.tsx"
Cohesion: 0.10
Nodes (28): Minor-Unit Integer Money Math, calculateInvoice(), InvoiceCalculation, InvoiceCalculationInput, safeMinor(), addLineItem(), LineItemDraft, lineTotalMinor() (+20 more)

### Community 23 - "Wallet"
Cohesion: 0.17
Nodes (8): addDaysUtc(), BuildSnapshotInput, buildWeeklyBudgetSnapshot(), formatDateUtc(), getIsoWeekBoundaries(), parseDateUtc(), Category, Wallet

### Community 24 - "bank-transfer-fee-chart.md"
Cohesion: 0.50
Nodes (3): Digital-First Banks, E-Wallets, Traditional Banks

### Community 25 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, fake-indexeddb, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom, typescript, vite (+3 more)

### Community 26 - "controls.tsx"
Cohesion: 0.07
Nodes (28): 1. Overview & Architectural Principles, 2. Design Tokens & Neobrutalist Conventions, 3.1 Button (`src/ui/primitives/controls.tsx`), 3.2 Field & FormField (`src/ui/primitives/forms.tsx`), 3.3 Form Controls: Input, Select, Textarea (`src/ui/primitives/controls.tsx`), 3.4 ModalShell (`src/ui/primitives/Modal.tsx`), 3.5 ChartFrame & ChartLegend (`src/ui/primitives/ChartFrame.tsx`), 3.6 Data Display & Status Primitives (`src/ui/primitives/index.tsx`) (+20 more)

### Community 27 - "WebPresentationProvider.tsx"
Cohesion: 0.09
Nodes (20): react-dom, PresentationBoxProps, PresentationButtonProps, PresentationComponents, PresentationContext, PresentationIconProps, PresentationInputProps, PresentationModalProps (+12 more)

### Community 28 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, browser-image-compression, date-fns, dexie, jszip, react, react-dom, @tanstack/react-query (+2 more)

### Community 29 - "WebBootstrap.tsx"
Cohesion: 0.29
Nodes (18): 5. Centralized Component Conventions, DashboardSkeleton(), PendingSkeleton(), ScreenSkeleton(), SettingsSkeleton(), WalletsSkeleton(), ChartFrame(), ChartFrameProps (+10 more)

### Community 30 - "gemma.ts"
Cohesion: 0.33
Nodes (7): checkRateLimit(), getApiKeys(), handler(), ipRateLimitStore, MAX_REQUESTS_PER_HOUR, RateLimitRecord, recordUsage()

### Community 31 - "PendingAndSubsHub.tsx"
Cohesion: 0.08
Nodes (63): react, convenienceFeeMinor(), blockInvalidNumberKeys(), parseMinorInput(), sanitizeMoneyInput(), scheduledPaymentMinor(), buildInvoicePayment(), selectPendingOverview() (+55 more)

### Community 32 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, test, typecheck, verify:lock

### Community 33 - "MASTER PROMPT: KromaLedger — Local-First Mobile Expense, Subscription & Invoice Tracker"
Cohesion: 0.12
Nodes (15): KromaLedger acceptance checklist, 0. AGENT SKILL ACTIVATION & ORCHESTRATION DIRECTIVES, 1. BRANDING, IDENTITY & ARCHITECTURAL CONSTRAINTS, 2. TECH STACK & DETERMINISTIC DEPENDENCY GUARDRAILS, 3. DESIGN SYSTEM: "STEALTH SMOKED-GLASS & ELECTRIC VOLT", 4. TARGET DIRECTORY ARCHITECTURE, 5. SUBAGENT WORKSTREAM DECOMPOSITION (`subagent-driven-development`), 6. EXECUTION PROTOCOL & VERIFICATION GATES (+7 more)

### Community 34 - "logo-kit/build.py"
Cohesion: 0.10
Nodes (9): build(), word_paths(), build(), contrast(), group(), symbol(), word(), write() (+1 more)

### Community 36 - "Kaban — concept round 1"
Cohesion: 0.33
Nodes (5): Construction, Kaban — concept round 1, Longlist, Review, Scope

### Community 39 - "dashboardAndHookOrder.test.tsx"
Cohesion: 0.10
Nodes (15): browser-image-compression, @tanstack/react-query, DexieFileStore, restoreQueryCache(), setupQueryCachePersistence(), db, files, ForegroundReconcile() (+7 more)

### Community 40 - "queries/index.ts"
Cohesion: 0.13
Nodes (17): Web App HTML Entrypoint, PWA Application Icon, AIAssistantModal, App(), EditProfileModal, NotificationCenterModal, PendingAndSubsHub, QuickAddDrawer (+9 more)

### Community 42 - "WalletsScreen.tsx"
Cohesion: 0.21
Nodes (20): useClearAllData(), useDeleteTransaction(), useDeleteWallet(), useInvoices(), useResetToDemo(), useSaveWallet(), useTransactionCount(), useWallets() (+12 more)

### Community 43 - "NotificationCenterModal.tsx"
Cohesion: 0.34
Nodes (12): dispatchBrowserNotification(), getBrowserNotificationPermission(), getShownIds(), isBrowserNotificationSupported(), markShownId(), requestBrowserNotificationPermission(), syncBrowserNotifications(), useClearNotifications() (+4 more)

### Community 44 - "KromaLedger implementation plan"
Cohesion: 0.33
Nodes (5): KromaLedger implementation plan, Phase 1: guardrails and portable core — complete, Phase 2: local vault and state — complete, Phase 3: mobile-first interface and installability — complete, Phase 4: integration verification — complete

### Community 45 - "MarkdownRenderer.tsx"
Cohesion: 0.33
Nodes (8): Block, BlockComponent(), CodeBlock(), InlineContent(), MarkdownRenderer(), MarkdownRendererProps, parseMarkdownBlocks(), parseTable()

### Community 47 - "Kaban / chest-reference round"
Cohesion: 0.40
Nodes (4): Construction and rationale, Kaban / chest-reference round, Noun–verb longlist, Refinement and validation

### Community 48 - "useUIStore.ts"
Cohesion: 0.29
Nodes (7): date-fns, zustand, currentMonth, getInitialTab(), NavTab, parseNavTab(), QuickAddMode

## Knowledge Gaps
- **17 isolated node(s):** `@types/react`, `@types/react-dom`, `tailwindcss`, `typescript`, `Deterministic Reconciliation Cycle` (+12 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 313 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `models/index.ts` to `ledgerCommands.ts`, `Invoice`, `package.json`, `HomeDashboard.tsx`, `verify-portability.mjs`, `WalletFormModal.tsx`, `MarkdownRenderer.tsx`, `getAvatarColors`, `zipVault.ts`, `AIAssistantModal.tsx`, `queries/index.ts`, `PendingAndSubsHub.tsx`, `Wallet`, `WebPresentationProvider.tsx`, `WebBootstrap.tsx`, `gemma.ts`, `PendingAndSubsHub.tsx`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **What connects `@types/react`, `@types/react-dom`, `tailwindcss` to the rest of the system?**
  _17 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ledgerCommands.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10873440285204991 - nodes in this community are weakly interconnected._
- **Why does `react` connect `PendingAndSubsHub.tsx` to `package.json`, `dashboardAndHookOrder.test.tsx`, `queries/index.ts`, `HomeDashboard.tsx`, `WalletFormModal.tsx`, `NotificationCenterModal.tsx`, `WalletsScreen.tsx`, `MarkdownRenderer.tsx`, `AIAssistantModal.tsx`, `queries/index.ts`, `PendingAndSubsHub.tsx`, `WebPresentationProvider.tsx`, `WebBootstrap.tsx`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Should `models/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09672830725462304 - nodes in this community are weakly interconnected._
- **Why does `DexieStorageRepo` connect `DexieStorageRepo` to `ledgerCommands.ts`, `Invoice`, `models/index.ts`, `dashboardAndHookOrder.test.tsx`, `HomeDashboard.tsx`, `IStorageRepo`, `zipVault.ts`, `Wallet`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Should `DexieStorageRepo` be split into smaller, more focused modules?**
  _Cohesion score 0.08374384236453201 - nodes in this community are weakly interconnected._