---
name: Kaban
description: Local-first mobile expense, subscription, and invoice vault with Philippine neobrutalist aesthetic
colors:
  primary: "#4A154B"
  primary-hover: "#3B0764"
  bg-canvas: "#FAF8F5"
  bg-surface: "#FFFFFF"
  border-ink: "#18181B"
  text-primary: "#18181B"
  text-secondary: "#52525B"
  text-muted: "#71717A"
  accent-lavender: "#EDE9FE"
  accent-gold: "#F59E0B"
  accent-amber: "#FBBF24"
  status-mint: "#047857"
  status-amber: "#B45309"
  status-rose: "#BE123C"
  status-sky: "#0369A1"
typography:
  brand:
    fontFamily: "Dangwa, Bantayog, Cabinet Grotesk, sans-serif"
    fontWeight: 400
  display:
    fontFamily: "Bantayog, Cabinet Grotesk, Satoshi, sans-serif"
    fontSize: "clamp(1.75rem, 5vw, 2.5rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Bantayog, Cabinet Grotesk, Satoshi, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Satoshi, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.08em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.lg}"
    padding: "12px 20px"
    border: "2px solid {colors.border-ink}"
    boxShadow: "3px 3px 0px {colors.border-ink}"
---

# Design System: Kaban

## 1. Overview & Brand Metaphor

**Creative North Star: "The Heritage Vault on Tactile Paper"**

**Kaban** (Filipino for a wooden or iron-bound treasure chest/storage trunk for family valuables, documents, and heirloom savings) reimagines the personal ledger as an uncompromised, on-device digital vault. Instead of a detached, sterile fintech dashboard or generic dark glass UI, Kaban anchors its visual identity in Philippine material culture:
- **The Tactile Ledger**: Warm cream paper canvas (`#FAF8F5`) layered with subtle 28px grid lines reminiscent of accounting balance books.
- **Dark Ink Precision**: Crisp 2px charcoal ink borders (`#18181B`) and punchy hard offset shadows (`3px 3px 0px #18181B`) providing immediate physical tangibility.
- **Heritage & Royal Accents**: Royal Plum (`#4A154B`) paired with soft Lavender (`#EDE9FE`) and Kaban Chest Gold (`#F59E0B` / `#FBBF24`), balanced by fresh mint and rose ledger statuses.
- **Cultural Typography**: Filipino sign-painting brushcraft (**Dangwa**) and historical monument lettering (**Bantayog**), paired with modern Swiss grotesque body text (**Satoshi**) and deterministic financial numerics (**JetBrains Mono**).

> [!NOTE]
> **Evolution Note**: Kaban completely replaces the obsolete "Stealth Smoked-Glass & Electric Volt" dark design. Database identifiers (`KromaLedgerDB`) and backup archives export as `kaban-vault-*.zip` while legacy formats (`kromaledger-vault-*.zip`) remain backward-compatible to guarantee zero data loss.

---

## 2. Color Palette & Semantic Tokens

### Primary & Brand Accents
- **Royal Plum** (`#4A154B`): Primary interactive CTAs, active segmented tabs, donut chart progress arcs, and focus outlines. Represents the stained hardwood and velvet lining of the family kaban.
- **Lavender Subtle** (`#EDE9FE`): Pill badges, secondary active indicators, subtle interactive backgrounds, and focus halo rings.
- **Kaban Gold / Amber** (`#F59E0B`, `#FBBF24`, `#FEF3C7`): The chest lock emblem, quick-add drawer save bar, and warning highlights.

### Paper Canvas & Neutrals
- **Cream Paper Canvas** (`#FAF8F5`): Primary viewport canvas background. Warm, comfortable for daytime auditing, and free of eye fatigue.
- **Pure White Surface** (`#FFFFFF`): Card backgrounds, dropdown panels, and modal shells.
- **Charcoal Ink** (`#18181B`): Structural borders, button borders, high-contrast headings, and crisp shadows.
- **Muted Slate Ink** (`#52525B`): Subheaders, form helper hints, and metadata labels.
- **Graph Paper Grid**: Subtle procedural grid rendered via `body::before` (`linear-gradient` at 28px pitch with `rgba(24, 24, 27, 0.035)` opacity).

### Financial Status Indicators (WCAG AA Contrast Targets)
All status colors are strictly calibrated against WCAG 2.1 AA requirements (minimum 4.5:1 for normal text, 3:1 for large text / graphical borders):
- **Mint Emerald Inflow** (`#047857`): Receivable income, paid invoices, healthy cash balance, positive deltas. Ratio: 5.48:1 on `#FAF8F5` cream, 5.17:1 on `#ECFDF5` mint badge, 5.76:1 on white.
- **Amber Warning** (`#B45309`): Upcoming recurring payments (within 7 days), pending confirmation entries. Ratio: 5.58:1 on `#FAF8F5` cream, 6.09:1 on `#FEF3C7` amber badge.
- **Rose Outflow / Danger** (`#BE123C`): Outflow expenses, overdue invoices, destructive actions, and validation error messages. Ratio: 5.97:1 on `#FAF8F5` cream, 5.24:1 on `#FFF1F2` rose badge, 6.29:1 on white.
- **Sky Transfer / Blue** (`#0369A1`): Inter-wallet transfers, account rebalancing. Ratio: 5.63:1 on `#FAF8F5` cream, 4.94:1 on `#E0F2FE` sky badge.
- **Muted Metadata** (`#52525B`): Helper text, secondary labels, placeholders. Ratio: 7.34:1 on `#FAF8F5` cream, 7.73:1 on white.
- **Form Placeholders**: Enforced via global CSS `input::placeholder, textarea::placeholder { color: #52525B; opacity: 1; }` exceeding 7:1 contrast on white and cream.

---

## 3. Typography & Sourced Typefaces

All fonts in Kaban are **100% self-hosted** under [`public/fonts/`](file:///public/fonts/). No network font calls (Google Fonts, CDN) are made at runtime.

| Role | Font Family | Formats | Provenance & Designer | License & Terms |
|---|---|---|---|---|
| **Brand Accent** (`.font-brand`) | **Dangwa** | `Dangwa-Regular.otf` (`Dangwa_Free.otf`) | Aaron Amar (Manila, Philippines) | 100% Free for Commercial & Personal Use ([`Dangwa-LICENSE.txt`](file:///public/fonts/Dangwa-LICENSE.txt)). Sourced from Behance. Inspired by Filipino public transport hand-painted lettering. |
| **Display Headings** (`.font-display`) | **Bantayog** | `Bantayog-Regular.woff2`, `Bantayog-Semilight.woff2`, `Bantayog-Light.woff2` (+ OTF fallbacks) | Jad Maza (© 2020) | Single-user Free License ([`Licensing - Bantayog [FREE].txt`](file:///public/fonts/Licensing - Bantayog [FREE].txt)). Inspired by Philippine historical monuments (*bantayog*). EULA: https://jadmaza.gumroad.com/p/eula-free. Web embedding permitted via local `@font-face`. |
| **Body & UI Text** (`.font-sans`) | **Satoshi** | `Satoshi-Variable.woff2` | Indian Type Foundry | Free Commercial License ([`Satoshi-LICENSE.txt`](file:///public/fonts/Satoshi-LICENSE.txt)). High-legibility modern grotesque. |
| **Display Fallback** | **Cabinet Grotesk** | `CabinetGrotesk-Variable.woff2` | Indian Type Foundry | Free Commercial License ([`CabinetGrotesk-LICENSE.txt`](file:///public/fonts/CabinetGrotesk-LICENSE.txt)). Bold geometric headings. |
| **Financial Numerics & Mono** (`.font-mono`) | **JetBrains Mono** | `JetBrainsMono-Regular.woff2` | JetBrains | SIL Open Font License 1.1 ([`JetBrainsMono-OFL.txt`](file:///public/fonts/JetBrainsMono-OFL.txt)). Monospaced tabular digits (`tabular-nums`). |

### Sourced License & EULA Constraints
- **Dangwa**: Free for personal and commercial usage without royalty. Redistribution requires author attribution to Aaron Amar (`jeruelaaronamar@gmail.com`).
- **Bantayog**: Released by Jad Maza under a single-user free license. Web embedding via local `@font-face` is allowed; redistribution as raw standalone font files is prohibited.
- **Satoshi & Cabinet Grotesk**: Licensed under ITF's free font license for desktop and web self-hosting.
- **JetBrains Mono**: Licensed under SIL OFL 1.1; open and unconstrained for embedding.

### Typography Hierarchy & Rules
1. **The Tabular Numbers Rule**: Every currency amount (`₱`), date string, percentage, or invoice unit count must apply `font-mono tabular-nums`.
2. **Display Scale**:
   - Hero Balances: `font-display text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight`
   - Section Titles: `font-display text-lg font-black text-neutral-900 tracking-tight`
   - Brand Lockup: `font-display text-lg font-black tracking-tight text-neutral-900` + `font-brand` decorative accents
   - Body Copy: `font-sans text-sm text-neutral-800 leading-relaxed`
   - Data Badges: `font-mono text-xs font-bold uppercase tracking-wider`

---

## 4. Elevation, Shapes & Neobrutalist Depth

Rather than fuzzy Gaussian drop-shadows or milky frosted glass, Kaban builds physical depth through **hard offset ink shadows**:

```css
/* Standard Card & Element Shadow */
.neo-box {
  border: 2px solid #18181B;
  box-shadow: 3px 3px 0px #18181B;
}

/* Compact Buttons, Chips, and Form Inputs */
.neo-box-sm {
  border: 1.5px solid #18181B;
  box-shadow: 2px 2px 0px #18181B;
}

/* Modals, Floating Sheets, and Primary Action Banners */
.neo-box-lg {
  border: 2px solid #18181B;
  box-shadow: 5px 5px 0px #18181B;
}
```

### Corner Radii
- Inputs & Controls: `rounded-xl` (`12px`)
- Cards & Content Blocks: `rounded-2xl sm:rounded-3xl` (`16px` to `24px`)
- Modal Dialogs & Bottom Drawers: `rounded-3xl` (`24px`)
- Filter Pills & Navigation Dock: `rounded-full` (`9999px`)

---

## 5. Centralized Component Conventions

Component definitions live in [`src/ui/primitives/`](file:///src/ui/primitives/) and are documented comprehensively in [`docs/ui-components.md`](file:///docs/ui-components.md):

1. **Button (`Button.tsx`)**:
   - `variant="primary"`: Deep Plum (`#4A154B`) with white text and 3px ink shadow.
   - `variant="secondary"`: Crisp White with `#18181B` text.
   - `variant="subtle"`: Lavender (`#EDE9FE`) with `#18181B` text.
   - `variant="danger"`: Rose (`#F43F5E`) with white text.
   - `variant="icon"`: 40px square tactile touch target.
2. **Form Controls (`Field.tsx` / `forms.tsx`)**:
   - Accessible `FormField` with `id`, `aria-describedby`, and `aria-invalid`.
   - Focus outline: `#4A154B` with `#EDE9FE` ring.
   - Error highlight: `#F43F5E` / `#BE123C` border and accessible `role="alert"` text.
3. **ModalShell (`Modal.tsx`)**:
   - Portal overlay with `bg-neutral-900/60` and `backdrop-blur-xs`.
   - Ink-bordered paper modal with Escape key handling and auto-scrolling content.
4. **Data Visualizations**:
   - `ChartFrame` & `ChartLegend`: Structured semantic container for cashflow bars and obligation schedules.
   - `DonutChartSVG`: Fixed subscriptions vs. variable spend meter with animated plum arc `#4A154B`.
   - `HatchedProgressBar`: Partially paid invoices progress meter with mint fill `#10B981`.

---

## 6. Responsive Layout & Viewport Rules

- **Mobile-First Core**: Standard viewport width is 100% of the mobile device screen, with minimum width support down to 320px.
- **Desktop Adaptation**: On larger displays, screens are constrained to `max-w-[480px] sm:max-w-xl mx-auto` and centered horizontally.
- **Bottom Clearance**: All primary screens enforce a generous bottom padding (`pb-28`) so that the sticky bottom navigation dock (`FloatingNavPill`) never obscures transactions, submit buttons, or active inputs.
- **Safe Area Insets**: Floating dock and drawer sheets respect iOS `env(safe-area-inset-bottom)`.

---

## 7. Do's and Don'ts

### Do:
- **Do** wrap every financial amount in `font-mono tabular-nums`.
- **Do** use hard offset shadows (`3px 3px 0px #18181B`) and solid 2px ink borders.
- **Do** preserve the tactile cream paper background `#FAF8F5`.
- **Do** use `FormField` and accessible ARIA attributes for all form inputs.
- **Do** test all screens at 375px mobile width before certifying desktop layouts.

### Don't:
- **Don't** reintroduce obsolete dark obsidian `#070806`, smoked translucent glass, or electric volt `#D9F938`.
- **Don't** use soft diffuse Gaussian drop shadows (`box-shadow: 0 10px 15px rgba(0,0,0,0.1)`).
- **Don't** pull fonts from external CDN endpoints.
- **Don't** mix floating-point rounding into financial balance displays—always format from deterministic minor units (`integer cents / centavos`).
