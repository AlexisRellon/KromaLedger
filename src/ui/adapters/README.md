# UI Presentation Adapters

## Overview
Implements the web DOM concrete adapter (`WebPresentationProvider`) fulfilling `src/state/presentation`'s `PresentationComponents` contract using Kaban primitives and React portals.

## Interface
- `WebPresentationProvider({ children }: { children: ReactNode })`: [WebPresentationProvider.tsx:WebPresentationProvider] — Provides concrete `Box`, `Text`, `Button`, `Icon`, `Input`, and `Modal` implementations to `PresentationProvider`.

## Invariants
- `WebPresentationProvider` supplies all six `PresentationComponents` slots, mapping `Modal` to a full-screen backdrop portal when `open` is true and returning `null` otherwise [WebPresentationProvider.tsx:WebPresentationProvider].

## Side Effects
- Mounts `Modal` overlays into `document.body` via `createPortal` [WebPresentationProvider.tsx:WebPresentationProvider].

## Verification
- Run: `npm test`