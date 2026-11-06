# Kaban UI Component System & Conventions

## 1. Overview & Architectural Principles

The **Kaban** UI component library (`src/ui/primitives/`) provides centralized, accessible, neobrutalist building blocks for all financial screens, modals, and drawers.

### Centralization & Ownership Model
To avoid visual drift and duplicated form/button logic across screens:
- **Canonical Primitives (`src/ui/primitives/`)**: All buttons, form fields, modal shells, chart containers, and data meters are declared once in `src/ui/primitives/` and exported via `src/ui/primitives/index.tsx`.
- **Specialized Composite Components (`src/ui/components/`)**: Higher-level domain widgets (e.g., [`TopStatusHeader.tsx`](file:///src/ui/components/TopStatusHeader.tsx), [`FloatingNavPill.tsx`](file:///src/ui/components/FloatingNavPill.tsx), [`QuickAddDrawer.tsx`](file:///src/ui/components/QuickAddDrawer.tsx), [`PhysicalWalletCard.tsx`](file:///src/ui/components/PhysicalWalletCard.tsx)) consume primitives exclusively.
- **Worker Ownership Separation**:
  - GPT Worker (`ctx_3cd5bf98c6b4`): Authored canonical form controls, accessible field wrappers, and shared button variants (`controls.tsx`, `forms.tsx`).
  - Primary AGY Worker (`ctx_aed0ac6253ce`): Redesigned screens, integrated primitives into application routes, unified exports, and owns CSS/TSX.
  - Secondary AGY Worker (`ctx_8c426d633ed6`): Authored design system documentation, verified font assets, and established UI component contracts.

---

## 2. Design Tokens & Neobrutalist Conventions

All primitives conform to Kaban's tactile **Neobrutalist Paper** system:

| Token | Class / CSS Value | Description |
|---|---|---|
| **Canvas** | `#FAF8F5` | Warm cream paper base |
| **Ink Stroke** | `#18181B` (2px solid) | Dark charcoal ink borders on cards, inputs, and buttons |
| **Hard Offset Shadow** | `3px 3px 0px #18181B` (`.neo-box`) | Default structural hard drop shadow |
| **Small Offset Shadow** | `2px 2px 0px #18181B` (`.neo-box-sm`) | Compact controls, inputs, badges |
| **Large Offset Shadow** | `5px 5px 0px #18181B` (`.neo-box-lg`) | Modals, hero cards, prominent sheets |
| **Primary Plum** | `#4A154B` | Deep royal plum for primary buttons and focus outlines |
| **Lavender Subtle** | `#EDE9FE` | Soft purple for secondary badges, subtle buttons, and focus halos |
| **Kaban Gold / Amber** | `#F59E0B`, `#FBBF24`, `#FEF3C7` | Brand chest accents, warning states, highlight pills |
| **Mint Emerald** | `#10B981` | Income, positive cashflow, paid invoices, healthy balances |
| **Rose Crimson** | `#F43F5E`, `#BE123C` | Expenses, debt, overdue invoices, destructive actions, form errors |

### Interactive Button Dynamics (`.neo-btn-interactive`)
- **Default**: `shadow-[3px_3px_0px_#18181B]`
- **Hover**: `translate(-1px, -1px)` with `shadow-[4px_4px_0px_#18181B]`
- **Active / Pressed**: `translate(2px, 2px)` with `shadow-[1px_1px_0px_#18181B]`
- **Disabled**: `opacity-50 pointer-events-none shadow-none transform-none`

---

## 3. Primitives API Reference

### 3.1 Button (`src/ui/primitives/controls.tsx`)
Polymorphic accessible button with predefined semantic variants, sizes, and busy state.

```tsx
import { Button, type ButtonProps } from "@/ui/primitives";
```

#### Props
- `variant?: "primary" | "secondary" | "subtle" | "danger" | "ghost" | "icon"` (default: `"primary"`)
  - `primary`: `#4A154B` deep plum background with white text.
  - `secondary`: `#EDE9FE` lavender background with `#18181B` text.
  - `subtle`: `#EDE9FE` lavender background with `#18181B` text.
  - `danger`: `#BE123C` crimson background with white text.
  - `ghost`: Transparent background with `#18181B` text and hover highlight.
  - `icon`: Square icon button with rounded-xl corners and padding.
- `size?: "sm" | "md" | "lg"` (default: `"md"`)
  - `sm`: `px-3 py-1.5 text-xs rounded-xl`
  - `md`: `px-5 py-3 text-sm rounded-xl`
  - `lg`: `px-6 py-4 text-base rounded-2xl`
- `busy?: boolean`: Accessible busy indicator (`aria-busy="true"`, disables interaction).
- `disabled?: boolean`: Disables click, reduces opacity to 50%, strips shadow.
- Standard `ComponentPropsWithRef<"button">` supported (defaults to `type="button"`).

#### Legacy Compatibility
- `VoltButton`: Retained as a thin wrapper over `<Button variant="primary" size="md" />` for backwards-compatibility across legacy imports.

---

### 3.2 Field & FormField (`src/ui/primitives/forms.tsx`)
Accessible form field wrapper that binds labels, help text, error alerts, and automatically links `htmlFor`, `id`, `aria-describedby`, and `aria-invalid` to child controls. Supports both direct element children and render props.

```tsx
import { Field, FormField, Input } from "@/ui/primitives";

// Direct element child pattern (canonical):
<Field id="amount" label="Amount" help="In Philippine pesos" error={errors.amount}>
  <Input aria-describedby="currency" required />
</Field>

// Render prop pattern (supported via Field / FormField alias):
<FormField label="Entry Title" hint="Optional merchant or note" error={errors.title}>
  {({ id, "aria-describedby": describedBy, "aria-invalid": isInvalid }) => (
    <Input
      id={id}
      aria-describedby={describedBy}
      aria-invalid={isInvalid}
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      placeholder="e.g., Grocery replenishment"
    />
  )}
</FormField>
```

#### Props (`FieldProps` / `FormFieldProps`)
- `label: ReactNode`: Required field label rendered in bold uppercase tracking-wider text.
- `id?: string`: Optional explicit HTML id (falls back to child's id or React `useId()`).
- `help?: ReactNode` / `hint?: ReactNode`: Helper note displayed as a description or label badge.
- `error?: ReactNode`: Validation error string rendered with `role="alert"` in `#BE123C`.
- `required?: boolean`: Appends an asterisk `*` to the label.
- `children`: Single `ReactElement` control or render function receiving accessibility bindings.

#### FormActions (`src/ui/primitives/forms.tsx`)
Container for action buttons with right-aligned flex layout:
```tsx
<FormActions>
  <Button variant="secondary" onClick={onCancel}>Cancel</Button>
  <Button type="submit" variant="primary">Save Changes</Button>
</FormActions>
```

---

### 3.3 Form Controls: Input, Select, Textarea (`src/ui/primitives/controls.tsx`)
Consistent ink-bordered inputs with neobrutalist focus rings and invalid indicators.

#### Shared Features
- Border: `2px solid #18181B`
- Background: `#FFFFFF`
- Corner Radius: `12px` (`rounded-xl`)
- Shadow: `2px 2px 0px #18181B`
- Focus State: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4A154B]`
- Error State (`hasError` / `aria-invalid="true"`): `border-[#BE123C] aria-invalid:border-[#BE123C]`
- Disabled State: `disabled:bg-[#F4F1EA] disabled:opacity-60 disabled:cursor-not-allowed`

---

### 3.4 ModalShell (`src/ui/primitives/Modal.tsx`)
Accessible dialog wrapper rendered into `document.body` via `createPortal`.

```tsx
import { ModalShell } from "@/ui/primitives";

<ModalShell
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Edit Wallet"
  subtitle="On-device physical wallet configuration"
  maxWidth="lg"
  footer={
    <div className="flex justify-end gap-2">
      <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button variant="primary" onClick={handleSave}>Save Changes</Button>
    </div>
  }
>
  <div className="space-y-4">...modal content...</div>
</ModalShell>
```

#### Props (`ModalShellProps`)
- `isOpen?: boolean`: Controls modal mounting (returns `null` when false).
- `onClose: () => void`: Callback triggered on Esc key or background backdrop click.
- `title: string`: Modal header title.
- `subtitle?: ReactNode`: Monospace subtitle underneath the title.
- `busy?: boolean`: When true, prevents closing via backdrop click or Escape key.
- `maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl"`: Restricts modal width (default: `"lg"`).
- `footer?: ReactNode`: Sticky bottom bar separated by a 2px ink divider.

---

### 3.5 ChartFrame & ChartLegend (`src/ui/primitives/ChartFrame.tsx`)
Unified frame for data visualizations (cashflow graphs, category distributions, burn rate meters).

```tsx
import { ChartFrame, ChartLegend } from "@/ui/primitives";

<ChartFrame
  title="Monthly Outflow Breakdown"
  subtitle="Calculated deterministically from local transactions"
  legend={
    <ChartLegend
      items={[
        { label: "Expenses", color: "#F43F5E" },
        { label: "Subscriptions", color: "#4A154B" },
      ]}
    />
  }
>
  <YourChartContent />
</ChartFrame>
```

---

### 3.6 Data Display & Status Primitives (`src/ui/primitives/index.tsx`)

#### `BrandLogo`
Renders the approved Baulito Curious Chest (Option B) beside the outlined Bantayog wordmark. The default wordmark adapts to the theme; `variant="ivory"`, `"white"`, or `"black"` selects an explicit treatment. `badgeColor` selects gold, plum, chestnut, or white. The 28px symbol uses the shared `/kaban-symbol-small.svg` as a CSS mask, preserving its eye openings and built-in tilt. Finished lockups and icon assets are in `design/kaban/logo-kit/`.

#### `getAvatarColors` (`src/ui/primitives/avatarColors.ts`)
Returns a profile avatar's background and a black or white foreground selected using WCAG relative luminance. The header, settings, and profile editor share it so saved custom colors retain readable initials. Invalid legacy color values fall back to Kaban Plum without changing saved data.

#### `SmokedCard` (Neobrutalist Card)
Primary surface card wrapper:
- Classes: `rounded-2xl sm:rounded-3xl border-2 border-neutral-900 bg-white p-5.5 shadow-[3px_3px_0px_#18181B]`
- Note: Retains the name `SmokedCard` for backward-compatible imports from earlier iterations.

#### `StatusDot`
Small 10px circular indicator with ink border:
- `tone="green"`: `#10B981` (Paid, active, verified)
- `tone="amber"`: `#F59E0B` (Pending, warning, due soon)
- `tone="rose"`: `#F43F5E` (Overdue, urgent, cancelled)

#### `AnimatedMoney`
Renders an animated currency minor-unit integer formatted as Philippine Pesos (`₱`) using tabular numbers:
```tsx
<AnimatedMoney minor={2450000} /> // Displays: ₱24,500.00 in font-mono tabular-nums
```

#### `DonutChartSVG`
SVG donut visualization with smooth entry animation:
- Props: `percent: number`, `size?: number` (default: 96)
- Renders plum arc `#4A154B` against neutral track `#E4E4E7` with central tabular percentage label.

#### `HatchedProgressBar` / `AnimatedProgressBar`
Progress bar with cream track `#F4F1EA`, dark border, and emerald fill `#10B981`.

---

## 4. Accessibility & Responsive Guidelines

1. **Touch Targets**: Prefer `44px x 44px` mobile targets. Compact icon controls must retain accessible names and visible focus indicators.
2. **Contrast Standards**: Verify foreground/background pairs against WCAG AA: 4.5:1 for normal text and 3:1 for large text and essential control visuals. Pastel surfaces use dark foregrounds; custom colors require contrast checks. These design rules do not constitute a full accessibility certification.
3. **Tabular Numerics**: Any element rendering currency amounts, dates, or calculations MUST apply `.font-mono` and `.tabular-nums` (`font-variant-numeric: tabular-nums`) to prevent horizontal layout jank during animations.
4. **Desktop Centering**: The app shell uses `max-w-6xl` with responsive screen grids. Modal widths are constrained independently; bottom spacing keeps final rows and actions clear of the floating navigation.
