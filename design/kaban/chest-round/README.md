# chest-round

## Overview
Chest-reference logo exploration round (`seed-keeper`, `carved-seal`, `folded-guardian`) documented in [brief.md](./brief.md), with Chrome verification sheets ([checks-v1.html](./checks-v1.html), [checks-v2.html](./checks-v2.html)) and a script that pairs the refined symbols with Kaban's existing Bantayog wordmark outlines.

## Interface
- `python design/kaban/chest-round/build.py` (`[build.py]`) — CLI script that executes at module load to combine `seed-keeper-v2.svg`, `carved-seal-v1.svg`, and `folded-guardian-v2.svg` with the outlined Bantayog `<g>` wordmark group from `../font-study/a-keepsake-v2-bantayog.svg`.
- `[build.py:OUT]` — resolved directory `Path` for `design/kaban/chest-round`.
- `[build.py:NS]` — SVG XML namespace prefix `"{http://www.w3.org/2000/svg}"`.
- `[build.py:WORD]` — `<g>` element extracted from `../font-study/a-keepsake-v2-bantayog.svg`.

## Invariants
- `[build.py:WORD]`: `../font-study/a-keepsake-v2-bantayog.svg` must exist and contain a direct `<g>` child (`assert WORD is not None`).
- `[build.py:source]`: Processes only `(("seed-keeper", "v2"), ("carved-seal", "v1"), ("folded-guardian", "v2"))`, sets `viewBox="0 0 888 256"`, and asserts each output SVG contains zero `<text>` elements (`assert not source.findall(".//" + NS + "text")`) and exactly 2 `<path>` elements (`assert len(source.findall(".//" + NS + "path")) == 2`).

## Side Effects
- Reads `../font-study/a-keepsake-v2-bantayog.svg` and `{name}-{version}.svg` in `design/kaban/chest-round/` (`[build.py]`).
- Writes/overwrites `{name}-bantayog-{version}.svg` (`seed-keeper-bantayog-v2.svg`, `carved-seal-bantayog-v1.svg`, `folded-guardian-bantayog-v2.svg`) in `design/kaban/chest-round/` (`[build.py]`).
- Prints `"Built three Bantayog lockups; path-only SVG checks passed."` to stdout (`[build.py]`).

## Verification
- Run: `npm test` (repository root test suite; no Python test runner is configured for `build.py`)