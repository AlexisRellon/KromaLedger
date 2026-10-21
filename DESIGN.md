---
name: KromaLedger
description: Local-first mobile expense, subscription, and invoice tracker
colors:
  primary: "#D9F938"
  primary-hover: "#E4FB68"
  bg-canvas: "#070806"
  bg-surface: "rgba(255, 255, 255, 0.03)"
  border-subtle: "rgba(255, 255, 255, 0.08)"
  text-primary: "#FFFFFF"
  text-secondary: "#A3A3A3"
  text-muted: "#737373"
  status-green: "#34D399"
  status-amber: "#FBBF24"
  status-rose: "#F43F5E"
typography:
  display:
    fontFamily: "Cabinet Grotesk, Satoshi, sans-serif"
    fontSize: "clamp(1.75rem, 5vw, 2.5rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Cabinet Grotesk, Satoshi, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Satoshi, Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.15em"
rounded:
  sm: "8px"
  md: "16px"
  lg: "24px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#070806"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
---

# Design System: KromaLedger

## Overview

**Creative North Star: "The Obsidian Instrument"**

KromaLedger is designed as a precision handheld financial instrument: dark, quiet, tactile, and laser-focused. Built upon deep obsidian backgrounds `#070806` bathed in a subtle atmospheric olive aura, it conveys total privacy and local sovereignty. Translucent smoked glass cards layered over dark surfaces create tactile depth without visual clutter, while high-voltage Electric Volt (`#D9F938`) punctuate active workflows, critical figures, and completion states.

The density is compact yet breathable, designed for swift one-thumb mobile interactions, tactile physical keypad feedback, and high-legibility ledger auditing. Every transition is snappy and purposeful, avoiding ornamental fluff in favor of clarity.

**Key Characteristics:**
- **Obsidian & Smoked Glass**: Deep blacks, subtle olive gradients, and fine translucent borders (`rgba(255, 255, 255, 0.08)`).
- **Electric Volt Punctuation**: Single electric accent (`#D9F938`) reserved for active state, primary buttons, and key totals.
- **Tri-Type Hierarchy**: Cabinet Grotesk for bold headers, Satoshi for natural reading, and JetBrains Mono for financial figures.
- **Tactile 3-Second Input**: Mobile-first physical touch targets with instant tactile response.

## Colors

The palette balances dark room serenity with high-visibility functional highlights.

### Primary
- **Electric Volt** (`#D9F938`): Primary action button, active nav pill dot, ledger balance accents, and progress indicators. Used with deliberate restraint.

### Neutral
- **Obsidian Canvas** (`#070806`): Deepest background canvas for maximum OLED contrast and battery efficiency.
- **Smoked Glass Surface** (`rgba(255, 255, 255, 0.03)`): Card surfaces with `backdrop-blur-md` for structural grouping.
- **Ghost Border** (`rgba(255, 255, 255, 0.08)`): Hairline structural containment defining card perimeters.
- **Pure White** (`#FFFFFF`): Primary headings and major financial values.
- **Silver Muted** (`#A3A3A3`): Subheaders, secondary descriptions, and inactive states.

### Status Accents
- **Paid Emerald** (`#34D399`): Paid invoice and receivable status dots.
- **Pending Amber** (`#FBBF24`): Due subscriptions and pending reconciliation alerts.
- **Overdue Rose** (`#F43F5E`): Overdue invoice warnings and negative balance trends.

### Named Rules
**The 5% Volt Rule.** Electric Volt is used on ≤5% of any screen. Its rarity commands instant focus.

## Typography

**Display Font:** Cabinet Grotesk (sans-serif)
**Body Font:** Satoshi (sans-serif)
**Label/Mono Font:** JetBrains Mono (monospace)

**Character:** Bold brutalist titles meet Swiss-clean typography and razor-sharp monospaced accounting tables.

### Hierarchy
- **Display** (weight 800, clamp(1.75rem, 5vw, 2.5rem), line-height 1.1): Screen titles and hero balances.
- **Headline** (weight 700, 1.25rem, line-height 1.2): Section headers and modal titles.
- **Title** (weight 600, 1rem, line-height 1.3): Card titles and merchant names.
- **Body** (weight 400, 0.875rem, line-height 1.5): Standard text, instructions, and list notes.
- **Label** (weight 700, 0.75rem, letter-spacing 0.15em, uppercase): Mono badges, tags, and table column titles.

### Named Rules
**The Tabular-Numbers Rule.** All financial amounts, dates, and numpad keys must use `font-mono tabular-nums`.

## Layout

Mobile-first single-column structure constrained to a maximum width of 480px, centered on desktop screens. Generous bottom clearance (80px+) ensures floating navigation docks never obscure transaction rows or submission buttons. Spacing adheres to an 8px base rhythm (8px, 16px, 24px, 32px).

## Elevation & Depth

Surfaces avoid drop-shadow elevation in favor of subtle translucent layering and backdrop blurring.

### Shadow Vocabulary
- **Smoked Ambient** (`box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5)`): Large modal overlays and drawer sheets.
- **Volt Glow** (`box-shadow: 0 0 8px #D9F938`): Indicator dots and live status rings.

### Named Rules
**The Tonal Depth Rule.** Depth is created through surface translucency and hairline borders, not opaque stacked shadows.

## Shapes

Organic rounded geometry softens the technical precision of the dark theme.

- **Cards & Sheets:** 24px (`rounded-3xl`) for top-level cards and bottom sheets.
- **Buttons & Inputs:** 16px (`rounded-2xl`) for tactile touch targets.
- **Badges & Pills:** Full pill radius (`rounded-full`) for status indicators and navigation floating dock.

## Components

### Buttons
- **Shape:** 16px radius (`rounded-2xl`).
- **Primary (Volt):** Background `#D9F938`, text `#070806`, padding `12px 20px`, font-semibold. Hover increases brightness to 105%.
- **Secondary (Smoked):** Background `rgba(255, 255, 255, 0.05)`, border `rgba(255, 255, 255, 0.1)`, text white.

### Cards / Containers
- **Corner Style:** 24px (`rounded-3xl`).
- **Background:** `rgba(255, 255, 255, 0.03)` with `backdrop-blur-md`.
- **Border:** `1px solid rgba(255, 255, 255, 0.08)`.
- **Internal Padding:** 20px (`p-5`).

### Floating Nav Pill
- **Corner Style:** Full pill radius (`rounded-full`).
- **Background:** `rgba(13, 15, 10, 0.85)` with `backdrop-blur-xl`.
- **Border:** `1px solid rgba(255, 255, 255, 0.1)`.

## Do's and Don'ts

### Do:
- **Do** format every currency balance and transaction amount in JetBrains Mono (`font-mono tabular-nums`).
- **Do** keep cards and modal surfaces translucent with `backdrop-blur-md` and `border border-white/[.08]`.
- **Do** reserve Electric Volt `#D9F938` for primary calls to action, active indicators, and critical metrics.

### Don't:
- **Don't** use standard blue, purple, or rainbow gradients.
- **Don't** use sharp 0px corners on interactive cards or buttons.
- **Don't** use light-mode backgrounds or low-contrast gray text on dark cards.
