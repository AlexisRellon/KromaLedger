# Graph Report - automated-interest  (2026-11-15)

## Corpus Check
- 271 files · ~643,400 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 23 file(s) not represented in the graph (top: (none) 6, .woff2 6, .otf 4)

## Summary
- 1817 nodes · 4983 edges · 96 communities (84 shown, 12 thin omitted)
- Extraction: 85% EXTRACTED · 15% INFERRED · 0% AMBIGUOUS · INFERRED: 759 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `54eb7b3b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ledgerCommands.test.ts
- Transaction
- Product: Kaban
- models/index.ts
- 3.6 Data Display & Status Primitives (`src/ui/primitives/index.tsx`)
- package.json
- compilerOptions
- 2. WIRE `<KabanMascot />` INTO THE 4 TARGET UI TOUCHPOINTS
- Design System: Kaban
- verify-portability.mjs
- Interface
- Web Performance Audit
- Agent Guidance: agents_md
- kaban/README.md
- Integration Verification Phase
- Web Performance Audit
- interestEngine.ts
- Automated Per-Account Interest Posting (PH Digital Banks)
- Automated Per-Account Interest Posting (PH Digital Banks)
- chatHistoryStorage.ts
- DexieStorageRepo
- Invoice
- Interface
- bank-transfer-fee-chart.md
- devDependencies
- Interface
- Wrangler CLI
- dependencies
- EGM Drift Report (2026-11-14)
- gemma.ts
- InterestRule
- scripts
- MASTER PROMPT: KromaLedger — Local-First Mobile Expense, Subscription & Invoice Tracker
- logo-kit/build.py
- Kaban / local font comparison
- Kaban — concept round 1
- AGY DIRECTIVE (PART 3): Surgical UI Polish, Anti-Truncation & Layout Hierarchy Fixes
- usage-guide.md
- queries/index.ts
- Target Files to Create/Modify
- reconciler.ts
- Button
- KromaLedger implementation plan
- aiBudgetSnapshot.ts
- .claude/skills/workers-best-practices/SKILL.md
- chest-round
- Configuration
- react
- .reconcile
- QuickAddDrawer.tsx
- WebPresentationProvider.tsx
- Workers Runtime Patterns
- AGENTS.md
- AttachmentCacheManager
- cashflowAnalytics.ts
- Type Validation
- HomeDashboard
- Architecture
- Skill feedback
- GitHub Ship & Triage
- baulito-logo-concepts
- Wrangler CLI
- Request & Response Handling
- qrStream.ts
- zipVault.ts
- HomeDashboard.tsx
- paymentWorkflows.test.ts
- App.tsx
- UIState
- PendingAndSubsHub.tsx
- AGY DIRECTIVE (PART 5): Complete "Bantay (Baulito)" Mascot Suite & Front-Page Integration
- WalletInterestSettings.tsx
- BaulitoTour.tsx
- WebBootstrap.tsx
- MarkdownRenderer.tsx
- README.md
- DexieFileStore
- .agents/skills/workers-best-practices/SKILL.md
- Configuration
- Workers Runtime Patterns
- WebBootstrap
- Type Validation
- Kaban / Baulito — Curious Chest
- Netlify Functions
- scripts
- Architecture
- Skill feedback
- Request & Response Handling
- triage-dependabot.sh
- check-dependabot.sh
- check-prs.sh
- gates.sh
- ship.sh
- squash-pr.sh

## God Nodes (most connected - your core abstractions)
1. `DexieStorageRepo` - 65 edges
2. `react` - 63 edges
3. `IStorageRepo` - 60 edges
4. `Transaction` - 57 edges
5. `HomeDashboard()` - 54 edges
6. `Invoice` - 52 edges
7. `Button()` - 51 edges
8. `vitest` - 50 edges
9. `Wallet` - 49 edges
10. `useStorage()` - 49 edges

## Surprising Connections (you probably didn't know these)
- `11. `src/adapters/backup/zipVault.ts` (Modify)` --references--> `SyncDumpPayload`  [INFERRED]
  design_draft.md → src/adapters/backup/zipVault.ts
- `13. `tests/core/reconciler.test.ts`, `tests/core/cashflowAnalytics.test.ts`, `tests/adapters/vault.test.ts`, & `tests/adapters/storage.test.ts` (Modify)` --references--> `DexieStorageRepo`  [INFERRED]
  docs/designs/automated-interest-posting.md → src/adapters/web-dexie/DexieStorageRepo.ts
- `1. System Data Flow` --references--> `ForegroundReconcile()`  [INFERRED]
  design_draft.md → src/adapters/web-dexie/WebBootstrap.tsx
- `1. System Data Flow` --references--> `ForegroundReconcile()`  [INFERRED]
  docs/designs/automated-interest-posting.md → src/adapters/web-dexie/WebBootstrap.tsx
- `9. `src/adapters/web-dexie/db.ts` (Modify)` --references--> `KabanDB`  [INFERRED]
  design_draft.md → src/adapters/web-dexie/db.ts

## Import Cycles
- None detected.

## Communities (96 total, 12 thin omitted)

### Community 0 - "ledgerCommands.test.ts"
Cohesion: 0.11
Nodes (7): commitInvoice(), confirmSubscriptionCycle(), LedgerCommandGateway, LedgerCommandUnit, settleInvoice(), Side Effects, Subscription

### Community 1 - "Transaction"
Cohesion: 0.12
Nodes (10): 6. `src/core/engine/reconciler.ts` (Modify), 10. `src/adapters/web-dexie/db.ts` (Modify), 11. `src/adapters/web-dexie/DexieStorageRepo.ts` (Modify), 13. `tests/core/reconciler.test.ts`, `tests/core/cashflowAnalytics.test.ts`, `tests/adapters/vault.test.ts`, & `tests/adapters/storage.test.ts` (Modify), 7. `src/core/engine/reconciler.ts` (Modify), 9. `src/core/ports/IStorageRepo.ts` (Modify), Phase 2: Reconciler, Cashflow Analytics, Storage & Backup, ReconcileInput (+2 more)

### Community 2 - "Product: Kaban"
Cohesion: 0.17
Nodes (11): Accessibility & Inclusion, Brand Identity & Visual Language, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product: Kaban (+3 more)

### Community 3 - "models/index.ts"
Cohesion: 0.08
Nodes (33): Offline Double-Entry Ledger, KromaLedger Master Specification, createDemoSeed(), detachSubscriptionHistory(), detachWalletReferences(), LedgerTable, amountSchema, appMetaSchema (+25 more)

### Community 4 - "3.6 Data Display & Status Primitives (`src/ui/primitives/index.tsx`)"
Cohesion: 0.11
Nodes (18): 1. Overview & Architectural Principles, 2. Design Tokens & Neobrutalist Conventions, 3.1 Button (`src/ui/primitives/controls.tsx`), 3.2 Field & FormField (`src/ui/primitives/forms.tsx`), 3.3 Form Controls: Input, Select, Textarea (`src/ui/primitives/controls.tsx`), 3.4 ModalShell (`src/ui/primitives/Modal.tsx`), 3.5 ChartFrame & ChartLegend (`src/ui/primitives/ChartFrame.tsx`), 3. Primitives API Reference (+10 more)

### Community 5 - "package.json"
Cohesion: 0.11
Nodes (18): engines, node, name, private, type, version, browser-image-compression, tailwindcss (+10 more)

### Community 6 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+12 more)

### Community 7 - "2. WIRE `<KabanMascot />` INTO THE 4 TARGET UI TOUCHPOINTS"
Cohesion: 0.20
Nodes (9): 0. CONTEXT & UX RESTRAINT RULES, 1. CREATE `src/ui/primitives/KabanMascot.tsx`, 2. WIRE `<KabanMascot />` INTO THE 4 TARGET UI TOUCHPOINTS, 3. VERIFICATION GATES, AGY DIRECTIVE (PART 4): Integrating "Bantay" — The Living Kaban Chest Mascot, Touchpoint A: Upgrade `TactileEmptyState.tsx`, Touchpoint B: `Local Vault • Backup` Modal (`VaultBackupModal.tsx`), Touchpoint C: Shortfall Radar Banner (`WalletShortfallAlertCard.tsx`) (+1 more)

### Community 8 - "Design System: Kaban"
Cohesion: 0.12
Nodes (15): 1. Overview & Brand Metaphor, 2. Color Palette & Semantic Tokens, 3. Typography & Sourced Typefaces, 4. Elevation, Shapes & Neobrutalist Depth, 6. Responsive Layout & Viewport Rules, 7. Do's and Don'ts, Corner Radii, Design System: Kaban (+7 more)

### Community 9 - "verify-portability.mjs"
Cohesion: 0.08
Nodes (21): call(), evaluate(), pending, socket, call(), evaluate(), layoutOnly, pending (+13 more)

### Community 10 - "Interface"
Cohesion: 0.08
Nodes (50): Props (`FieldProps` / `FormFieldProps`), EMPTY_ACTIVITY_FILTERS, filterWalletActivity(), WalletActivityFilters, ActivityFilters(), Subdirectories & Boundaries, DashboardSkeleton(), PendingSkeleton() (+42 more)

### Community 11 - "Web Performance Audit"
Cohesion: 0.08
Nodes (22): Issue body, Skill feedback, Steps, What not to include, Compression & Minification, Detect Framework & Bundler, FIRST: Verify MCP Tools Available, Key Guidelines (+14 more)

### Community 13 - "kaban/README.md"
Cohesion: 0.20
Nodes (6): kaban, Overview, Subdirectories & Boundaries, design, Overview, Subdirectories & Boundaries

### Community 15 - "Web Performance Audit"
Cohesion: 0.08
Nodes (22): Issue body, Skill feedback, Steps, What not to include, Compression & Minification, Detect Framework & Bundler, FIRST: Verify MCP Tools Available, Key Guidelines (+14 more)

### Community 16 - "interestEngine.ts"
Cohesion: 0.24
Nodes (15): computeMissedInterestDays(), buildInterestTxId(), calculatePeriodInterest(), divideBigInt(), estimateMonthlyAccruedMinor(), evaluateInterestRules(), isTxImmutable(), monthParts() (+7 more)

### Community 17 - "Automated Per-Account Interest Posting (PH Digital Banks)"
Cohesion: 0.11
Nodes (17): Alternative A: Server-Side Midnight Cron Job, Alternative B: Log Interest as Standard `INCOME` (`Incoming cash`), Alternative C: Hardcoded Bank Formulas Without User Overrides, Alternative D: Auto-Recalculate All Historical Interest on Backdated Edits, Alternatives Considered, Automated Per-Account Interest Posting (PH Digital Banks), Critical User Journeys (CUJs), CUJ 1: Enable Automated Daily Interest via Bank Preset (+9 more)

### Community 19 - "Automated Per-Account Interest Posting (PH Digital Banks)"
Cohesion: 0.11
Nodes (17): Alternative A: Server-Side Midnight Cron Job, Alternative B: Log Interest as Standard `INCOME` (`Incoming cash`), Alternative C: Hardcoded Bank Formulas Without User Overrides, Alternative D: Auto-Recalculate All Historical Interest on Backdated Edits, Alternatives Considered, Automated Per-Account Interest Posting (PH Digital Banks), Critical User Journeys (CUJs), CUJ 1: Enable Automated Daily Interest via Bank Preset (+9 more)

### Community 20 - "chatHistoryStorage.ts"
Cohesion: 0.05
Nodes (68): src/adapters/ai/README.md, src/state/README.md, zod, clearAllChatThreads(), clearChatHistory(), createEmptyThread(), createNewThread(), deleteThreadFromStorage() (+60 more)

### Community 21 - "DexieStorageRepo"
Cohesion: 0.04
Nodes (12): appDefaults(), DexieStorageRepo, BuildSnapshotInput, DemoSeed, AppMeta, AppNotification, Category, Invoice (+4 more)

### Community 22 - "Invoice"
Cohesion: 0.15
Nodes (12): 0. CONTEXT & ARCHITECTURAL GUARDRAILS, 1. MODULE 1: Friction & Fee Leakage Tracker (`Transfer` + `E-wallet cash-in`), 2. MODULE 2: Committed Cashflow Waterfall ("True Safe-to-Spend"), 3. MODULE 3: Debt & Installment Payoff Horizon (`Loan` + `Installment`), 4. MODULE 4: Per-Wallet Liquidity & Shortfall Radar, 5. MODULE 5: Invoice Aging, Tax & Discount Ledger (`Invoice`), 6. UI COMPONENT SPECIFICATIONS (`src/ui/screens/AnalyticsInsightsSection.tsx`), AGY DIRECTIVE (PART 2): Kaban 5-Module Financial Analytics & Insights Engine (+4 more)

### Community 23 - "Interface"
Cohesion: 0.08
Nodes (35): 0. CONTEXT &amp; ARCHITECTURAL GUARDRAILS, 1. REFINEMENT 1: Differentiate `Installment` from `Loan`, 2. REFINEMENT 2: Auto-Sync `Invoice line items` with `Top AMOUNT (PHP)`, 3. REFINEMENT 3: Dynamic Contextual Labels & Placeholders per Tab, 4. REFINEMENT 4: Enable `+ Custom Label` Chip Across All 8 Modes, 5. VERIFICATION GATES, AGY DIRECTIVE (PART 1): Kaban `NewEntryModal` 8-Mode UX Refinements, Reference Implementation (`src/core/engine/installmentCalc.ts` + UI Snippet): (+27 more)

### Community 24 - "bank-transfer-fee-chart.md"
Cohesion: 0.50
Nodes (3): Digital-First Banks, E-Wallets, Traditional Banks

### Community 25 - "devDependencies"
Cohesion: 0.17
Nodes (12): devDependencies, fake-indexeddb, tailwindcss, @tailwindcss/vite, @types/qrcode, @types/react, @types/react-dom, typescript (+4 more)

### Community 26 - "Interface"
Cohesion: 0.12
Nodes (45): src/ui/components/README.md, CardNetwork, WalletPattern, WalletType, Timeframe, CustomLabelPicker(), CustomLabelPickerProps, mergeCustomLabel() (+37 more)

### Community 27 - "Wrangler CLI"
Cohesion: 0.15
Nodes (11): Issue body, Skill feedback, Steps, What not to include, Apply the Change, Inspect the Project, Retrieve What the Task Needs, Skill feedback (+3 more)

### Community 28 - "dependencies"
Cohesion: 0.17
Nodes (12): dependencies, browser-image-compression, date-fns, dexie, jsqr, jszip, qrcode, react (+4 more)

### Community 29 - "EGM Drift Report (2026-11-14)"
Cohesion: 0.12
Nodes (16): design/kaban/baulito-logo-concepts/README.md, design/kaban/chest-round/README.md, design/kaban/font-study/README.md, design/kaban/logo-kit/README.md, design/kaban/README.md, design/README.md, EGM Drift Report (2026-11-14), netlify/README.md (+8 more)

### Community 30 - "gemma.ts"
Cohesion: 0.29
Nodes (8): netlify/functions/README.md, checkRateLimit(), getApiKeys(), handler(), ipRateLimitStore, MAX_REQUESTS_PER_HOUR, RateLimitRecord, recordUsage()

### Community 31 - "InterestRule"
Cohesion: 0.09
Nodes (24): 1. System Data Flow, 2. Core Data Models (`src/core/models/index.ts`), 3. PH Bank Registry & Calculation Engine, 4. Lock Boundary, In-Window Recalculation, & Inline Verification, 6. UI Components, Technical Plan (Architecture), 1. `src/core/models/index.ts` (Modify), 1. System Data Flow (+16 more)

### Community 32 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, test, typecheck, verify:lock

### Community 33 - "MASTER PROMPT: KromaLedger — Local-First Mobile Expense, Subscription & Invoice Tracker"
Cohesion: 0.12
Nodes (15): KromaLedger acceptance checklist, 0. AGENT SKILL ACTIVATION & ORCHESTRATION DIRECTIVES, 1. BRANDING, IDENTITY & ARCHITECTURAL CONSTRAINTS, 2. TECH STACK & DETERMINISTIC DEPENDENCY GUARDRAILS, 3. DESIGN SYSTEM: "STEALTH SMOKED-GLASS & ELECTRIC VOLT", 4. TARGET DIRECTORY ARCHITECTURE, 5. SUBAGENT WORKSTREAM DECOMPOSITION (`subagent-driven-development`), 6. EXECUTION PROTOCOL & VERIFICATION GATES (+7 more)

### Community 34 - "logo-kit/build.py"
Cohesion: 0.09
Nodes (9): build(), word_paths(), build(), contrast(), group(), symbol(), word(), write() (+1 more)

### Community 35 - "Kaban / local font comparison"
Cohesion: 0.33
Nodes (6): Interface, Invariants, Kaban / local font comparison, Overview, Side Effects, Verification

### Community 36 - "Kaban — concept round 1"
Cohesion: 0.33
Nodes (5): Construction, Kaban — concept round 1, Longlist, Review, Scope

### Community 37 - "AGY DIRECTIVE (PART 3): Surgical UI Polish, Anti-Truncation & Layout Hierarchy Fixes"
Cohesion: 0.10
Nodes (19): 0. CONTEXT & OBJECTIVE, 1. FIX 1: Eliminate Text & Number Truncation in `CommittedWaterfallCard.tsx`, 2. FIX 2: Replace the `Module 4` Debug Badge on `INVOICE AGING & TAX LEDGER`, 3. FIX 3: Un-Cramp `TRANSFER & CASH-IN FRICTION` and `INSTALLMENT & LOAN HORIZON`, 4. FIX 4: Tactile Neobrutalist Empty States with Quick-Action Triggers, 5. FIX 5: Dashboard View Mode Switcher (`Core Ledger` vs. `Deep Analytics`), 6. VERIFICATION CHECKLIST, AGY DIRECTIVE (PART 3): Surgical UI Polish, Anti-Truncation & Layout Hierarchy Fixes (+11 more)

### Community 39 - "queries/index.ts"
Cohesion: 0.13
Nodes (47): src/state/queries/README.md, 12. `src/state/queries/index.ts` (Modify), 14. `src/state/useUIStore.ts` & `src/state/queries/index.ts` (Modify), useAllTransactions(), useAttachments(), useCategories(), useClearAllData(), useClearNotifications() (+39 more)

### Community 40 - "Target Files to Create/Modify"
Cohesion: 0.12
Nodes (16): 10. `src/adapters/web-dexie/DexieStorageRepo.ts` (Modify), 11. `src/adapters/backup/zipVault.ts` (Modify), 14. `src/ui/components/BaulitoMissedDaysModal.tsx` (Create), 15. `src/ui/components/WalletInterestSettings.tsx` & Wallet/Activity UI Screens (Create / Modify), 16. `src/core/engine/__tests__/interestEngine.test.ts` & `src/core/engine/__tests__/reconciler.test.ts` (Create / Modify), 1. `src/core/models/index.ts` (Modify), 2. `src/core/engine/manilaDate.ts` (Create), 3. `src/core/engine/phBankRegistry.ts` (Create) (+8 more)

### Community 42 - "reconciler.ts"
Cohesion: 0.17
Nodes (11): Deterministic Reconciliation Cycle, Portable Core Engine Phase, obligationDueDate(), scheduledPaymentMinor(), addDaysUtc(), asUtcDate(), cycleDate(), daysBetweenUtc() (+3 more)

### Community 43 - "Button"
Cohesion: 0.19
Nodes (16): currentMonth, getInitialTab(), initialThemePrefs, NavTab, parseNavTab(), useUIStore, AppUpdateModal(), DeferredInterestBanner() (+8 more)

### Community 44 - "KromaLedger implementation plan"
Cohesion: 0.33
Nodes (5): KromaLedger implementation plan, Phase 1: guardrails and portable core — complete, Phase 2: local vault and state — complete, Phase 3: mobile-first interface and installability — complete, Phase 4: integration verification — complete

### Community 45 - "aiBudgetSnapshot.ts"
Cohesion: 0.61
Nodes (6): src/core/engine/README.md, addDaysUtc(), buildWeeklyBudgetSnapshot(), formatDateUtc(), getIsoWeekBoundaries(), parseDateUtc()

### Community 46 - ".claude/skills/workers-best-practices/SKILL.md"
Cohesion: 0.20
Nodes (8): Anti-Patterns to Flag, Enable Observability, Keep Compatibility Dates Current, Place Compute Near Regional Databases, References, Scope, Skill feedback, Validation

### Community 47 - "chest-round"
Cohesion: 0.17
Nodes (10): Construction and rationale, Kaban / chest-reference round, Noun–verb longlist, Refinement and validation, chest-round, Interface, Invariants, Overview (+2 more)

### Community 48 - "Configuration"
Cohesion: 0.18
Nodes (11): Binding-code consistency, Configuration, Enable nodejs_compat, Enable Workers Logs and Traces, Generate binding types with wrangler types, Keep compatibility_date current, Observability, Place compute near regional databases (+3 more)

### Community 49 - "react"
Cohesion: 0.17
Nodes (20): Web App HTML Entrypoint, PWA Application Icon, fake-indexeddb, react, react-dom, @tanstack/react-query, vitest, queryKeys (+12 more)

### Community 50 - ".reconcile"
Cohesion: 0.15
Nodes (12): B1. `DexieStorageRepo.reconcile()` double-counting risk for `INTEREST` transactions, B2. Unspecified `interestEngine.ts` calculation, compounding, and window semantics, B3. `appMeta.lastReconciledDate` vs. `BaulitoMissedDaysModal` deferral collision, B4. Incomplete `InterestRule` Zod bounds & `IStorageRepo` method contract, Blockers, Implementation Readiness Report: Automated Per-Account Interest Posting, M1. Missing Phasing and Checkpoints, M2. Incomplete Target Scope & Wrong Test Paths (+4 more)

### Community 51 - "QuickAddDrawer.tsx"
Cohesion: 0.06
Nodes (69): Minor-Unit Integer Money Math, convenienceFeeMinor(), calculateInstallmentPlan(), InstallmentBreakdown, calculateInvoice(), computeInvoiceTotals(), InvoiceCalculation, InvoiceCalculationInput (+61 more)

### Community 52 - "WebPresentationProvider.tsx"
Cohesion: 0.08
Nodes (33): src/ui/adapters/README.md, PresentationBoxProps, PresentationButtonProps, PresentationComponents, PresentationContext, PresentationIconProps, PresentationInputProps, PresentationModalProps (+25 more)

### Community 53 - "Workers Runtime Patterns"
Cohesion: 0.20
Nodes (10): Always await or waitUntil Promises, Be aware of platform limits, Code Patterns, Development & Testing, Do not store request-scoped state in global scope, Explicit error handling over passThroughOnException, Security, Test with @cloudflare/vitest-pool-workers (+2 more)

### Community 55 - "AttachmentCacheManager"
Cohesion: 0.06
Nodes (21): AttachmentCacheManager, Analytics UI Components, Interface, Invariants, Overview, Side Effects, Verification, Feature UI Components (+13 more)

### Community 56 - "cashflowAnalytics.ts"
Cohesion: 0.11
Nodes (31): 8. `src/core/engine/cashflowAnalytics.ts` (Modify), 7. VERIFICATION GATES, Goldfish Review Resolution Report, M4. Unaddressed impact of `"INTEREST"` on existing UI filters, `EditEntryModal`, and other analytics functions, AgingBucket, analyzeInvoiceAging(), analyzeWalletLiquidity(), calculateCashflow() (+23 more)

### Community 57 - "Type Validation"
Cohesion: 0.25
Nodes (7): Binding access — the most common error, Env interface, Handler and class signatures, Serialization Boundaries, Stale class patterns, Type Validation, Workers Platform API Checks

### Community 58 - "HomeDashboard"
Cohesion: 0.17
Nodes (19): src/ui/components/analytics/README.md, 16. `src/ui/components/BaulitoMissedDaysModal.tsx` (Create), InvoiceAgingReport, WalletRunwayStatus, FeeLeakageAndPayoffRow(), formatPhp(), formatPhp(), InvoiceAgingAndTaxCard() (+11 more)

### Community 59 - "Architecture"
Cohesion: 0.40
Nodes (5): Architecture, Use bindings for Cloudflare services, not REST APIs, Use Hyperdrive for external database connections, Use Queues and Workflows for async and background work, Use service bindings for Worker-to-Worker communication

### Community 60 - "Skill feedback"
Cohesion: 0.40
Nodes (4): Issue body, Skill feedback, Steps, What not to include

### Community 61 - "GitHub Ship & Triage"
Cohesion: 0.15
Nodes (11): CI Workflow, Inspecting Rulesets, `Main` Branch Ruleset, Ruleset & CI Reference, 1. Triage Open PRs & Dependabot, 2. Ship Local Changes, GitHub Ship & Triage, Guardrails (+3 more)

### Community 62 - "baulito-logo-concepts"
Cohesion: 0.22
Nodes (7): Kaban — Baulito logo exploration, baulito-logo-concepts, Interface, Invariants, Overview, Side Effects, Verification

### Community 63 - "Wrangler CLI"
Cohesion: 0.15
Nodes (11): Issue body, Skill feedback, Steps, What not to include, Apply the Change, Inspect the Project, Retrieve What the Task Needs, Skill feedback (+3 more)

### Community 64 - "Request & Response Handling"
Cohesion: 0.50
Nodes (4): Request & Response Handling, Stream request and response bodies, Use waitUntil for work after the response, Use Zod 4.5.0 or later

### Community 65 - "qrStream.ts"
Cohesion: 0.07
Nodes (32): jsqr, qrcode, base64ToBytes(), bytesToBase64(), compressStringGzip(), computeCrc32(), CRC32_TABLE, decompressStringGzip() (+24 more)

### Community 66 - "zipVault.ts"
Cohesion: 0.07
Nodes (38): src/adapters/backup/README.md, 5. Storage, Backup, & Analytics Isolation, Atomic ZIP Vault Restore, 12. `src/adapters/backup/zipVault.ts` (Modify), 5. Storage, Backup, & Analytics Isolation, Local Vault & State Phase, dexie, jszip (+30 more)

### Community 67 - "HomeDashboard.tsx"
Cohesion: 0.13
Nodes (26): src/ui/primitives/README.md, src/ui/README.md, 5. Centralized Component Conventions, PWA & Mobile UI Phase, 3.6 Data Display & Status Primitives (`src/ui/primitives/index.tsx`), `AnimatedMoney`, `BrandLogo`, `DonutChartSVG` (+18 more)

### Community 68 - "paymentWorkflows.test.ts"
Cohesion: 0.27
Nodes (3): buildInvoicePayment(), selectPendingOverview(), base

### Community 69 - "App.tsx"
Cohesion: 0.18
Nodes (20): AIAssistantModal, App(), AppUpdateModal, EditProfileModal, NotificationCenterModal, PendingAndSubsHub, QuickAddDrawer, SettingsScreen (+12 more)

### Community 70 - "UIState"
Cohesion: 0.12
Nodes (5): AppThemeId, ThemeMode, UIState, Invariants, SettingsScreen()

### Community 71 - "PendingAndSubsHub.tsx"
Cohesion: 0.29
Nodes (12): src/ui/screens/README.md, formatCurrency(), ConfirmDeleteModal(), StatusDot(), AttachmentPreviewModal(), InvoicePaymentModal(), InvoiceRow, money() (+4 more)

### Community 72 - "AGY DIRECTIVE (PART 5): Complete "Bantay (Baulito)" Mascot Suite & Front-Page Integration"
Cohesion: 0.22
Nodes (8): 0. OVERVIEW & MASCOT ASSET ARCHITECTURE, 1. THE 9-POSE FIGMA LAYER & FUNCTIONAL MATRIX, 2. PRODUCTION REACT COMPONENT (`src/ui/primitives/KabanMascot.tsx`), 3. FRONT-PAGE HERO COMPONENT (`src/ui/components/FrontPageHero.tsx`), 4. WIRING ALL 9 `baulito-*.svg` POSES ACROSS THE APP, 5. VERIFICATION CHECKLIST, AGY DIRECTIVE (PART 5): Complete "Bantay (Baulito)" Mascot Suite & Front-Page Integration, Core Rule: Non-Intrusive Placement

### Community 73 - "WalletInterestSettings.tsx"
Cohesion: 0.33
Nodes (6): matchBankPreset(), PH_BANK_INTEREST_PRESETS, PH_DIGITAL_BANK_ALIASES, PhBankInterestPreset, InterestTier, WalletInterestSettingsProps

### Community 74 - "BaulitoTour.tsx"
Cohesion: 0.12
Nodes (25): src/adapters/notifications/README.md, dispatchBrowserNotification(), getBrowserNotificationPermission(), getShownIds(), isBrowserNotificationSupported(), markShownId(), requestBrowserNotificationPermission(), syncBrowserNotifications() (+17 more)

### Community 75 - "WebBootstrap.tsx"
Cohesion: 0.13
Nodes (19): restoreQueryCache(), setupQueryCachePersistence(), db, files, queryClient, repo, services, APP_UPDATE_NOTIF_PREFIX (+11 more)

### Community 76 - "MarkdownRenderer.tsx"
Cohesion: 0.36
Nodes (8): Block, BlockComponent(), CodeBlock(), InlineContent(), MarkdownRenderer(), MarkdownRendererProps, parseMarkdownBlocks(), parseTable()

### Community 77 - "README.md"
Cohesion: 0.15
Nodes (8): Local-First Vault Architecture, netlify, Overview, Subdirectories & Boundaries, CabinetGrotesk Font Asset, JetBrainsMono Font Asset, Satoshi Font Asset, KromaLedger

### Community 78 - "DexieFileStore"
Cohesion: 0.11
Nodes (12): src/adapters/web-dexie/README.md, src/core/ports/README.md, DexieFileStore, Invariants, Overview, Side Effects, Verification, Web & Dexie Persistence Adapters (+4 more)

### Community 81 - ".agents/skills/workers-best-practices/SKILL.md"
Cohesion: 0.20
Nodes (8): Anti-Patterns to Flag, Enable Observability, Keep Compatibility Dates Current, Place Compute Near Regional Databases, References, Scope, Skill feedback, Validation

### Community 82 - "Configuration"
Cohesion: 0.18
Nodes (11): Binding-code consistency, Configuration, Enable nodejs_compat, Enable Workers Logs and Traces, Generate binding types with wrangler types, Keep compatibility_date current, Observability, Place compute near regional databases (+3 more)

### Community 83 - "Workers Runtime Patterns"
Cohesion: 0.20
Nodes (10): Always await or waitUntil Promises, Be aware of platform limits, Code Patterns, Development & Testing, Do not store request-scoped state in global scope, Explicit error handling over passThroughOnException, Security, Test with @cloudflare/vitest-pool-workers (+2 more)

### Community 84 - "WebBootstrap"
Cohesion: 0.19
Nodes (15): 13. `src/adapters/web-dexie/WebBootstrap.tsx` (Modify), 15. `src/adapters/web-dexie/WebBootstrap.tsx` (Modify), 17. `src/ui/components/WalletInterestSettings.tsx`, `src/ui/screens/HomeDashboard.tsx`, `src/ui/screens/WalletsScreen.tsx`, `src/ui/components/PhysicalWalletCard.tsx`, `src/ui/components/WalletActivity.tsx`, `src/ui/components/EditEntryModal.tsx`, `src/ui/components/ActivityFilters.tsx`, & `src/core/engine/walletActivity.ts` (Create / Modify), Phase 3: React Query, Bootstrap, & UI, M5. Unclear `BaulitoMissedDaysModal` deferral state & `BootstrapGate` UTC `today`, ForegroundReconcile(), WebBootstrap(), getTodayManila() (+7 more)

### Community 86 - "Type Validation"
Cohesion: 0.25
Nodes (7): Binding access — the most common error, Env interface, Handler and class signatures, Serialization Boundaries, Stale class patterns, Type Validation, Workers Platform API Checks

### Community 88 - "Kaban / Baulito — Curious Chest"
Cohesion: 0.33
Nodes (6): Interface, Invariants, Kaban / Baulito — Curious Chest, Overview, Side Effects, Verification

### Community 89 - "Netlify Functions"
Cohesion: 0.33
Nodes (6): Interface, Invariants, Netlify Functions, Overview, Side Effects, Verification

### Community 90 - "scripts"
Cohesion: 0.33
Nodes (6): Interface, Invariants, Overview, scripts, Side Effects, Verification

### Community 91 - "Architecture"
Cohesion: 0.40
Nodes (5): Architecture, Use bindings for Cloudflare services, not REST APIs, Use Hyperdrive for external database connections, Use Queues and Workflows for async and background work, Use service bindings for Worker-to-Worker communication

### Community 92 - "Skill feedback"
Cohesion: 0.40
Nodes (4): Issue body, Skill feedback, Steps, What not to include

### Community 94 - "Request & Response Handling"
Cohesion: 0.50
Nodes (4): Request & Response Handling, Stream request and response bodies, Use waitUntil for work after the response, Use Zod 4.5.0 or later

## Knowledge Gaps
- **18 isolated node(s):** `@types/qrcode`, `@types/react`, `@types/react-dom`, `tailwindcss`, `typescript` (+13 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 672 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `KromaLedger` connect `README.md` to `models/index.ts`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `DexieStorageRepo` (e.g. with `src/adapters/web-dexie/README.md` and `13. `tests/core/reconciler.test.ts`, `tests/core/cashflowAnalytics.test.ts`, `tests/adapters/vault.test.ts`, & `tests/adapters/storage.test.ts` (Modify)`) actually correct?**
  _`DexieStorageRepo` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@types/qrcode`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _18 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ledgerCommands.test.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10804597701149425 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `react` to `ledgerCommands.test.ts`, `models/index.ts`, `package.json`, `verify-portability.mjs`, `Interface`, `interestEngine.ts`, `chatHistoryStorage.ts`, `Interface`, `Interface`, `gemma.ts`, `reconciler.ts`, `aiBudgetSnapshot.ts`, `QuickAddDrawer.tsx`, `WebPresentationProvider.tsx`, `cashflowAnalytics.ts`, `zipVault.ts`, `HomeDashboard.tsx`, `paymentWorkflows.test.ts`, `BaulitoTour.tsx`, `WebBootstrap.tsx`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Are the 12 inferred relationships involving `IStorageRepo` (e.g. with `src/adapters/web-dexie/README.md` and `B4. Incomplete `InterestRule` Zod bounds & `IStorageRepo` method contract`) actually correct?**
  _`IStorageRepo` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Should `Transaction` be split into smaller, more focused modules?**
  _Cohesion score 0.12418300653594772 - nodes in this community are weakly interconnected._