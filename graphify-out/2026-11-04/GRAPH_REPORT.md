# Graph Report - KromaLedger  (2026-11-04)

## Corpus Check
- 177 files · ~522,368 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 19 file(s) not represented in the graph (top: .woff2 6, .otf 4, (none) 3)

## Summary
- 1076 nodes · 3013 edges · 51 communities (39 shown, 12 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 94 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `942bf723`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Invoice
- reconciler.ts
- Product: Kaban
- models/index.ts
- PendingAndSubsHub.tsx
- package.json
- TypeScript and Build Configuration
- 2. WIRE `<KabanMascot />` INTO THE 4 TARGET UI TOUCHPOINTS
- Design System: Kaban
- verify-portability.mjs
- formatCurrency
- IStorageRepo
- Repository Agent Instructions
- Kaban / Seed Keeper
- Integration Verification Guidelines
- Cabinet Grotesk Typography Asset
- JetBrains Mono Code Font
- Satoshi Sans-Serif Font
- queries/index.ts
- AIAssistantModal.tsx
- Invoice
- DexieStorageRepo
- MarkdownRenderer.tsx
- bank-transfer-fee-chart.md
- devDependencies
- PhysicalWalletCard.tsx
- WebPresentationProvider.tsx
- dependencies
- WebBootstrap.tsx
- gemma.ts
- AGY DIRECTIVE (PART 5): Complete "Bantay (Baulito)" Mascot Suite & Front-Page Integration
- scripts
- MASTER PROMPT: KromaLedger — Local-First Mobile Expense, Subscription & Invoice Tracker
- logo-kit/build.py
- font-study/README.md
- Kaban — concept round 1
- AGY DIRECTIVE (PART 3): Surgical UI Polish, Anti-Truncation & Layout Hierarchy Fixes
- usage-guide.md
- Wallet
- vite.config.ts
- controls.tsx
- KromaLedger implementation plan
- AGY DIRECTIVE (PART 2): Kaban 5-Module Financial Analytics & Insights Engine
- Kaban / chest-reference round
- AttachmentCacheManager
- vitest
- PendingAndSubsHub.tsx
- AGENTS.md
- AGY DIRECTIVE (PART 1): Kaban `NewEntryModal` 8-Mode UX Refinements

## God Nodes (most connected - your core abstractions)
1. `DexieStorageRepo` - 53 edges
2. `react` - 50 edges
3. `Invoice` - 47 edges
4. `IStorageRepo` - 44 edges
5. `Transaction` - 41 edges
6. `HomeDashboard()` - 41 edges
7. `Subscription` - 40 edges
8. `formatCurrency()` - 39 edges
9. `vitest` - 38 edges
10. `useStorage()` - 38 edges

## Surprising Connections (you probably didn't know these)
- `1. Overview & Brand Metaphor` --references--> `KromaLedgerDB`  [INFERRED]
  DESIGN.md → src/adapters/web-dexie/db.ts
- `Capabilities and Constraints` --references--> `KromaLedgerDB`  [INFERRED]
  PRODUCT.md → src/adapters/web-dexie/db.ts
- `5. MODULE 5: Invoice Aging, Tax & Discount Ledger (`Invoice`)` --references--> `Invoice`  [INFERRED]
  docs/kaban_analytics_insights_modules_prompt.md → src/core/models/index.ts
- `6. Responsive Layout & Viewport Rules` --references--> `FloatingNavPill()`  [INFERRED]
  DESIGN.md → src/ui/components/FloatingNavPill.tsx
- `Legacy Compatibility` --references--> `VoltButton()`  [INFERRED]
  docs/ui-components.md → src/ui/primitives/index.tsx

## Import Cycles
- None detected.

## Communities (51 total, 12 thin omitted)

### Community 0 - "Invoice"
Cohesion: 0.16
Nodes (4): commitInvoice(), confirmSubscriptionCycle(), LedgerCommandUnit, settleInvoice()

### Community 1 - "reconciler.ts"
Cohesion: 0.18
Nodes (10): Deterministic Reconciliation Cycle, Portable Core Engine Phase, obligationDueDate(), addDaysUtc(), asUtcDate(), cycleDate(), daysBetweenUtc(), PendingConfirmation (+2 more)

### Community 2 - "Product: Kaban"
Cohesion: 0.17
Nodes (11): Accessibility & Inclusion, Brand Identity & Visual Language, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product: Kaban (+3 more)

### Community 3 - "models/index.ts"
Cohesion: 0.10
Nodes (31): Offline Double-Entry Ledger, KromaLedger Master Specification, date-fns, createDemoSeed(), detachSubscriptionHistory(), detachWalletReferences(), LedgerCommandGateway, LedgerTable (+23 more)

### Community 4 - "PendingAndSubsHub.tsx"
Cohesion: 0.08
Nodes (59): Props (`FieldProps` / `FormFieldProps`), react, convenienceFeeMinor(), blockInvalidNumberKeys(), parseMinorInput(), sanitizeMoneyInput(), sanitizeQuantityInput(), scheduledPaymentMinor() (+51 more)

### Community 5 - "package.json"
Cohesion: 0.14
Nodes (13): engines, node, name, private, type, version, browser-image-compression, dexie (+5 more)

### Community 6 - "TypeScript and Build Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+12 more)

### Community 7 - "2. WIRE `<KabanMascot />` INTO THE 4 TARGET UI TOUCHPOINTS"
Cohesion: 0.20
Nodes (9): 0. CONTEXT & UX RESTRAINT RULES, 1. CREATE `src/ui/primitives/KabanMascot.tsx`, 2. WIRE `<KabanMascot />` INTO THE 4 TARGET UI TOUCHPOINTS, 3. VERIFICATION GATES, AGY DIRECTIVE (PART 4): Integrating "Bantay" — The Living Kaban Chest Mascot, Touchpoint A: Upgrade `TactileEmptyState.tsx`, Touchpoint B: `Local Vault • Backup` Modal (`VaultBackupModal.tsx`), Touchpoint C: Shortfall Radar Banner (`WalletShortfallAlertCard.tsx`) (+1 more)

### Community 8 - "Design System: Kaban"
Cohesion: 0.12
Nodes (15): 1. Overview & Brand Metaphor, 2. Color Palette & Semantic Tokens, 3. Typography & Sourced Typefaces, 4. Elevation, Shapes & Neobrutalist Depth, 6. Responsive Layout & Viewport Rules, 7. Do's and Don'ts, Corner Radii, Design System: Kaban (+7 more)

### Community 9 - "verify-portability.mjs"
Cohesion: 0.09
Nodes (17): call(), evaluate(), layoutOnly, pending, ready(), record(), socket, brandsDir (+9 more)

### Community 10 - "formatCurrency"
Cohesion: 0.05
Nodes (96): PWA & Mobile UI Phase, 7. VERIFICATION GATES, `getAvatarColors` (`src/ui/primitives/avatarColors.ts`), AgingBucket, analyzeInvoiceAging(), analyzeWalletLiquidity(), calculateCashflow(), calculateCashForecast() (+88 more)

### Community 11 - "IStorageRepo"
Cohesion: 0.07
Nodes (3): AppNotification, InvoiceItem, IStorageRepo

### Community 13 - "Kaban / Seed Keeper"
Cohesion: 0.40
Nodes (4): Files, Kaban / Seed Keeper, Typeface and rights, Validation

### Community 19 - "queries/index.ts"
Cohesion: 0.06
Nodes (45): Web App HTML Entrypoint, PWA Application Icon, dispatchBrowserNotification(), getBrowserNotificationPermission(), getShownIds(), isBrowserNotificationSupported(), markShownId(), requestBrowserNotificationPermission() (+37 more)

### Community 20 - "AIAssistantModal.tsx"
Cohesion: 0.10
Nodes (39): zod, clearAllChatThreads(), clearChatHistory(), createEmptyThread(), createNewThread(), deleteThreadFromStorage(), exportChatHistoryAsMarkdown(), exportThreadAsMarkdown() (+31 more)

### Community 21 - "Invoice"
Cohesion: 0.17
Nodes (12): addDaysUtc(), BuildSnapshotInput, buildWeeklyBudgetSnapshot(), formatDateUtc(), getIsoWeekBoundaries(), parseDateUtc(), CashflowInput, DemoSeed (+4 more)

### Community 22 - "DexieStorageRepo"
Cohesion: 0.09
Nodes (4): appDefaults(), DexieStorageRepo, AppMeta, UserProfile

### Community 23 - "MarkdownRenderer.tsx"
Cohesion: 0.33
Nodes (8): Block, BlockComponent(), CodeBlock(), InlineContent(), MarkdownRenderer(), MarkdownRendererProps, parseMarkdownBlocks(), parseTable()

### Community 24 - "bank-transfer-fee-chart.md"
Cohesion: 0.50
Nodes (3): Digital-First Banks, E-Wallets, Traditional Banks

### Community 25 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, fake-indexeddb, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom, typescript, vite (+3 more)

### Community 26 - "PhysicalWalletCard.tsx"
Cohesion: 0.13
Nodes (36): CardNetwork, WalletPattern, WalletType, getLogoDevUrl(), InstitutionBrandmark(), matchPhInstitution(), PH_INSTITUTIONS, PhInstitutionMeta (+28 more)

### Community 27 - "WebPresentationProvider.tsx"
Cohesion: 0.09
Nodes (18): PresentationBoxProps, PresentationButtonProps, PresentationComponents, PresentationContext, PresentationIconProps, PresentationInputProps, PresentationModalProps, PresentationProvider() (+10 more)

### Community 28 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, browser-image-compression, date-fns, dexie, jszip, react, react-dom, @tanstack/react-query (+2 more)

### Community 29 - "WebBootstrap.tsx"
Cohesion: 0.23
Nodes (21): 5. Centralized Component Conventions, CashflowBreakdownGraph(), ChartBarData, Timeframe, DashboardSkeleton(), PendingSkeleton(), ScreenSkeleton(), SettingsSkeleton() (+13 more)

### Community 30 - "gemma.ts"
Cohesion: 0.33
Nodes (7): checkRateLimit(), getApiKeys(), handler(), ipRateLimitStore, MAX_REQUESTS_PER_HOUR, RateLimitRecord, recordUsage()

### Community 31 - "AGY DIRECTIVE (PART 5): Complete "Bantay (Baulito)" Mascot Suite & Front-Page Integration"
Cohesion: 0.22
Nodes (8): 0. OVERVIEW & MASCOT ASSET ARCHITECTURE, 1. THE 9-POSE FIGMA LAYER & FUNCTIONAL MATRIX, 2. PRODUCTION REACT COMPONENT (`src/ui/primitives/KabanMascot.tsx`), 3. FRONT-PAGE HERO COMPONENT (`src/ui/components/FrontPageHero.tsx`), 4. WIRING ALL 9 `baulito-*.svg` POSES ACROSS THE APP, 5. VERIFICATION CHECKLIST, AGY DIRECTIVE (PART 5): Complete "Bantay (Baulito)" Mascot Suite & Front-Page Integration, Core Rule: Non-Intrusive Placement

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

### Community 37 - "AGY DIRECTIVE (PART 3): Surgical UI Polish, Anti-Truncation & Layout Hierarchy Fixes"
Cohesion: 0.10
Nodes (19): 0. CONTEXT & OBJECTIVE, 1. FIX 1: Eliminate Text & Number Truncation in `CommittedWaterfallCard.tsx`, 2. FIX 2: Replace the `Module 4` Debug Badge on `INVOICE AGING & TAX LEDGER`, 3. FIX 3: Un-Cramp `TRANSFER & CASH-IN FRICTION` and `INSTALLMENT & LOAN HORIZON`, 4. FIX 4: Tactile Neobrutalist Empty States with Quick-Action Triggers, 5. FIX 5: Dashboard View Mode Switcher (`Core Ledger` vs. `Deep Analytics`), 6. VERIFICATION CHECKLIST, AGY DIRECTIVE (PART 3): Surgical UI Polish, Anti-Truncation & Layout Hierarchy Fixes (+11 more)

### Community 40 - "vite.config.ts"
Cohesion: 0.29
Nodes (5): @tailwindcss/vite, vite, vite-plugin-pwa, @vitejs/plugin-react, configureServer()

### Community 43 - "controls.tsx"
Cohesion: 0.08
Nodes (25): 1. Overview & Architectural Principles, 2. Design Tokens & Neobrutalist Conventions, 3.1 Button (`src/ui/primitives/controls.tsx`), 3.2 Field & FormField (`src/ui/primitives/forms.tsx`), 3.3 Form Controls: Input, Select, Textarea (`src/ui/primitives/controls.tsx`), 3.4 ModalShell (`src/ui/primitives/Modal.tsx`), 3.5 ChartFrame & ChartLegend (`src/ui/primitives/ChartFrame.tsx`), 3.6 Data Display & Status Primitives (`src/ui/primitives/index.tsx`) (+17 more)

### Community 44 - "KromaLedger implementation plan"
Cohesion: 0.33
Nodes (5): KromaLedger implementation plan, Phase 1: guardrails and portable core — complete, Phase 2: local vault and state — complete, Phase 3: mobile-first interface and installability — complete, Phase 4: integration verification — complete

### Community 46 - "AGY DIRECTIVE (PART 2): Kaban 5-Module Financial Analytics & Insights Engine"
Cohesion: 0.10
Nodes (13): 0. CONTEXT & ARCHITECTURAL GUARDRAILS, 1. MODULE 1: Friction & Fee Leakage Tracker (`Transfer` + `E-wallet cash-in`), 2. MODULE 2: Committed Cashflow Waterfall ("True Safe-to-Spend"), 3. MODULE 3: Debt & Installment Payoff Horizon (`Loan` + `Installment`), 4. MODULE 4: Per-Wallet Liquidity & Shortfall Radar, 5. MODULE 5: Invoice Aging, Tax & Discount Ledger (`Invoice`), 6. UI COMPONENT SPECIFICATIONS (`src/ui/screens/AnalyticsInsightsSection.tsx`), AGY DIRECTIVE (PART 2): Kaban 5-Module Financial Analytics & Insights Engine (+5 more)

### Community 47 - "Kaban / chest-reference round"
Cohesion: 0.40
Nodes (4): Construction and rationale, Kaban / chest-reference round, Noun–verb longlist, Refinement and validation

### Community 52 - "vitest"
Cohesion: 0.05
Nodes (43): Local-First Vault Architecture, Atomic ZIP Vault Restore, Local Vault & State Phase, KromaLedger, fake-indexeddb, jszip, react-dom, @tanstack/react-query (+35 more)

### Community 53 - "PendingAndSubsHub.tsx"
Cohesion: 0.05
Nodes (48): Minor-Unit Integer Money Math, calculateInstallmentPlan(), InstallmentBreakdown, calculateInvoice(), computeInvoiceTotals(), InvoiceCalculation, InvoiceCalculationInput, safeMinor() (+40 more)

### Community 55 - "AGY DIRECTIVE (PART 1): Kaban `NewEntryModal` 8-Mode UX Refinements"
Cohesion: 0.18
Nodes (10): 0. CONTEXT &amp; ARCHITECTURAL GUARDRAILS, 1. REFINEMENT 1: Differentiate `Installment` from `Loan`, 2. REFINEMENT 2: Auto-Sync `Invoice line items` with `Top AMOUNT (PHP)`, 3. REFINEMENT 3: Dynamic Contextual Labels & Placeholders per Tab, 4. REFINEMENT 4: Enable `+ Custom Label` Chip Across All 8 Modes, 5. VERIFICATION GATES, AGY DIRECTIVE (PART 1): Kaban `NewEntryModal` 8-Mode UX Refinements, Reference Implementation (`src/core/engine/installmentCalc.ts` + UI Snippet): (+2 more)

## Knowledge Gaps
- **17 isolated node(s):** `@types/react`, `@types/react-dom`, `tailwindcss`, `typescript`, `KromaLedger Master Specification` (+12 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 371 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `Invoice`, `reconciler.ts`, `models/index.ts`, `PendingAndSubsHub.tsx`, `package.json`, `vite.config.ts`, `verify-portability.mjs`, `formatCurrency`, `queries/index.ts`, `AIAssistantModal.tsx`, `Invoice`, `PendingAndSubsHub.tsx`, `MarkdownRenderer.tsx`, `PhysicalWalletCard.tsx`, `WebPresentationProvider.tsx`, `WebBootstrap.tsx`, `gemma.ts`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `Invoice` (e.g. with `0. CONTEXT & ARCHITECTURAL GUARDRAILS` and `2. MODULE 2: Committed Cashflow Waterfall ("True Safe-to-Spend")`) actually correct?**
  _`Invoice` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@types/react`, `@types/react-dom`, `tailwindcss` to the rest of the system?**
  _17 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `models/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1036036036036036 - nodes in this community are weakly interconnected._
- **Why does `react` connect `PendingAndSubsHub.tsx` to `package.json`, `formatCurrency`, `queries/index.ts`, `vitest`, `PendingAndSubsHub.tsx`, `MarkdownRenderer.tsx`, `PhysicalWalletCard.tsx`, `WebPresentationProvider.tsx`, `WebBootstrap.tsx`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Should `PendingAndSubsHub.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08198648251542756 - nodes in this community are weakly interconnected._
- **Why does `DexieStorageRepo` connect `DexieStorageRepo` to `Invoice`, `reconciler.ts`, `models/index.ts`, `Wallet`, `IStorageRepo`, `AGY DIRECTIVE (PART 2): Kaban 5-Module Financial Analytics & Insights Engine`, `vitest`, `Invoice`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._