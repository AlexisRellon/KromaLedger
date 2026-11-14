# UI Primitives

## Overview
Neobrutalist design-system building blocks, SVG weave definitions, Baulito mascot renderer, form controls, chart frames, skeletons, and accessible modal shells used across Kaban screens and components.

## Interface
- `VoltButton`, `BrandLogo`, `SmokedCard`, `HatchedProgressBar`, `DonutChartSVG`, `AnimatedProgressBar`, `AnimatedMoney`, `StatusDot` (plus re-exports of primitives below): [index.tsx:SmokedCard] — Core visual surfaces, animated counters, and progress indicators.
- `ButtonVariant`, `ButtonSize`, `ButtonProps`, `Button`, `InputProps`, `SelectProps`, `TextareaProps`, `Input`, `Select`, `Textarea`, `ToggleProps`, `Toggle`: [controls.tsx:Button] — Styled form and action controls.
- `FieldRenderProps`, `FieldProps`, `Field`, `FormField`, `FormFieldProps`, `FormActions`: [forms.tsx:FormField] — Accessible label/hint/error field wrappers using `useId()`.
- `ModalShellProps`, `ModalShell`: [Modal.tsx:ModalShell] — Accessible dialog shell with header, footer, backdrop click close, and `busy` guard.
- `ChartLegendItem`, `ChartLegend`, `ChartFrameProps`, `ChartFrame`: [ChartFrame.tsx:ChartFrame] — Consistent chart container and legend layout.
- `SkeletonProps`, `Skeleton`, `SkeletonText`, `SkeletonCircle`, `SkeletonBadge`, `SkeletonButton`, `SkeletonCard`: [Skeleton.tsx:Skeleton] — Shimmering placeholder blocks.
- `BaulitoPose`, `MascotVariant`, `BAULITO_ASSET_MAP`, `KabanMascotProps`, `KabanMascot`: [KabanMascot.tsx:KabanMascot] — Renders Baulito pose SVG assets from `/mascot/*.svg`.
- `TactileEmptyStateProps`, `TactileEmptyState` [TactileEmptyState.tsx:TactileEmptyState], `EmptyStateWatermark` [EmptyStateWatermark.tsx:EmptyStateWatermark], `FilipinoWeaveDefs` [FilipinoWeaveDefs.tsx:FilipinoWeaveDefs], `getAvatarColors` [avatarColors.ts:getAvatarColors].

## Invariants
- `ModalShell` blocks closing via backdrop click or `Escape` key while `busy` is true [Modal.tsx:ModalShell].
- `BAULITO_ASSET_MAP` maps every `BaulitoPose` (`spent-stop`, `saving-up`, `calculating`, `welcome`, `celebrate-peso`, `alert-peek`, `vault-locked`, `idle-sleep`, `standalone`) to a static `/mascot/` SVG asset path [KabanMascot.tsx:BAULITO_ASSET_MAP].
- `FilipinoWeaveDefs` registers the shared `#pattern-tnalak-circuit` SVG `<pattern>` ID used by cards and modal headers [FilipinoWeaveDefs.tsx:FilipinoWeaveDefs].

## Side Effects
- `ModalShell` portals modal markup into `document.body` via `createPortal` and registers a `window` `keydown` listener for `Escape` while open [Modal.tsx:ModalShell].

## Verification
- Run: `npm test`