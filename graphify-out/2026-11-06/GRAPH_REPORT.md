# Graph Report - KromaLedger  (2026-11-06)

## Corpus Check
- 194 files · ~591,000 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .woff2 6, .otf 4, (none) 3)

## Summary
- 1132 nodes · 3233 edges · 61 communities (47 shown, 14 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 100 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `942bf723`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Invoice
- Invoice
- Product: Kaban
- models/index.ts
- 3. Primitives API Reference
- package.json
- TypeScript and Build Configuration
- 2. WIRE `<KabanMascot />` INTO THE 4 TARGET UI TOUCHPOINTS
- useUIStore.ts
- verify-portability.mjs
- SmokedCard
- TopStatusHeader.tsx
- Repository Agent Instructions
- Kaban / Seed Keeper
- Integration Verification Guidelines
- Cabinet Grotesk Typography Asset
- JetBrains Mono Code Font
- Satoshi Sans-Serif Font
- App.tsx
- AIAssistantModal.tsx
- DexieStorageRepo
- Invoice
- AGY DIRECTIVE (PART 1): Kaban `NewEntryModal` 8-Mode UX Refinements
- bank-transfer-fee-chart.md
- devDependencies
- PhysicalWalletCard.tsx
- WebPresentationProvider.tsx
- dependencies
- NotificationCenterModal.tsx
- gemma.ts
- vitest
- scripts
- MASTER PROMPT: KromaLedger — Local-First Mobile Expense, Subscription & Invoice Tracker
- logo-kit/build.py
- font-study/README.md
- Kaban — concept round 1
- AGY DIRECTIVE (PART 3): Surgical UI Polish, Anti-Truncation & Layout Hierarchy Fixes
- usage-guide.md
- UIState
- HomeDashboard.tsx
- reconciler.ts
- customLabels.test.tsx
- KromaLedger implementation plan
- Wallet
- pendingAnalytics.ts
- Kaban / chest-reference round
- MarkdownRenderer.tsx
- Design System: Kaban
- LineItemBuilder.tsx
- QuickAddDrawer.tsx
- AGENTS.md
- cashflowAnalytics.ts
- entryDraft.ts
- AttachmentCacheManager
- transferFees.ts
- BaulitoTour.tsx
- baulito-logo-concepts/brief.md
- vite.config.ts
- KromaLedger

## God Nodes (most connected - your core abstractions)
1. `react` - 58 edges
2. `DexieStorageRepo` - 53 edges
3. `Invoice` - 48 edges
4. `HomeDashboard()` - 48 edges
5. `Transaction` - 45 edges
6. `vitest` - 44 edges
7. `IStorageRepo` - 44 edges
8. `formatCurrency()` - 43 edges
9. `Subscription` - 41 edges
10. `Wallet` - 39 edges

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

## Communities (61 total, 14 thin omitted)

### Community 0 - "Invoice"
Cohesion: 0.13
Nodes (16): Offline Double-Entry Ledger, KromaLedger Master Specification, commitInvoice(), confirmSubscriptionCycle(), detachSubscriptionHistory(), detachWalletReferences(), LedgerCommandGateway, LedgerCommandUnit (+8 more)

### Community 1 - "Invoice"
Cohesion: 0.07
Nodes (7): DemoSeed, ReconcileResult, AppMeta, AppNotification, InvoiceItem, UserProfile, IStorageRepo

### Community 2 - "Product: Kaban"
Cohesion: 0.17
Nodes (11): Accessibility & Inclusion, Brand Identity & Visual Language, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product: Kaban (+3 more)

### Community 3 - "models/index.ts"
Cohesion: 0.07
Nodes (30): Local Vault & State Phase, dumpSchema, fileMetaSchema, MAX_ATTACHMENT_COUNT, MAX_VAULT_BYTES, AttachmentFileRecord, createDemoSeed(), ALLOWED_ATTACHMENT_MIME_TYPES (+22 more)

### Community 4 - "3. Primitives API Reference"
Cohesion: 0.09
Nodes (21): 1. Overview & Architectural Principles, 2. Design Tokens & Neobrutalist Conventions, 3.1 Button (`src/ui/primitives/controls.tsx`), 3.2 Field & FormField (`src/ui/primitives/forms.tsx`), 3.3 Form Controls: Input, Select, Textarea (`src/ui/primitives/controls.tsx`), 3.4 ModalShell (`src/ui/primitives/Modal.tsx`), 3.5 ChartFrame & ChartLegend (`src/ui/primitives/ChartFrame.tsx`), 3. Primitives API Reference (+13 more)

### Community 5 - "package.json"
Cohesion: 0.14
Nodes (13): engines, node, name, private, type, version, browser-image-compression, dexie (+5 more)

### Community 6 - "TypeScript and Build Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+12 more)

### Community 7 - "2. WIRE `<KabanMascot />` INTO THE 4 TARGET UI TOUCHPOINTS"
Cohesion: 0.20
Nodes (9): 0. CONTEXT & UX RESTRAINT RULES, 1. CREATE `src/ui/primitives/KabanMascot.tsx`, 2. WIRE `<KabanMascot />` INTO THE 4 TARGET UI TOUCHPOINTS, 3. VERIFICATION GATES, AGY DIRECTIVE (PART 4): Integrating "Bantay" — The Living Kaban Chest Mascot, Touchpoint A: Upgrade `TactileEmptyState.tsx`, Touchpoint B: `Local Vault • Backup` Modal (`VaultBackupModal.tsx`), Touchpoint C: Shortfall Radar Banner (`WalletShortfallAlertCard.tsx`) (+1 more)

### Community 8 - "useUIStore.ts"
Cohesion: 0.17
Nodes (19): APP_THEMES, applyThemeToDom(), AppThemeConfig, getStoredThemePreferences(), getThemeConfig(), resolveEffectiveMode(), saveThemePreferences(), ThemePreferences (+11 more)

### Community 9 - "verify-portability.mjs"
Cohesion: 0.08
Nodes (21): call(), evaluate(), pending, socket, call(), evaluate(), layoutOnly, pending (+13 more)

### Community 10 - "SmokedCard"
Cohesion: 0.45
Nodes (13): DashboardSkeleton(), PendingSkeleton(), ScreenSkeleton(), SettingsSkeleton(), WalletsSkeleton(), SmokedCard(), Skeleton(), SkeletonBadge() (+5 more)

### Community 11 - "TopStatusHeader.tsx"
Cohesion: 0.17
Nodes (10): 3.6 Data Display & Status Primitives (`src/ui/primitives/index.tsx`), `AnimatedMoney`, `BrandLogo`, `DonutChartSVG`, `getAvatarColors` (`src/ui/primitives/avatarColors.ts`), `SmokedCard` (Neobrutalist Card), `StatusDot`, TopStatusHeader() (+2 more)

### Community 13 - "Kaban / Seed Keeper"
Cohesion: 0.40
Nodes (4): Files, Kaban / Baulito — Curious Chest, Typeface and rights, Validation

### Community 19 - "App.tsx"
Cohesion: 0.23
Nodes (11): AIAssistantModal, App(), EditProfileModal, NotificationCenterModal, PendingAndSubsHub, QuickAddDrawer, SettingsScreen, VaultBackupModal (+3 more)

### Community 20 - "AIAssistantModal.tsx"
Cohesion: 0.10
Nodes (39): zod, clearAllChatThreads(), clearChatHistory(), createEmptyThread(), createNewThread(), deleteThreadFromStorage(), exportChatHistoryAsMarkdown(), exportThreadAsMarkdown() (+31 more)

### Community 21 - "DexieStorageRepo"
Cohesion: 0.08
Nodes (5): appDefaults(), DexieStorageRepo, CashflowInput, Invoice, Transaction

### Community 22 - "Invoice"
Cohesion: 0.10
Nodes (13): 0. CONTEXT & ARCHITECTURAL GUARDRAILS, 1. MODULE 1: Friction & Fee Leakage Tracker (`Transfer` + `E-wallet cash-in`), 2. MODULE 2: Committed Cashflow Waterfall ("True Safe-to-Spend"), 3. MODULE 3: Debt & Installment Payoff Horizon (`Loan` + `Installment`), 4. MODULE 4: Per-Wallet Liquidity & Shortfall Radar, 5. MODULE 5: Invoice Aging, Tax & Discount Ledger (`Invoice`), 6. UI COMPONENT SPECIFICATIONS (`src/ui/screens/AnalyticsInsightsSection.tsx`), AGY DIRECTIVE (PART 2): Kaban 5-Module Financial Analytics & Insights Engine (+5 more)

### Community 23 - "AGY DIRECTIVE (PART 1): Kaban `NewEntryModal` 8-Mode UX Refinements"
Cohesion: 0.18
Nodes (10): 0. CONTEXT &amp; ARCHITECTURAL GUARDRAILS, 1. REFINEMENT 1: Differentiate `Installment` from `Loan`, 2. REFINEMENT 2: Auto-Sync `Invoice line items` with `Top AMOUNT (PHP)`, 3. REFINEMENT 3: Dynamic Contextual Labels & Placeholders per Tab, 4. REFINEMENT 4: Enable `+ Custom Label` Chip Across All 8 Modes, 5. VERIFICATION GATES, AGY DIRECTIVE (PART 1): Kaban `NewEntryModal` 8-Mode UX Refinements, Reference Implementation (`src/core/engine/installmentCalc.ts` + UI Snippet): (+2 more)

### Community 24 - "bank-transfer-fee-chart.md"
Cohesion: 0.50
Nodes (3): Digital-First Banks, E-Wallets, Traditional Banks

### Community 25 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, fake-indexeddb, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom, typescript, vite (+3 more)

### Community 26 - "PhysicalWalletCard.tsx"
Cohesion: 0.13
Nodes (35): CardNetwork, WalletPattern, WalletType, getLogoDevUrl(), InstitutionBrandmark(), matchPhInstitution(), PH_INSTITUTIONS, PhInstitutionMeta (+27 more)

### Community 27 - "WebPresentationProvider.tsx"
Cohesion: 0.09
Nodes (18): PresentationBoxProps, PresentationButtonProps, PresentationComponents, PresentationContext, PresentationIconProps, PresentationInputProps, PresentationModalProps, PresentationProvider() (+10 more)

### Community 28 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, browser-image-compression, date-fns, dexie, jszip, react, react-dom, @tanstack/react-query (+2 more)

### Community 29 - "NotificationCenterModal.tsx"
Cohesion: 0.34
Nodes (12): dispatchBrowserNotification(), getBrowserNotificationPermission(), getShownIds(), isBrowserNotificationSupported(), markShownId(), requestBrowserNotificationPermission(), syncBrowserNotifications(), useClearNotifications() (+4 more)

### Community 30 - "gemma.ts"
Cohesion: 0.33
Nodes (7): checkRateLimit(), getApiKeys(), handler(), ipRateLimitStore, MAX_REQUESTS_PER_HOUR, RateLimitRecord, recordUsage()

### Community 31 - "vitest"
Cohesion: 0.06
Nodes (35): Atomic ZIP Vault Restore, Web App HTML Entrypoint, PWA Application Icon, fake-indexeddb, jszip, react-dom, @tanstack/react-query, vitest (+27 more)

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

### Community 39 - "UIState"
Cohesion: 0.18
Nodes (3): AppThemeId, ThemeMode, UIState

### Community 40 - "HomeDashboard.tsx"
Cohesion: 0.05
Nodes (121): 5. Centralized Component Conventions, PWA & Mobile UI Phase, `HatchedProgressBar` / `AnimatedProgressBar`, date-fns, react, attachmentCache, blockInvalidNumberKeys(), sanitizeMoneyInput() (+113 more)

### Community 42 - "reconciler.ts"
Cohesion: 0.29
Nodes (7): Deterministic Reconciliation Cycle, Portable Core Engine Phase, addDaysUtc(), asUtcDate(), daysBetweenUtc(), PendingConfirmation, reconcile()

### Community 43 - "customLabels.test.tsx"
Cohesion: 0.24
Nodes (8): ENTRY_FIELD_META, CustomLabelPicker(), CustomLabelPickerProps, mergeCustomLabel(), normalizeLabel(), PRESET_LABELS, elements(), hooks

### Community 44 - "KromaLedger implementation plan"
Cohesion: 0.33
Nodes (5): KromaLedger implementation plan, Phase 1: guardrails and portable core — complete, Phase 2: local vault and state — complete, Phase 3: mobile-first interface and installability — complete, Phase 4: integration verification — complete

### Community 45 - "Wallet"
Cohesion: 0.15
Nodes (10): addDaysUtc(), BuildSnapshotInput, buildWeeklyBudgetSnapshot(), formatDateUtc(), getIsoWeekBoundaries(), parseDateUtc(), ReconcileInput, Category (+2 more)

### Community 47 - "Kaban / chest-reference round"
Cohesion: 0.40
Nodes (4): Construction and rationale, Kaban / chest-reference round, Noun–verb longlist, Refinement and validation

### Community 49 - "MarkdownRenderer.tsx"
Cohesion: 0.33
Nodes (8): Block, BlockComponent(), CodeBlock(), InlineContent(), MarkdownRenderer(), MarkdownRendererProps, parseMarkdownBlocks(), parseTable()

### Community 51 - "Design System: Kaban"
Cohesion: 0.12
Nodes (15): 1. Overview & Brand Metaphor, 2. Color Palette & Semantic Tokens, 3. Typography & Sourced Typefaces, 4. Elevation, Shapes & Neobrutalist Depth, 6. Responsive Layout & Viewport Rules, 7. Do's and Don'ts, Corner Radii, Design System: Kaban (+7 more)

### Community 52 - "LineItemBuilder.tsx"
Cohesion: 0.23
Nodes (15): Minor-Unit Integer Money Math, calculateInvoice(), computeInvoiceTotals(), InvoiceCalculation, InvoiceCalculationInput, safeMinor(), addLineItem(), LineItemDraft (+7 more)

### Community 53 - "QuickAddDrawer.tsx"
Cohesion: 0.20
Nodes (10): calculateInstallmentPlan(), InstallmentBreakdown, TransferChannel, EntrySaveProgress, saveEntryAndAttachment(), useSaveAttachment(), LineDraft, QuickAddDrawer() (+2 more)

### Community 56 - "cashflowAnalytics.ts"
Cohesion: 0.06
Nodes (45): 7. VERIFICATION GATES, 0. OVERVIEW & MASCOT ASSET ARCHITECTURE, 1. THE 9-POSE FIGMA LAYER & FUNCTIONAL MATRIX, 2. PRODUCTION REACT COMPONENT (`src/ui/primitives/KabanMascot.tsx`), 3. FRONT-PAGE HERO COMPONENT (`src/ui/components/FrontPageHero.tsx`), 4. WIRING ALL 9 `baulito-*.svg` POSES ACROSS THE APP, 5. VERIFICATION CHECKLIST, AGY DIRECTIVE (PART 5): Complete "Bantay (Baulito)" Mascot Suite & Front-Page Integration (+37 more)

### Community 57 - "entryDraft.ts"
Cohesion: 0.14
Nodes (18): convenienceFeeMinor(), parseMinorInput(), sanitizeQuantityInput(), buildEntryDraft(), CashInInput, Common, EntryDraft, EntryDraftInput (+10 more)

### Community 60 - "transferFees.ts"
Cohesion: 0.36
Nodes (8): BANK_TRANSFER_FEE_RULES, detectTransferFee(), findFeeRule(), lookupTransferFee(), parseTransferRouteFromText(), TransferChannel, TransferFeeDetectionResult, TransferFeeRule

### Community 61 - "BaulitoTour.tsx"
Cohesion: 0.18
Nodes (12): markFirstBoot(), parseStartingBalance(), restartOnboarding(), useSaveProfile(), BaulitoTour(), practice, PracticeMode, ProfileSetup() (+4 more)

### Community 63 - "vite.config.ts"
Cohesion: 0.29
Nodes (5): @tailwindcss/vite, vite, vite-plugin-pwa, @vitejs/plugin-react, configureServer()

## Knowledge Gaps
- **17 isolated node(s):** `@types/react`, `@types/react-dom`, `tailwindcss`, `typescript`, `KromaLedger Master Specification` (+12 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 391 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `Invoice`, `models/index.ts`, `package.json`, `useUIStore.ts`, `verify-portability.mjs`, `SmokedCard`, `TopStatusHeader.tsx`, `AIAssistantModal.tsx`, `PhysicalWalletCard.tsx`, `WebPresentationProvider.tsx`, `gemma.ts`, `HomeDashboard.tsx`, `reconciler.ts`, `customLabels.test.tsx`, `Wallet`, `pendingAnalytics.ts`, `MarkdownRenderer.tsx`, `LineItemBuilder.tsx`, `QuickAddDrawer.tsx`, `cashflowAnalytics.ts`, `entryDraft.ts`, `transferFees.ts`, `BaulitoTour.tsx`, `vite.config.ts`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `Invoice` (e.g. with `0. CONTEXT & ARCHITECTURAL GUARDRAILS` and `2. MODULE 2: Committed Cashflow Waterfall ("True Safe-to-Spend")`) actually correct?**
  _`Invoice` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@types/react`, `@types/react-dom`, `tailwindcss` to the rest of the system?**
  _17 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Invoice` be split into smaller, more focused modules?**
  _Cohesion score 0.12857142857142856 - nodes in this community are weakly interconnected._
- **Why does `react` connect `HomeDashboard.tsx` to `package.json`, `SmokedCard`, `customLabels.test.tsx`, `TopStatusHeader.tsx`, `MarkdownRenderer.tsx`, `NotificationCenterModal.tsx`, `App.tsx`, `LineItemBuilder.tsx`, `QuickAddDrawer.tsx`, `cashflowAnalytics.ts`, `PhysicalWalletCard.tsx`, `WebPresentationProvider.tsx`, `BaulitoTour.tsx`, `vitest`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `HomeDashboard()` (e.g. with `dashboardAndHookOrder.test.tsx` and `renderDashboard()`) actually correct?**
  _`HomeDashboard()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `Invoice` be split into smaller, more focused modules?**
  _Cohesion score 0.07357357357357357 - nodes in this community are weakly interconnected._