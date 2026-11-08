# Graph Report - KromaLedger  (2026-11-08)

## Corpus Check
- 219 files · ~616,545 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 22 file(s) not represented in the graph (top: .woff2 6, (none) 5, .otf 4)

## Summary
- 1293 nodes · 3559 edges · 80 communities (67 shown, 13 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 103 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5e1b5317`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Invoice
- IStorageRepo
- Product: Kaban
- models/index.ts
- 3. Primitives API Reference
- package.json
- TypeScript and Build Configuration
- 2. WIRE `<KabanMascot />` INTO THE 4 TARGET UI TOUCHPOINTS
- useUIStore.ts
- verify-portability.mjs
- SmokedCard
- Web Performance Audit
- Repository Agent Instructions
- Kaban / Seed Keeper
- Integration Verification Guidelines
- Cabinet Grotesk Typography Asset
- JetBrains Mono Code Font
- Satoshi Sans-Serif Font
- App.tsx
- AIAssistantModal.tsx
- DexieStorageRepo
- Subscription
- AGY DIRECTIVE (PART 1): Kaban `NewEntryModal` 8-Mode UX Refinements
- bank-transfer-fee-chart.md
- devDependencies
- WalletFormModal.tsx
- Wrangler CLI
- dependencies
- NotificationCenterModal.tsx
- gemma.ts
- transferFees.ts
- scripts
- MASTER PROMPT: KromaLedger — Local-First Mobile Expense, Subscription & Invoice Tracker
- logo-kit/build.py
- font-study/README.md
- Kaban — concept round 1
- AGY DIRECTIVE (PART 3): Surgical UI Polish, Anti-Truncation & Layout Hierarchy Fixes
- usage-guide.md
- zipVault.ts
- react
- reconciler.ts
- customLabels.test.tsx
- KromaLedger implementation plan
- Wallet
- workers-best-practices/SKILL.md
- Kaban / chest-reference round
- Configuration
- QuickAddDrawer.tsx
- db.ts
- Design System: Kaban
- WebPresentationProvider.tsx
- Workers Runtime Patterns
- AGENTS.md
- AGY DIRECTIVE (PART 5): Complete "Bantay (Baulito)" Mascot Suite & Front-Page Integration
- HomeDashboard.tsx
- Type Validation
- AttachmentCacheManager
- Architecture
- Skill feedback
- BaulitoTour.tsx
- baulito-logo-concepts/brief.md
- Transaction
- Request & Response Handling
- qrStream.ts
- LineItemBuilder.tsx
- TopStatusHeader.tsx
- PendingAndSubsHub.tsx
- queries/index.ts
- entrySaveWorkflow.ts
- SettingsScreen.tsx
- imageOptimizer.test.ts
- WebBootstrap.tsx
- UIState
- Button
- MarkdownRenderer.tsx
- zipVault.ts
- Subscription
- vite.config.ts

## God Nodes (most connected - your core abstractions)
1. `react` - 60 edges
2. `DexieStorageRepo` - 55 edges
3. `Invoice` - 50 edges
4. `Transaction` - 49 edges
5. `HomeDashboard()` - 48 edges
6. `vitest` - 47 edges
7. `IStorageRepo` - 44 edges
8. `Subscription` - 43 edges
9. `formatCurrency()` - 43 edges
10. `Wallet` - 42 edges

## Surprising Connections (you probably didn't know these)
- `4. REFINEMENT 4: Enable `+ Custom Label` Chip Across All 8 Modes` --references--> `KabanDB`  [INFERRED]
  docs/ux-refinement.md → src/adapters/web-dexie/db.ts
- `6. Responsive Layout & Viewport Rules` --references--> `FloatingNavPill()`  [INFERRED]
  DESIGN.md → src/ui/components/FloatingNavPill.tsx
- `Legacy Compatibility` --references--> `VoltButton()`  [INFERRED]
  docs/ui-components.md → src/ui/primitives/index.tsx
- ``BrandLogo`` --references--> `BrandLogo()`  [INFERRED]
  docs/ui-components.md → src/ui/primitives/index.tsx
- ``SmokedCard` (Neobrutalist Card)` --references--> `SmokedCard()`  [INFERRED]
  docs/ui-components.md → src/ui/primitives/index.tsx

## Import Cycles
- None detected.

## Communities (80 total, 13 thin omitted)

### Community 0 - "Invoice"
Cohesion: 0.16
Nodes (4): commitInvoice(), confirmSubscriptionCycle(), LedgerCommandUnit, settleInvoice()

### Community 1 - "IStorageRepo"
Cohesion: 0.07
Nodes (7): DemoSeed, ReconcileResult, AppMeta, InvoiceItem, Transaction, UserProfile, IStorageRepo

### Community 2 - "Product: Kaban"
Cohesion: 0.17
Nodes (11): Accessibility & Inclusion, Brand Identity & Visual Language, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product: Kaban (+3 more)

### Community 3 - "models/index.ts"
Cohesion: 0.10
Nodes (31): Offline Double-Entry Ledger, KromaLedger Master Specification, detachSubscriptionHistory(), detachWalletReferences(), LedgerCommandGateway, LedgerTable, amountSchema, appMetaSchema (+23 more)

### Community 4 - "3. Primitives API Reference"
Cohesion: 0.08
Nodes (25): 1. Overview & Architectural Principles, 2. Design Tokens & Neobrutalist Conventions, 3.1 Button (`src/ui/primitives/controls.tsx`), 3.2 Field & FormField (`src/ui/primitives/forms.tsx`), 3.3 Form Controls: Input, Select, Textarea (`src/ui/primitives/controls.tsx`), 3.4 ModalShell (`src/ui/primitives/Modal.tsx`), 3.5 ChartFrame & ChartLegend (`src/ui/primitives/ChartFrame.tsx`), 3.6 Data Display & Status Primitives (`src/ui/primitives/index.tsx`) (+17 more)

### Community 5 - "package.json"
Cohesion: 0.14
Nodes (13): engines, node, name, private, type, version, browser-image-compression, tailwindcss (+5 more)

### Community 6 - "TypeScript and Build Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+12 more)

### Community 7 - "2. WIRE `<KabanMascot />` INTO THE 4 TARGET UI TOUCHPOINTS"
Cohesion: 0.20
Nodes (9): 0. CONTEXT & UX RESTRAINT RULES, 1. CREATE `src/ui/primitives/KabanMascot.tsx`, 2. WIRE `<KabanMascot />` INTO THE 4 TARGET UI TOUCHPOINTS, 3. VERIFICATION GATES, AGY DIRECTIVE (PART 4): Integrating "Bantay" — The Living Kaban Chest Mascot, Touchpoint A: Upgrade `TactileEmptyState.tsx`, Touchpoint B: `Local Vault • Backup` Modal (`VaultBackupModal.tsx`), Touchpoint C: Shortfall Radar Banner (`WalletShortfallAlertCard.tsx`) (+1 more)

### Community 8 - "useUIStore.ts"
Cohesion: 0.17
Nodes (18): APP_THEMES, applyThemeToDom(), AppThemeConfig, getStoredThemePreferences(), getThemeConfig(), resolveEffectiveMode(), saveThemePreferences(), ThemePreferences (+10 more)

### Community 9 - "verify-portability.mjs"
Cohesion: 0.08
Nodes (21): call(), evaluate(), pending, socket, call(), evaluate(), layoutOnly, pending (+13 more)

### Community 10 - "SmokedCard"
Cohesion: 0.45
Nodes (13): DashboardSkeleton(), PendingSkeleton(), ScreenSkeleton(), SettingsSkeleton(), WalletsSkeleton(), SmokedCard(), Skeleton(), SkeletonBadge() (+5 more)

### Community 11 - "Web Performance Audit"
Cohesion: 0.08
Nodes (22): Issue body, Skill feedback, Steps, What not to include, Compression & Minification, Detect Framework & Bundler, FIRST: Verify MCP Tools Available, Key Guidelines (+14 more)

### Community 13 - "Kaban / Seed Keeper"
Cohesion: 0.40
Nodes (4): Files, Kaban / Baulito — Curious Chest, Typeface and rights, Validation

### Community 19 - "App.tsx"
Cohesion: 0.17
Nodes (14): Web App HTML Entrypoint, PWA Application Icon, AIAssistantModal, App(), EditProfileModal, NotificationCenterModal, PendingAndSubsHub, QuickAddDrawer (+6 more)

### Community 20 - "AIAssistantModal.tsx"
Cohesion: 0.10
Nodes (39): zod, clearAllChatThreads(), clearChatHistory(), createEmptyThread(), createNewThread(), deleteThreadFromStorage(), exportChatHistoryAsMarkdown(), exportThreadAsMarkdown() (+31 more)

### Community 21 - "DexieStorageRepo"
Cohesion: 0.09
Nodes (4): appDefaults(), DexieStorageRepo, createDemoSeed(), AppNotification

### Community 22 - "Subscription"
Cohesion: 0.12
Nodes (11): 0. CONTEXT & ARCHITECTURAL GUARDRAILS, 1. MODULE 1: Friction & Fee Leakage Tracker (`Transfer` + `E-wallet cash-in`), 2. MODULE 2: Committed Cashflow Waterfall ("True Safe-to-Spend"), 3. MODULE 3: Debt & Installment Payoff Horizon (`Loan` + `Installment`), 5. MODULE 5: Invoice Aging, Tax & Discount Ledger (`Invoice`), 6. UI COMPONENT SPECIFICATIONS (`src/ui/screens/AnalyticsInsightsSection.tsx`), AGY DIRECTIVE (PART 2): Kaban 5-Module Financial Analytics & Insights Engine, Pure Engine Implementation: (+3 more)

### Community 23 - "AGY DIRECTIVE (PART 1): Kaban `NewEntryModal` 8-Mode UX Refinements"
Cohesion: 0.18
Nodes (10): 0. CONTEXT &amp; ARCHITECTURAL GUARDRAILS, 1. REFINEMENT 1: Differentiate `Installment` from `Loan`, 2. REFINEMENT 2: Auto-Sync `Invoice line items` with `Top AMOUNT (PHP)`, 3. REFINEMENT 3: Dynamic Contextual Labels & Placeholders per Tab, 4. REFINEMENT 4: Enable `+ Custom Label` Chip Across All 8 Modes, 5. VERIFICATION GATES, AGY DIRECTIVE (PART 1): Kaban `NewEntryModal` 8-Mode UX Refinements, Reference Implementation (`src/core/engine/installmentCalc.ts` + UI Snippet): (+2 more)

### Community 24 - "bank-transfer-fee-chart.md"
Cohesion: 0.50
Nodes (3): Digital-First Banks, E-Wallets, Traditional Banks

### Community 25 - "devDependencies"
Cohesion: 0.17
Nodes (12): devDependencies, fake-indexeddb, tailwindcss, @tailwindcss/vite, @types/qrcode, @types/react, @types/react-dom, typescript (+4 more)

### Community 26 - "WalletFormModal.tsx"
Cohesion: 0.17
Nodes (29): CardNetwork, WalletPattern, WalletType, getLogoDevUrl(), InstitutionBrandmark(), matchPhInstitution(), PH_INSTITUTIONS, PhInstitutionMeta (+21 more)

### Community 27 - "Wrangler CLI"
Cohesion: 0.15
Nodes (11): Issue body, Skill feedback, Steps, What not to include, Apply the Change, Inspect the Project, Retrieve What the Task Needs, Skill feedback (+3 more)

### Community 28 - "dependencies"
Cohesion: 0.17
Nodes (12): dependencies, browser-image-compression, date-fns, dexie, jsqr, jszip, qrcode, react (+4 more)

### Community 29 - "NotificationCenterModal.tsx"
Cohesion: 0.34
Nodes (12): dispatchBrowserNotification(), getBrowserNotificationPermission(), getShownIds(), isBrowserNotificationSupported(), markShownId(), requestBrowserNotificationPermission(), syncBrowserNotifications(), useClearNotifications() (+4 more)

### Community 30 - "gemma.ts"
Cohesion: 0.33
Nodes (7): checkRateLimit(), getApiKeys(), handler(), ipRateLimitStore, MAX_REQUESTS_PER_HOUR, RateLimitRecord, recordUsage()

### Community 31 - "transferFees.ts"
Cohesion: 0.36
Nodes (8): BANK_TRANSFER_FEE_RULES, detectTransferFee(), findFeeRule(), lookupTransferFee(), parseTransferRouteFromText(), TransferChannel, TransferFeeDetectionResult, TransferFeeRule

### Community 32 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, test, typecheck, verify:lock

### Community 33 - "MASTER PROMPT: KromaLedger — Local-First Mobile Expense, Subscription & Invoice Tracker"
Cohesion: 0.12
Nodes (15): KromaLedger acceptance checklist, 0. AGENT SKILL ACTIVATION & ORCHESTRATION DIRECTIVES, 1. BRANDING, IDENTITY & ARCHITECTURAL CONSTRAINTS, 2. TECH STACK & DETERMINISTIC DEPENDENCY GUARDRAILS, 3. DESIGN SYSTEM: "STEALTH SMOKED-GLASS & ELECTRIC VOLT", 4. TARGET DIRECTORY ARCHITECTURE, 5. SUBAGENT WORKSTREAM DECOMPOSITION (`subagent-driven-development`), 6. EXECUTION PROTOCOL & VERIFICATION GATES (+7 more)

### Community 34 - "logo-kit/build.py"
Cohesion: 0.09
Nodes (9): build(), word_paths(), build(), contrast(), group(), symbol(), word(), write() (+1 more)

### Community 36 - "Kaban — concept round 1"
Cohesion: 0.33
Nodes (5): Construction, Kaban — concept round 1, Longlist, Review, Scope

### Community 37 - "AGY DIRECTIVE (PART 3): Surgical UI Polish, Anti-Truncation & Layout Hierarchy Fixes"
Cohesion: 0.10
Nodes (19): 0. CONTEXT & OBJECTIVE, 1. FIX 1: Eliminate Text & Number Truncation in `CommittedWaterfallCard.tsx`, 2. FIX 2: Replace the `Module 4` Debug Badge on `INVOICE AGING & TAX LEDGER`, 3. FIX 3: Un-Cramp `TRANSFER & CASH-IN FRICTION` and `INSTALLMENT & LOAN HORIZON`, 4. FIX 4: Tactile Neobrutalist Empty States with Quick-Action Triggers, 5. FIX 5: Dashboard View Mode Switcher (`Core Ledger` vs. `Deep Analytics`), 6. VERIFICATION CHECKLIST, AGY DIRECTIVE (PART 3): Surgical UI Polish, Anti-Truncation & Layout Hierarchy Fixes (+11 more)

### Community 39 - "zipVault.ts"
Cohesion: 0.14
Nodes (14): jsqr, qrcode, QrAssemblerProgress, QrStreamBatch, SyncDumpPayload, SyncRestoreOptions, SyncRestoreSummary, StorageContext (+6 more)

### Community 40 - "react"
Cohesion: 0.12
Nodes (18): Props (`FieldProps` / `FormFieldProps`), react, ButtonProps, ButtonSize, ButtonVariant, buttonVariants, InputProps, SelectProps (+10 more)

### Community 42 - "reconciler.ts"
Cohesion: 0.27
Nodes (8): Deterministic Reconciliation Cycle, Portable Core Engine Phase, addDaysUtc(), asUtcDate(), cycleDate(), daysBetweenUtc(), PendingConfirmation, reconcile()

### Community 43 - "customLabels.test.tsx"
Cohesion: 0.47
Nodes (5): CustomLabelPicker(), CustomLabelPickerProps, mergeCustomLabel(), normalizeLabel(), PRESET_LABELS

### Community 44 - "KromaLedger implementation plan"
Cohesion: 0.33
Nodes (5): KromaLedger implementation plan, Phase 1: guardrails and portable core — complete, Phase 2: local vault and state — complete, Phase 3: mobile-first interface and installability — complete, Phase 4: integration verification — complete

### Community 45 - "Wallet"
Cohesion: 0.15
Nodes (10): addDaysUtc(), BuildSnapshotInput, buildWeeklyBudgetSnapshot(), formatDateUtc(), getIsoWeekBoundaries(), parseDateUtc(), ReconcileInput, Category (+2 more)

### Community 46 - "workers-best-practices/SKILL.md"
Cohesion: 0.20
Nodes (8): Anti-Patterns to Flag, Enable Observability, Keep Compatibility Dates Current, Place Compute Near Regional Databases, References, Scope, Skill feedback, Validation

### Community 47 - "Kaban / chest-reference round"
Cohesion: 0.40
Nodes (4): Construction and rationale, Kaban / chest-reference round, Noun–verb longlist, Refinement and validation

### Community 48 - "Configuration"
Cohesion: 0.18
Nodes (11): Binding-code consistency, Configuration, Enable nodejs_compat, Enable Workers Logs and Traces, Generate binding types with wrangler types, Keep compatibility_date current, Observability, Place compute near regional databases (+3 more)

### Community 49 - "QuickAddDrawer.tsx"
Cohesion: 0.08
Nodes (32): convenienceFeeMinor(), calculateInstallmentPlan(), InstallmentBreakdown, parseMinorInput(), sanitizeQuantityInput(), ALLOWED_ATTACHMENT_MIME_TYPES, TransferChannel, buildEntryDraft() (+24 more)

### Community 50 - "db.ts"
Cohesion: 0.16
Nodes (7): Atomic ZIP Vault Restore, fake-indexeddb, jszip, exportVault(), restoreVault(), base, createObligation()

### Community 51 - "Design System: Kaban"
Cohesion: 0.12
Nodes (15): 1. Overview & Brand Metaphor, 2. Color Palette & Semantic Tokens, 3. Typography & Sourced Typefaces, 4. Elevation, Shapes & Neobrutalist Depth, 6. Responsive Layout & Viewport Rules, 7. Do's and Don'ts, Corner Radii, Design System: Kaban (+7 more)

### Community 52 - "WebPresentationProvider.tsx"
Cohesion: 0.09
Nodes (18): PresentationBoxProps, PresentationButtonProps, PresentationComponents, PresentationContext, PresentationIconProps, PresentationInputProps, PresentationModalProps, PresentationProvider() (+10 more)

### Community 53 - "Workers Runtime Patterns"
Cohesion: 0.20
Nodes (10): Always await or waitUntil Promises, Be aware of platform limits, Code Patterns, Development & Testing, Do not store request-scoped state in global scope, Explicit error handling over passThroughOnException, Security, Test with @cloudflare/vitest-pool-workers (+2 more)

### Community 55 - "AGY DIRECTIVE (PART 5): Complete "Bantay (Baulito)" Mascot Suite & Front-Page Integration"
Cohesion: 0.22
Nodes (8): 0. OVERVIEW & MASCOT ASSET ARCHITECTURE, 1. THE 9-POSE FIGMA LAYER & FUNCTIONAL MATRIX, 2. PRODUCTION REACT COMPONENT (`src/ui/primitives/KabanMascot.tsx`), 3. FRONT-PAGE HERO COMPONENT (`src/ui/components/FrontPageHero.tsx`), 4. WIRING ALL 9 `baulito-*.svg` POSES ACROSS THE APP, 5. VERIFICATION CHECKLIST, AGY DIRECTIVE (PART 5): Complete "Bantay (Baulito)" Mascot Suite & Front-Page Integration, Core Rule: Non-Intrusive Placement

### Community 56 - "HomeDashboard.tsx"
Cohesion: 0.05
Nodes (78): 5. Centralized Component Conventions, PWA & Mobile UI Phase, 7. VERIFICATION GATES, date-fns, AgingBucket, analyzeInvoiceAging(), analyzeWalletLiquidity(), calculateCashflow() (+70 more)

### Community 57 - "Type Validation"
Cohesion: 0.25
Nodes (7): Binding access — the most common error, Env interface, Handler and class signatures, Serialization Boundaries, Stale class patterns, Type Validation, Workers Platform API Checks

### Community 59 - "Architecture"
Cohesion: 0.40
Nodes (5): Architecture, Use bindings for Cloudflare services, not REST APIs, Use Hyperdrive for external database connections, Use Queues and Workflows for async and background work, Use service bindings for Worker-to-Worker communication

### Community 60 - "Skill feedback"
Cohesion: 0.40
Nodes (4): Issue body, Skill feedback, Steps, What not to include

### Community 61 - "BaulitoTour.tsx"
Cohesion: 0.24
Nodes (9): markFirstBoot(), parseStartingBalance(), restartOnboarding(), BaulitoTour(), practice, PracticeMode, ProfileSetup(), walkthrough (+1 more)

### Community 63 - "Transaction"
Cohesion: 0.20
Nodes (15): dexie, react-dom, vitest, AttachmentFileRecord, KabanDB, attachmentMetaSchema, queryKeys, StorageProvider() (+7 more)

### Community 64 - "Request & Response Handling"
Cohesion: 0.50
Nodes (4): Request & Response Handling, Stream request and response bodies, Use waitUntil for work after the response, Use Zod 4.5.0 or later

### Community 65 - "qrStream.ts"
Cohesion: 0.14
Nodes (17): base64ToBytes(), bytesToBase64(), compressStringGzip(), computeCrc32(), CRC32_TABLE, decompressStringGzip(), DEFAULT_QR_CHUNK_BYTES, encodePayloadToQrFrames() (+9 more)

### Community 66 - "LineItemBuilder.tsx"
Cohesion: 0.19
Nodes (17): Minor-Unit Integer Money Math, calculateInvoice(), computeInvoiceTotals(), InvoiceCalculation, InvoiceCalculationInput, safeMinor(), addLineItem(), LineItemDraft (+9 more)

### Community 67 - "TopStatusHeader.tsx"
Cohesion: 0.29
Nodes (5): `getAvatarColors` (`src/ui/primitives/avatarColors.ts`), useProfile(), TopStatusHeader(), getAvatarColors(), BrandLogo()

### Community 68 - "PendingAndSubsHub.tsx"
Cohesion: 0.18
Nodes (16): obligationDueDate(), scheduledPaymentMinor(), buildInvoicePayment(), selectPendingOverview(), useConfirmSubscriptionPayment(), ConfirmDeleteModal(), HatchedProgressBar(), StatusDot() (+8 more)

### Community 69 - "queries/index.ts"
Cohesion: 0.23
Nodes (18): useAllTransactions(), useCategories(), useClearAllData(), useDeleteInvoice(), useDeleteSubscription(), useInvoices(), useReconcileCommand(), useRecordInvoicePayment() (+10 more)

### Community 71 - "SettingsScreen.tsx"
Cohesion: 0.27
Nodes (14): useDeleteTransaction(), useDeleteWallet(), useSaveTransaction(), useSaveWallet(), StackedWalletDeck(), BankIcon(), CashIcon(), CreditCardIcon() (+6 more)

### Community 72 - "imageOptimizer.test.ts"
Cohesion: 0.15
Nodes (12): attachmentCache, ImageCompressorFn, migrateAttachmentsToWebp(), normalizeFilenameToWebp(), optimizeImageToWebp(), setCustomImageCompressor(), WEBP_MAX_BYTES, WEBP_MAX_DIMENSION (+4 more)

### Community 73 - "WebBootstrap.tsx"
Cohesion: 0.15
Nodes (11): @tanstack/react-query, DexieFileStore, restoreQueryCache(), setupQueryCachePersistence(), db, files, ForegroundReconcile(), queryClient (+3 more)

### Community 74 - "UIState"
Cohesion: 0.19
Nodes (5): AppThemeId, ThemeMode, UIState, Toggle(), SettingsScreen()

### Community 75 - "Button"
Cohesion: 0.42
Nodes (15): blockInvalidNumberKeys(), sanitizeMoneyInput(), formatWalletLabel(), EditEntryModal(), EditInvoiceModal(), CURRENCIES, EditProfileModal(), THEME_COLORS (+7 more)

### Community 76 - "MarkdownRenderer.tsx"
Cohesion: 0.33
Nodes (8): Block, BlockComponent(), CodeBlock(), InlineContent(), MarkdownRenderer(), MarkdownRendererProps, parseMarkdownBlocks(), parseTable()

### Community 77 - "zipVault.ts"
Cohesion: 0.11
Nodes (16): Local-First Vault Architecture, Local Vault & State Phase, KromaLedger, dumpSchema, exportSyncDump(), exportSyncFrames(), fileMetaSchema, MAX_ATTACHMENT_COUNT (+8 more)

### Community 78 - "Subscription"
Cohesion: 0.22
Nodes (3): 4. MODULE 4: Per-Wallet Liquidity & Shortfall Radar, Pure Engine Implementation:, Subscription

### Community 79 - "vite.config.ts"
Cohesion: 0.29
Nodes (5): @tailwindcss/vite, vite, vite-plugin-pwa, @vitejs/plugin-react, configureServer()

## Knowledge Gaps
- **18 isolated node(s):** `@types/qrcode`, `@types/react`, `@types/react-dom`, `tailwindcss`, `typescript` (+13 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 475 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `Transaction` to `Invoice`, `models/index.ts`, `package.json`, `useUIStore.ts`, `verify-portability.mjs`, `SmokedCard`, `AIAssistantModal.tsx`, `DexieStorageRepo`, `WalletFormModal.tsx`, `gemma.ts`, `transferFees.ts`, `react`, `reconciler.ts`, `Wallet`, `QuickAddDrawer.tsx`, `db.ts`, `WebPresentationProvider.tsx`, `HomeDashboard.tsx`, `BaulitoTour.tsx`, `LineItemBuilder.tsx`, `TopStatusHeader.tsx`, `PendingAndSubsHub.tsx`, `entrySaveWorkflow.ts`, `imageOptimizer.test.ts`, `MarkdownRenderer.tsx`, `zipVault.ts`, `vite.config.ts`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `Invoice` (e.g. with `0. CONTEXT & ARCHITECTURAL GUARDRAILS` and `2. MODULE 2: Committed Cashflow Waterfall ("True Safe-to-Spend")`) actually correct?**
  _`Invoice` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@types/qrcode`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _18 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `IStorageRepo` be split into smaller, more focused modules?**
  _Cohesion score 0.06736353077816493 - nodes in this community are weakly interconnected._
- **Why does `react` connect `react` to `package.json`, `SmokedCard`, `App.tsx`, `WalletFormModal.tsx`, `NotificationCenterModal.tsx`, `zipVault.ts`, `customLabels.test.tsx`, `QuickAddDrawer.tsx`, `WebPresentationProvider.tsx`, `HomeDashboard.tsx`, `BaulitoTour.tsx`, `Transaction`, `LineItemBuilder.tsx`, `TopStatusHeader.tsx`, `PendingAndSubsHub.tsx`, `queries/index.ts`, `SettingsScreen.tsx`, `WebBootstrap.tsx`, `Button`, `MarkdownRenderer.tsx`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `HomeDashboard()` (e.g. with `dashboardAndHookOrder.test.tsx` and `renderDashboard()`) actually correct?**
  _`HomeDashboard()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `models/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1036036036036036 - nodes in this community are weakly interconnected._