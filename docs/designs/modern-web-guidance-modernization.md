# Modern Web Platform Modernization Report & Specification

*   **Author:** Alexis John Rellon
*   **Status:** Approved
*   **Date:** 2026-11-15
*   **Scope:** Broad `modern-web-guidance` Scan (Track 1 Deterministic Legacy Scan + Track 2 UI/Core Catalog Audit) for **Kaban** (`KromaLedger` repository)

--------------------------------------------------------------------------------

## Executive Summary & Audit Matrix

This specification documents the resolved findings and implementation plan from a two-track audit of **Kaban** (repository `KromaLedger`) against `modern-web-guidance` (the project's installed skill and `npx modern-web-guidance` CLI catalog covering Baseline web platform standards and progressive-enhancement rubrics):

1.  **Track 1 — Deterministic Legacy Scan (`npx modern-web-guidance legacy-scan src --json`)**: Evaluated `src/` against deterministic rules (`35` rules spanning `33` guides), producing **10 findings across 4 files**:
    *   `src/index.css:453,460,465` (`customize-scrollbar-color-and-thickness` — 3 findings -> `MWG-08`)
    *   `src/ui/components/AIAssistantModal.tsx:84` (`form-fields-automatically-fit-contents` — 1 finding -> `MWG-05`)
    *   `src/ui/components/AIAssistantModal.tsx:238,673`, `src/ui/components/CustomLabelPicker.tsx:66`, `src/ui/components/LineItemBuilder.tsx:107`, `src/ui/components/QuickAddDrawer.tsx:991` (`ime-safe-enter-submit` — 5 verified findings -> `MWG-03`)
    *   `src/ui/components/QuickAddDrawer.tsx:1009` (`ime-safe-enter-submit` on `<input type="date">` — **1 False Positive / Exempted**)
2.  **Track 2 — Broad Catalog Audit**: Audited `src/ui/` (`primitives/`, `components/`, `screens/`, `adapters/`), `src/core/`, `index.html`, and `package.json` against the broader `modern-web-guidance` catalog, surfacing **7 additional improvement areas** (`MWG-01`, `MWG-02`, `MWG-04`, `MWG-06`, `MWG-07`, `MWG-09`, `MWG-10`, plus supplemental head/label checks in `MWG-08`/`MWG-03`) and confirming zero `dangerouslySetInnerHTML` or `innerHTML` assignments in `src/`.

Following EGM review resolution (`goldfish_review_report.md`, `Status: resolved`), the project commits to a **zero-external-polyfill, zero-dual-path** implementation boundary compatible with React 19, Vite 8, `scripts/verify-portability.mjs`, `scripts/verify-lock.mjs`, and the Node-only Vitest harness (`vite.config.ts`).

### Consolidated Audit Matrix

| ID | Origin | Severity | Guide ID(s) | Disposition | Target Files & Scope | Resolution Summary |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **MWG-01** | Track 2 | **High** | `dialog`, `prevent-page-scroll-under-modal-dialog` | **Scoped / Implemented** | `src/index.css`, `EditEntryModal.tsx:50-56`, `QuickAddDrawer.tsx:439-456`, `AIAssistantModal.tsx:260-266,674`, `FloatingNavPill.tsx:57-64` | Keep portal overlays to preserve `SettingsScreen.tsx` `z-[9999]` toasts and Node SSR tests; add `dialog:modal`/`::backdrop` + `.overscroll-contain` scroll containment, remove duplicate `EditEntryModal` `Escape` listener, fix `QuickAddDrawer` `useEffect` deps & rename `Escape` propagation, update `FloatingNavPill` observer. |
| **MWG-02** | Track 2 | **High** | `capture-location-agnostic-data` | **Implemented** | `manilaDate.ts`, `reconciler.ts`, `aiBudgetSnapshot.ts`, `ledgerCommands.ts`, `obligationSchedule.ts`, `models/index.ts`, `models/ai.ts`, `AIAssistantModal.tsx:155` | Replace `MANILA_OFFSET_MS` with a cached IANA `Asia/Manila` `Intl.DateTimeFormat` singleton (`formatToParts`) for `getTodayManila()` & `msUntilNextManilaMidnight()`, and replace `${date}T00:00:00.000Z` construction with integer `parseUtcDate()` (`Date.UTC`). |
| **MWG-03** | Track 1 (5) + Track 2 | **Medium** | `ime-safe-enter-submit`, `accessibility` | **Implemented (5 + labels); Exempted (1 FP)** | `AIAssistantModal.tsx:238,321-327,614-623,667-677`, `CustomLabelPicker.tsx:66`, `LineItemBuilder.tsx:107`, `QuickAddDrawer.tsx:991` *(Exempt: `:1009`)* | Guard `Enter` with `isComposing \|\| keyCode === 229`; add explicit labels for chat `<textarea>`, sidebar search `<Input>`, and thread rename `<input>`. Keep `:1009` (`type="date"`) untouched. |
| **MWG-04** | Track 2 | **Medium** | `validate-input-after-interaction`, `accessible-error-announcement` | **Implemented** | `src/ui/primitives/forms.tsx:51-98` | Switch `:invalid` selectors to `:user-invalid` + `[aria-invalid=true]`, default `aria-invalid` to `false` (preserving explicit child overrides like `"grammar"` and setting `"false"` on valid input), keep `role="alert"` on `<Field>` error text for standalone filters and test continuity. |
| **MWG-05** | Track 1 (1) | **Medium** | `form-fields-automatically-fit-contents` | **Implemented** | `src/ui/components/AIAssistantModal.tsx:79-89,622` | Apply `[field-sizing:content] w-full min-h-[44px] max-h-32` (`44px` touch target preserved) and short-circuit `useLayoutEffect` resize/listener setup when `CSS.supports("field-sizing", "content")` is true. |
| **MWG-06** | Track 2 | **Medium** | `anchor-positioning-tab-underline` | **Deferred** | `src/ui/components/FloatingNavPill.tsx` | Deferred until `anchor()` is Baseline Widely Available so the pill avoids maintaining dual CSS `nav::before` and JS `ResizeObserver` indicator paths. |
| **MWG-07** | Track 2 | **Medium** | `switch` | **Exempted** | `src/ui/primitives/controls.tsx:96-130` | Exempted (YAGNI): `Toggle` is already a 34-line accessible `<button type="button" role="switch" aria-checked>` used outside `<form>` submission (`SettingsScreen.tsx:376,397,418`); native `switch` requires Safari-only/polyfill lockfile changes and breaks `@types/react` / `uiControls.test.tsx`. |
| **MWG-08** | Track 1 (3) + Track 2 | **Low** | `html`, `dark-mode`, `color`, `customize-scrollbar-color-and-thickness` | **Implemented** | `index.html:4-7`, `src/state/theme.ts:184-226`, `src/index.css:70-140,452-467` | Add `<meta name="color-scheme" content="light dark" />`, dynamically sync `root.style.colorScheme` and `<meta name="theme-color">` in `applyThemeToDom()`, add `accent-color`, set `scrollbar-width`/`scrollbar-color` on `:root` and scrollboxes, and wrap `::-webkit-scrollbar*` in `@supports not (scrollbar-color: auto)`. |
| **MWG-09** | Track 2 | **Low** | `same-document-transitions` | **Deferred** | `src/App.tsx:99`, `src/state/useUIStore.ts` | Deferred: `.animate-entrance` already animates tab changes while respecting OS and in-app reduced motion, whereas `flushSync` snapshots lazy `<Suspense>` skeletons and violates `verify-portability.mjs` `src/state/` isolation. |
| **MWG-10** | Track 2 | **Low** | `responsive-table`, `accessibility` | **Implemented** | `src/ui/components/MarkdownRenderer.tsx:203-230` | Add `tabIndex={0} role="region" aria-label="Markdown table"` on the table overflow wrapper and `scope="col"` on `<th>`. |

### Dropped False Positive (1)

*   **`src/ui/components/QuickAddDrawer.tsx:1009` (`ime-safe-enter-submit`) — Keep as-is**: Advances focus cleanly on `Enter` inside `<input type="date">`, which is exempt from IME composition guards under the guide's `dropWhen` rubric.

--------------------------------------------------------------------------------

## Overview

Kaban (codebase `KromaLedger`) is a local-first React 19, Vite 8, and Tailwind CSS v4 personal finance PWA. While its CSS custom properties, React primitives, and DOM rendering avoid `innerHTML` / `dangerouslySetInnerHTML` sinks and run smoothly across desktop and mobile targets, several interactive controls and core date modules carried legacy browser workarounds: fixed-offset `MANILA_OFFSET_MS` date arithmetic and `${date}T00:00:00.000Z` `Date` parsing, unguarded `Enter` handlers during IME composition, an unlabeled and imperatively measured chat `<textarea>`, eager `:invalid` selectors, uncontained overlay scroll chaining, duplicate `Escape` listeners, unscoped WebKit scrollbar rules, and unfocusable markdown tables.

## The Problem

1.  **Fixed-Offset Timezone Math & Hand-Built ISO Date Strings:** `src/core/engine/manilaDate.ts` computes today's Manila date and next-midnight duration using a fixed `MANILA_OFFSET_MS` (`8 * 60 * 60 * 1000`), while `manilaDate.ts`, `reconciler.ts`, `aiBudgetSnapshot.ts`, `ledgerCommands.ts`, `obligationSchedule.ts`, `models/index.ts`, and `models/ai.ts` parse calendar dates via ``new Date(`${value}T00:00:00.000Z`)`` and `AIAssistantModal.tsx:155` reads UTC `toISOString().slice(0, 10)`.
2.  **IME Composition & Control Labeling Gaps:** Five text controls (`AIAssistantModal` chat prompt and inline thread rename, `CustomLabelPicker`, `LineItemBuilder` description/amount inputs, and `QuickAddDrawer` invoice title) execute `Enter` actions without checking `isComposing || keyCode === 229`. Three inputs in `AIAssistantModal` also rely on `placeholder` or lack accessible names.
3.  **Imperative Textarea Resizing & Pre-Interaction Validation Styling:** `AIAssistantModal` measures `scrollHeight` on every keystroke even where native `field-sizing: content` applies, while `Field` (`src/ui/primitives/forms.tsx`) gates `:invalid` styling manually and removes `aria-invalid` instead of keeping `aria-invalid="false"` on valid controls.
4.  **Overlay Scroll Containment, Escape Conflicts & Vendor Scrollbars:** `EditEntryModal` registers a duplicate `window` `Escape` listener alongside `ModalShell`, `AIAssistantModal` inline thread rename `Escape` bubbles to the modal listener, `QuickAddDrawer` omits its `Escape` effect dependency array, `FloatingNavPill` ignores `dialog[open]`, `index.html`/`theme.ts` omit dark `<meta name="theme-color">` and `color-scheme` sync, `src/index.css` declares `::-webkit-scrollbar*` outside `@supports not`, and `MarkdownRenderer` tables lack keyboard scroll region attributes and `scope="col"`.

## Goals

*   Apply zero-polyfill, Baseline-compatible web platform fixes (`Intl.DateTimeFormat` IANA `Asia/Manila` formatting + integer `Date.UTC` date math, `isComposing || keyCode === 229`, `:user-invalid`, `aria-invalid="false"`, `scrollbar-color`/`scrollbar-width` with `@supports not` WebKit fallback, `accent-color`, `<meta name="color-scheme">`, dynamic `<meta name="theme-color">` sync, `overscroll-behavior: contain`, `tabIndex={0}` + `role="region"` + `scope="col"` on tables).
*   Use progressive enhancement cleanly where zero extra dependencies are required (`field-sizing: content` short-circuiting imperative `scrollHeight` Resize/Layout effects while preserving the `44px` minimum touch target).
*   Preserve existing accessible UI primitives (`Toggle`), SSR/Node test compatibility, and `scripts/verify-portability.mjs` / `scripts/verify-lock.mjs` constraints by deferring/exempting polyfill-dependent or dual-path features (`MWG-06`, `MWG-07`, `MWG-09`).

## Non-Goals

*   Adding `temporal-polyfill`, `input-switch-polyfill`, or new browser/DOM test dependencies (`jsdom`, `happy-dom`).
*   Maintaining dual CSS Anchor Positioning + `ResizeObserver` paths in `FloatingNavPill` (`MWG-06`) or replacing `.animate-entrance` with `startViewTransition` (`MWG-09`).
*   Modifying `QuickAddDrawer.tsx:1009` (`type="date"`) or deleting the `@supports not (scrollbar-color: auto)` WebKit scrollbar fallback solely to manipulate static scanner counts.
*   Rewriting working portal overlays to native `<dialog>` where doing so breaks `z-[9999]` portal status toasts (`SettingsScreen.tsx`) or Node-only hook-mocked tests (`tests/core/customLabels.test.tsx`).

## Resolved Design Decisions

1.  **Zero-Dependency `Asia/Manila` Date Strategy:** Commit to a module-level cached `Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", ... })` singleton with `formatToParts()` + pure integer `Date.UTC(year, month - 1, day)` helpers in `manilaDate.ts`. Drop `temporal-polyfill` (~15 KB min+gz) because core engine functions (`reconcile`, `buildWeeklyBudgetSnapshot`, `msUntilNextManilaMidnight`) execute synchronously.
2.  **Exempt `Toggle` (`MWG-07`) and Defer `MWG-06` / `MWG-09`:** Retain `Toggle` (`<button type="button" role="switch">`), `FloatingNavPill`'s single `ResizeObserver` indicator path, and `.animate-entrance` tab transitions until platform baselines allow clean single-path CSS replacements without polyfills or dual code paths.
3.  **Overlay Hygiene (`MWG-01`) Without Breaking Portal Toasts or Node Tests:** Keep portal-based overlays while fixing duplicate/bubbling `Escape` handlers, missing effect dependencies, scroll containment (`dialog:modal`/`::backdrop` + `.overscroll-contain`), and `FloatingNavPill` dialog detection (`dialog[open], [role="dialog"]`).
4.  **Self-Contained `<Field>` Error Semantics (`MWG-04`):** Keep error rendering self-contained in `Field` (`role="alert"` preserved when `fieldError` is active) rather than introducing a new `<Form>` Context wrapper, preserving standalone callers (`ActivityFilters.tsx`) and existing Vitest assertions (`uiControls.test.tsx`, `walletActivity.test.tsx`).

--------------------------------------------------------------------------------

## Critical User Journeys (CUJs)

### CUJ 1: IME-Safe CJK / Multilingual Input
*   **Given**: A user enables an Input Method Editor (IME) and types in `AIAssistantModal` (chat prompt or thread rename), `CustomLabelPicker`, `LineItemBuilder` (description or amount), or `QuickAddDrawer` (invoice title).
*   **When**: The user presses `Enter` to confirm an active IME composition candidate.
*   **Then**: The active composition `Enter` keydown commits only the candidate text without submitting the form/message or shifting focus, while pressing `Escape` in thread rename cancels renaming without closing the modal.

### CUJ 2: Modal Overlay Scroll Containment & Keyboard Dismissal
*   **Given**: A user opens an overlay (`ModalShell`, `AIAssistantModal`, or `QuickAddDrawer`), including while editing an inline thread name or scrolling long overlay content.
*   **When**: The user scrolls inside the overlay or presses `Escape`.
*   **Then**: Scroll chaining onto the underlying page is blocked via `overscroll-behavior: contain` / `overscroll-contain`, `FloatingNavPill` hides reliably whenever any overlay (`dialog[open]` or `[role="dialog"]`) is active, and `Escape` fires once cleanly on the innermost active scope.

### CUJ 3: Post-Interaction Form Validation
*   **Given**: A form control inside `Field` (`src/ui/primitives/forms.tsx`) is initially untouched or later enters an invalid/error state.
*   **When**: The control renders initially, blurs after invalid user interaction, or recovers on valid input.
*   **Then**: Untouched controls expose `aria-invalid="false"` (preserving explicit child overrides like `"grammar"`) and show no premature invalid border; post-interaction invalid controls match `:user-invalid`, link help/error text via `aria-describedby`, and render `role="alert"` error feedback when `fieldError` is present.

### CUJ 4: Theme Chrome & Scrollbar Fidelity
*   **Given**: A user selects Light, Dark, or System mode via Settings (`src/state/theme.ts`).
*   **When**: `index.html` loads and `applyThemeToDom()` updates DOM theme state.
*   **Then**: `<meta name="color-scheme" content="light dark" />` declares document theme support, `document.documentElement.style.colorScheme` and `<meta name="theme-color">` update dynamically to `#FAF8F5` (light) or `#121316` (dark), controls inherit `--theme-primary` via `accent-color`, and scrollable containers render `scrollbar-width: thin` + `scrollbar-color` (falling back to `::-webkit-scrollbar*` only inside `@supports not (scrollbar-color: auto)`).

### CUJ 5: Timezone-Accurate `Asia/Manila` Dates & Keyboard-Accessible Markdown Tables
*   **Given**: The engine computes today's Manila date, billing cycles, or AI chat budget snapshots across timezones, or renders a Markdown table in AI Advisory output.
*   **When**: Engine helpers validate/shift calendar dates or a keyboard/screen-reader user navigates a rendered table.
*   **Then**: Date boundaries resolve against IANA `Asia/Manila` via `Intl.DateTimeFormat` and integer `Date.UTC` calendar math without `${date}T00:00:00.000Z` construction or hardcoded offsets, and scrollable Markdown tables expose `tabIndex={0}`, `role="region"`, `aria-label="Markdown table"`, and `<th scope="col">`.

--------------------------------------------------------------------------------

## Technical Plan

### Spec 1: Theme Chrome, Accent Color & Scrollbars (`MWG-08`)
*   **Guides**: `html`, `dark-mode`, `color`, `customize-scrollbar-color-and-thickness`
*   **Boundaries & Changes**:
    1.  Declare `<meta name="color-scheme" content="light dark" />` in `index.html` `<head>`.
    2.  Synchronize `root.style.colorScheme` (`"dark"` / `"light"`) and `<meta name="theme-color">` (`#121316` / `#FAF8F5`) inside `applyThemeToDom()` (`src/state/theme.ts:184-226`) so user theme overrides (`"light" | "dark" | "system"`) never desync from OS chrome.
    3.  Set `accent-color: var(--theme-primary)`, `scrollbar-width: thin`, and `scrollbar-color: var(--text-muted) var(--bg-muted)` on `:root` and apply `scrollbar-width: thin; scrollbar-color: var(--text-muted) var(--bg-muted);` to inner scrollable containers (`.overflow-y-auto, .overflow-x-auto, textarea`) in `src/index.css`.
    4.  Scope `::-webkit-scrollbar*` (`src/index.css:453-467`) inside `@supports not (scrollbar-color: auto)` so modern browsers use standard scrollbar styling without conflict.

### Spec 2: IME Composition Guards & Control Labels (`MWG-03`)
*   **Guides**: `ime-safe-enter-submit`, `accessibility`
*   **Boundaries & Changes**:
    1.  Guard `Enter` keydown handlers with `e.nativeEvent.isComposing || e.keyCode === 229` across all 5 verified handlers (`AIAssistantModal.tsx:238,673`, `CustomLabelPicker.tsx:66`, `LineItemBuilder.tsx:107` covering both description and amount inputs, and `QuickAddDrawer.tsx:991`). Leave `QuickAddDrawer.tsx:1009` (`type="date"`) untouched.
    2.  Associate explicit accessible labels in `AIAssistantModal.tsx`: `<label htmlFor="ai-chat-prompt-input" className="sr-only">Ask Kaban Intelligence</label>` + `id="ai-chat-prompt-input"` on the chat `<textarea>` (`:614-623`), `aria-label="Search advisories"` on search `<Input>` (`:321-327`), and `aria-label="Thread title"` on inline rename `<input>` (`:667-677`).

### Spec 3: Declarative Chat Textarea Sizing (`MWG-05`)
*   **Guide**: `form-fields-automatically-fit-contents`
*   **Boundaries & Changes**:
    1.  Add `[field-sizing:content]` on the chat `<textarea>` in `AIAssistantModal.tsx:622` while preserving `w-full max-h-32 min-h-[44px]` so the 44px touch target and max height remain intact.
    2.  In the `useLayoutEffect` resize hook (`AIAssistantModal.tsx:79-89`), return early before calling `resize()` or attaching the `resize` window listener whenever `CSS.supports("field-sizing", "content")` is true.

### Spec 4: Post-Interaction Validation & Error Semantics (`MWG-04`)
*   **Guides**: `validate-input-after-interaction`, `accessibility`
*   **Boundaries & Changes**:
    1.  In `src/ui/primitives/forms.tsx:51-98`, replace `:invalid` child selectors with `:user-invalid` and `[aria-invalid=true]` selectors on the `Field` container while preserving `flex flex-col gap-1.5`.
    2.  Default `aria-invalid` to `fieldError ? true : (childAriaInvalid ?? false)` so untouched controls report `"false"` while explicit child overrides (such as `"grammar"`) pass through cleanly, and update `onInputCapture` to set `aria-invalid="false"` when `!error` rather than removing the attribute.
    3.  Retain `<p id={errorId} role="alert">` on `Field` error output so standalone non-form `<Field>` usage (`ActivityFilters.tsx`) and existing contract tests continue working without a new `<Form>` Context abstraction.

### Spec 5: Modal Overlay Hygiene & Markdown Table Accessibility (`MWG-01`, `MWG-10`)
*   **Guides**: `prevent-page-scroll-under-modal-dialog`, `responsive-table`, `accessibility`
*   **Boundaries & Changes**:
    1.  Add `dialog:modal` and `dialog::backdrop` `overscroll-behavior: contain` (`overflow: hidden` on `::backdrop`) in `src/index.css` plus `overscroll-contain` on `AIAssistantModal.tsx:266` and `QuickAddDrawer.tsx:452`.
    2.  Remove the duplicate `window` `Escape` listener in `EditEntryModal.tsx:50-56` (delegating to `ModalShell`'s `busy`-aware handler), add `[close]` dependency array to `QuickAddDrawer.tsx:439-448`, call `e.preventDefault(); e.stopPropagation();` on inline rename `Escape` in `AIAssistantModal.tsx:674`, and update `FloatingNavPill.tsx:58,63` to observe `dialog[open], [role="dialog"]` including `attributes: true, attributeFilter: ["open", "role"]`.
    3.  In `src/ui/components/MarkdownRenderer.tsx:203-230`, add `tabIndex={0} role="region" aria-label="Markdown table"` on the table overflow wrapper and `scope="col"` on `<th>`.

### Spec 6: IANA `Asia/Manila` DateTime Formatting & Integer Calendar Math (`MWG-02`)
*   **Guide**: `capture-location-agnostic-data`
*   **Boundaries & Changes**:
    1.  Eliminate `MANILA_OFFSET_MS` from `src/core/engine/manilaDate.ts` by introducing a cached module-level `Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })` singleton with `formatToParts()` powering `getTodayManila()` and `msUntilNextManilaMidnight()`.
    2.  Export `parseUtcDate(dateOnly)` and `formatUtcDate(date)` built from integer `Date.UTC(year, month - 1, day)` validation and formatting; remove ``new Date(`${...}T00:00:00.000Z`)`` across `manilaDate.ts`, `reconciler.ts`, `aiBudgetSnapshot.ts`, `ledgerCommands.ts`, `obligationSchedule.ts`, `src/core/models/index.ts`, and `src/core/models/ai.ts`.
    3.  Update `AIAssistantModal.tsx:155` from UTC `new Date().toISOString().slice(0, 10)` to `getTodayManila()`.

--------------------------------------------------------------------------------

## Risks & Mitigations

| Risk | Likelihood & Impact | Mitigation |
| :--- | :--- | :--- |
| Wrapping `::-webkit-scrollbar*` in `@supports not` strips thin scrollbars from inner `.overflow-y-auto` panels because `scrollbar-width` does not inherit. | High / Medium visual regression | Declare `scrollbar-width: thin; scrollbar-color: var(--text-muted) var(--bg-muted);` explicitly on `.overflow-y-auto, .overflow-x-auto, textarea` in addition to `:root`. |
| Changing `forms.tsx` `aria-invalid` or `role="alert"` breaks existing React SSR/unit tests (`uiControls.test.tsx`, `walletActivity.test.tsx`). | Medium / Test failure | Preserve explicit child `aria-invalid` overrides (`fieldError ? true : (childAriaInvalid ?? false)`) and retain `<p id={errorId} role="alert">` inside `Field`. |
| Using `Intl.DateTimeFormat.formatToParts()` alters `msUntilNextManilaMidnight()` millisecond precision. | Low / Subtle timer drift | Compute `elapsedTodayMs` from `hour`, `minute`, `second` parts plus `now.getUTCMilliseconds()` and verify against `tests/core/interestEngine.test.ts:47-54`. |
| Adding hooks (`useId`, `useLayoutEffect`, `useCallback`) to `QuickAddDrawer` crashes `tests/core/customLabels.test.tsx`. | High if added | Keep `QuickAddDrawer`'s existing hook set untouched (`useEffect` only gains `[close]` dependency array). |

--------------------------------------------------------------------------------

## Alternatives Considered

### Alternative A: Install `temporal-polyfill` and `input-switch-polyfill` vs. Zero-Dependency IANA `Intl.DateTimeFormat` + Accessible `<button role="switch">`
*   **Decision: Rejected polyfills; Selected zero-dependency `Intl.DateTimeFormat` + existing `Toggle`.**
*   `temporal-polyfill` (~15 KB min+gz) cannot be dynamically imported inside synchronous `manilaDate.ts`, `reconciler.ts`, or `useMemo` callers, and `<input type="checkbox" switch>` + `input-switch-polyfill` breaks `@types/react` `19.3.0` / `uiControls.test.tsx` without improving accessibility over the existing 34-line `<button role="switch">`.

### Alternative B: Full Portal-to-`<dialog>` Rewrite Across 5 Overlays vs. Surgical Portal Overlay Hygiene (`MWG-01`)
*   **Decision: Selected Surgical Overlay Hygiene; Rejected in-place full `<dialog>` rewrite in this change.**
*   Migrating portal overlays to top-layer `showModal()` hides `SettingsScreen.tsx` `z-[9999]` portal status toasts behind `<dialog>` backdrops and introduces hook/SSR regressions in `customLabels.test.tsx`. Fixing `overscroll-behavior: contain` (`dialog:modal` / `::backdrop` + `.overscroll-contain`), duplicate `Escape` listeners, rename `Escape` propagation, and `FloatingNavPill` dialog detection resolves real bugs cleanly.

### Alternative C: CSS `Anchor Positioning` (`MWG-06`) + `startViewTransition` (`MWG-09`) Dual Paths vs. Existing Single-Path Primitives
*   **Decision: Deferred `MWG-06` and `MWG-09`.**
*   Retaining CSS Anchor Positioning alongside `ResizeObserver` deletes zero JS while doubling indicator state; wrapping tab switches in `startViewTransition` + `flushSync` captures lazy `<Suspense>` skeletons and risks `scripts/verify-portability.mjs` `src/state/` violations where `.animate-entrance` already operates reliably.

--------------------------------------------------------------------------------

## Detailed Implementation Plan

### Phased Rollout

*   **Phase 1 — Theme Chrome, Scrollbars, IME, Auto-Sizing Textarea & Tables (Specs 1, 2, 3, 5-table):** `index.html`, `src/state/theme.ts`, `src/index.css`, `src/ui/components/AIAssistantModal.tsx`, `src/ui/components/CustomLabelPicker.tsx`, `src/ui/components/LineItemBuilder.tsx`, `src/ui/components/QuickAddDrawer.tsx`, `src/ui/components/MarkdownRenderer.tsx`.
*   **Phase 2 — Validation & Overlay Hygiene (Specs 4, 5-overlays):** `src/ui/primitives/forms.tsx`, `src/ui/components/EditEntryModal.tsx`, `src/ui/components/FloatingNavPill.tsx`, `src/index.css` (`dialog:modal` / `dialog::backdrop`).
*   **Phase 3 — IANA `Asia/Manila` & Integer Calendar Dates (Spec 6):** `src/core/engine/manilaDate.ts`, `src/core/engine/reconciler.ts`, `src/core/engine/aiBudgetSnapshot.ts`, `src/core/engine/ledgerCommands.ts`, `src/core/engine/obligationSchedule.ts`, `src/core/models/index.ts`, `src/core/models/ai.ts`, `src/ui/components/AIAssistantModal.tsx:155`.

### Target Files to Modify

1.  `index.html:4-7`: Add `<meta name="color-scheme" content="light dark" />`.
2.  `src/state/theme.ts:184-226`: Sync `root.style.colorScheme` and `<meta name="theme-color">` (`#121316` / `#FAF8F5`) inside `applyThemeToDom()`.
3.  `src/index.css:70-140, 452-467`: Add `accent-color: var(--theme-primary)`, `:root` & scrollable container `scrollbar-width: thin` + `scrollbar-color`, `dialog:modal` / `dialog::backdrop` scroll containment, and wrap `::-webkit-scrollbar*` in `@supports not (scrollbar-color: auto)`.
4.  `src/ui/components/AIAssistantModal.tsx:79-89, 155, 237-242, 260-266, 321-327, 614-623, 667-677`: Gate `useLayoutEffect` resize/listener behind `!CSS.supports("field-sizing", "content")`, use `getTodayManila()`, add IME guards (`:238`, `:673`), prevent rename `Escape` propagation (`:674`), add `overscroll-contain` (`:266`), add accessible labels (`:321-327`, `:614-623`, `:667-677`), and add `[field-sizing:content]` (`:622`).
5.  `src/ui/components/CustomLabelPicker.tsx:65-75`: Add `isComposing || keyCode === 229` guard on `Enter`.
6.  `src/ui/components/LineItemBuilder.tsx:106-111`: Add `isComposing || keyCode === 229` guard in `handleKeyDown`.
7.  `src/ui/components/QuickAddDrawer.tsx:439-456, 990-995`: Add `[close]` dependency array on `Escape` `useEffect`, add `overscroll-contain` on backdrop, and add `isComposing || keyCode === 229` guard on invoice `title` `Enter` (leaving `:1009` `type="date"` untouched).
8.  `src/ui/components/EditEntryModal.tsx:50-56`: Remove duplicate `window` `Escape` listener (and unused `useEffect` import).
9.  `src/ui/components/FloatingNavPill.tsx:57-64`: Update selector to `dialog[open], [role="dialog"]` and observe `attributes: true, attributeFilter: ["open", "role"]`.
10. `src/ui/primitives/forms.tsx:51-98`: Switch `:invalid` selectors to `:user-invalid` + `[aria-invalid=true]`, default `aria-invalid` to `fieldError ? true : (childAriaInvalid ?? false)`, set `aria-invalid="false"` in `onInputCapture` when `!error`, preserve `role="alert"`.
11. `src/ui/components/MarkdownRenderer.tsx:203-230`: Add `tabIndex={0} role="region" aria-label="Markdown table"` on scroll wrapper and `scope="col"` on `<th>`.
12. `src/core/engine/manilaDate.ts`, `src/core/engine/reconciler.ts`, `src/core/engine/aiBudgetSnapshot.ts`, `src/core/engine/ledgerCommands.ts`, `src/core/engine/obligationSchedule.ts`, `src/core/models/index.ts`, `src/core/models/ai.ts`: Replace `MANILA_OFFSET_MS` with cached IANA `Asia/Manila` `Intl.DateTimeFormat` + `formatToParts()` and standardize `YYYY-MM-DD` validation/parsing on integer `Date.UTC` helpers (`parseUtcDate` / `formatUtcDate`).

### Verification Plan

*   **Legacy Pattern Re-Scan**: `npx modern-web-guidance legacy-scan src --json` (`npx.cmd` on Windows) — verify resolved hits for `ime-safe-enter-submit` and `form-fields-automatically-fit-contents`, leaving only the exempted `<input type="date">` at `QuickAddDrawer.tsx:1009` and `@supports not (scrollbar-color: auto)` WebKit scrollbar fallback in `src/index.css`.
*   **Typecheck**: `npm run typecheck` (`tsc --noEmit`).
*   **Unit & Integration Tests**: `npm test` (`vitest run`, executed in Node environment per `vite.config.ts`).
*   **Production Build**: `npm run build` (`tsc --noEmit && vite build`).
*   **Portability & Lockfile Verification**: `node scripts/verify-portability.mjs` and `npm run verify:lock`.
*   **Knowledge Graph Update**: `graphify update .` after source edits.
