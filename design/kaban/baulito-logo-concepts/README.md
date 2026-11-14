# baulito-logo-concepts

## Overview
Exploration concepts pairing three Baulito chest mascot symbols (`a-little-keeper-v2.svg`, `b-curious-chest-v2.svg`, `c-watchful-seal-v2.svg`) with Kaban's existing outlined wordmark. Design goals, scoring, and black-first constraints are documented in [brief.md](./brief.md), with interactive scale/background inspection in [preview.html](./preview.html).

## Interface
- `python design/kaban/baulito-logo-concepts/build_lockups.py` (`[build_lockups.py]`) — CLI script that executes at module load to pair each `*-v2.svg` symbol in this directory with the outlined wordmark from `../../../public/kaban-wordmark-black.svg` (`HERE.parents[2] / "public/kaban-wordmark-black.svg"`).
- `[build_lockups.py:HERE]` — resolved directory `Path` for `design/kaban/baulito-logo-concepts`.
- `[build_lockups.py:NS]` — SVG XML namespace prefix `"{http://www.w3.org/2000/svg}"`.
- `[build_lockups.py:word]` — parsed root `<svg>` element of `public/kaban-wordmark-black.svg` with `viewBox` unpacked into `x`, `y`, `width`, `height` and scaled via `[build_lockups.py:scale]` (`160 / height`).
- `[build_lockups.py:symbols]` — sorted list of matching `*-v2.svg` symbol paths.

## Invariants
- `[build_lockups.py:symbols]`: Exactly three `*-v2.svg` source files must exist (`assert len(symbols) == 3`).
- `[build_lockups.py:word]`: `public/kaban-wordmark-black.svg` must exist at `HERE.parents[2] / "public/kaban-wordmark-black.svg"` and expose a 4-value `viewBox` attribute.
- `[build_lockups.py:root]`: Every generated lockup SVG uses `viewBox="0 0 {round(320 + width * scale)} 256"`, `role="img"`, `aria-labelledby="title"`, and `<title id="title">Kaban / Baulito concept lockup</title>`, strips `<title>` elements from imported symbol and wordmark nodes, and contains zero `<text>` or `<image>` elements (`assert not root.findall(".//" + NS + "text")`, `assert not root.findall(".//" + NS + "image")`).

## Side Effects
- Reads `public/kaban-wordmark-black.svg` and each `*-v2.svg` symbol file in `design/kaban/baulito-logo-concepts/` (`[build_lockups.py]`).
- Writes/overwrites `<source.stem>-lockup.svg` (`a-little-keeper-v2-lockup.svg`, `b-curious-chest-v2-lockup.svg`, `c-watchful-seal-v2-lockup.svg`) in UTF-8 XML (`[build_lockups.py]`).
- Prints `"Built three concept lockups with outlined Kaban wordmark."` to stdout (`[build_lockups.py]`).

## Verification
- Run: `npm test` (repository root test suite; no Python test runner is configured for `build_lockups.py`)