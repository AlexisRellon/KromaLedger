# State Presentation Port

## Overview
Provides a UI-toolkit-agnostic React context (`PresentationProvider` / `usePresentationComponents`) and shared `WalletOverviewPanel` component so state-level presentation logic renders without coupling to a concrete DOM/UI library.

## Interface
- `PresentationBoxProps`, `PresentationTextProps`, `PresentationButtonProps`, `PresentationIconProps`, `PresentationInputProps`, `PresentationModalProps`, `PresentationComponents`: [PresentationContext.tsx:PresentationComponents] — Abstract primitive component contract (`Box`, `Text`, `Button`, `Icon`, `Input`, `Modal`).
- `PresentationProvider({ components, children })`: [PresentationContext.tsx:PresentationProvider] — Supplies concrete primitive implementations to the React subtree.
- `usePresentationComponents(): PresentationComponents`: [PresentationContext.tsx:usePresentationComponents] — Hook returning bound presentation primitives.
- `WalletOverviewPanel`: [WalletOverviewPanel.tsx:WalletOverviewPanel] — Renders total liquid balance summary and add-wallet trigger using `usePresentationComponents()`.

## Invariants
- `usePresentationComponents` throws an Error if invoked outside a `PresentationProvider` [PresentationContext.tsx:usePresentationComponents].

## Side Effects
- None

## Verification
- Run: `npm test`