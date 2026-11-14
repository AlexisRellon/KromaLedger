# Kaban / Baulito — Curious Chest

## Overview
Approved direction: Option B, Curious Chest. Baulito's angled chest, watchful eyes and keyhole now identify Kaban, paired with the existing outlined Bantayog wordmark. Chestnut (`#71452E`) and ivory (`#F5EEDD`) preserve Kaban's palette. The original concepts remain in `../baulito-logo-concepts/`.

Asset directories and files in this kit:
- `svg/`: symbol, horizontal, stacked and wordmark-only artwork in chestnut, black, white and ivory. White/ivory symbols have optical compensation for dark backgrounds.
- `masters/`: standard (`kaban-symbol-master.svg`) and simplified small-size (`kaban-symbol-small.svg`) symbol masters.
- `png/`: transparent raster artwork in the same four treatments plus `kaban-app-icon-1024.png`.
- `web/`: app-icon SVG, favicon SVG/ICO/PNGs, Apple touch icon, 192/512 icons, maskable icon, reference `site.webmanifest` and `head-snippet.html`.
- `usage-guide.html`: printable single-page guide. `usage-guide.md` is the text version.
- `presentation.html` and `presentation/`: five-slide presentation and six consumer-app mockups. Example domains, accounts and contact details on these mockups are placeholders.
- `kaban-preview.png` / `kaban-preview.svg`: identity overview. `kaban-logo.png`: transparent chestnut horizontal logo.
- `contrast-checks.json` and `presentation-spec.json`: calculated contrast ratios and presentation metadata.

Use `svg/kaban-horizontal-color.svg` as the primary signature on light surfaces; use the ivory version on dark surfaces. Use the dedicated small cut at 16–31 px. It merges the two side-panel openings and reduces the pupils to preserve the eye rings. White/ivory standard symbols have a slightly thinner silhouette and wider eye openings.

The app header, public logo files, favicon and installed-app icons use this identity. The existing generated PWA manifest remains authoritative; `web/site.webmanifest` and `web/head-snippet.html` are reference assets. Existing wordmark artwork is retained.

The favicon uses the same rounded chestnut tile and ivory Baulito as `web/kaban-app-icon.svg`. After exporting web assets, copy that SVG to `web/favicon.svg` and `web/kaban-favicon.svg`, then use `render_png.py` to regenerate the 16/32/48 PNGs and ICO from it. Publish those files to `public/`, including the `favicon-baulito.svg` and `.ico` aliases used by the app.

## Interface
- `python design/kaban/logo-kit/build.py` (`[build.py:build]`) — CLI entrypoint (`if __name__ == "__main__": build()`) rebuilding vector masters, delivery SVGs, `contrast-checks.json`, `presentation-spec.json`, `kaban-preview.svg`, and `usage-guide.html`.
- `[build.py:write(name, viewbox, children, folder="svg")]` — Wraps SVG nodes in `<svg viewBox=... role="img" aria-labelledby="title">` with `<title id="title">`, validates SVG element constraints, and writes `{OUT}/{folder}/{name}.svg`.
- `[build.py:symbol(paint, reverse=False, small=False)]` — Constructs the `-15`-degree tilted Baulito chest `<g>` with standard (`NORMAL`, `SIDE`, 28/18 eye/pupil radii), reversed (`REVERSE`, 29/17 radii), or small-cut (`SMALL_SIDE`, 16 pupil radius) geometry.
- `[build.py:word(paint)]` — Deep-copies `[build.py:WORD]` (from `../font-study/a-keepsake-v2-bantayog.svg`) and recolors descendant `fill` attributes to `paint`.
- `[build.py:group(transform, node)]` — Wraps `node` in a `<g transform=...>`.
- `[build.py:contrast(first, second)]` — Computes WCAG relative luminance contrast ratio between two hex colors.
- `[build.py:OUT]`, `[build.py:NS]`, `[build.py:BROWN]`, `[build.py:IVORY]`, `[build.py:INK]`, `[build.py:NORMAL]`, `[build.py:REVERSE]`, `[build.py:SIDE]`, `[build.py:SMALL_SIDE]`, `[build.py:SEAMS]`, `[build.py:KEY]`, `[build.py:WORD]` — Kit output path, SVG namespace, palette hex constants, path geometry strings, and source wordmark `<g>`.
- `python design/kaban/logo-kit/verify.py` (`[verify.py]`) — Verification script executing module-level assertions across SVGs, PNGs, ICO header, `web/site.webmanifest`, presentation slides, guide/preview files, and `../../../public/` parity.
- `[verify.py:png_size(path)]` — Validates the 8-byte PNG signature and unpacks `(width, height)` from the IHDR chunk (`struct.unpack(">II", data[16:24])`).
- `[verify.py:ROOT]`, `[verify.py:NS]`, `[verify.py:vectors]` — Kit root path, SVG namespace, and list of all `svg/*.svg` and `masters/*.svg` files.

## Invariants
- `[build.py:WORD]`: `../font-study/a-keepsake-v2-bantayog.svg` must exist and contain a `<g>` element (`assert WORD is not None`).
- `[build.py:write]`, `[verify.py:vectors]`: Masters and delivery lockups must contain `<path>` elements (`assert root.findall(".//" + NS + "path")`) and zero `<text>`, `<image>`, `<filter>`, or `<mask>` elements.
- `[build.py:build]`: Primary contrast pairs (`chestnut-on-ivory`, `ivory-on-ink`, `white-on-chestnut`) must all be `>= 4.5` (`assert all(value >= 4.5 for value in ratios.values())`).
- `[verify.py]`: PNG dimensions must match fixed specifications (`symbol`: `1024x1024`, `horizontal`: `1600x462`, `stacked`: `1024x768`, `wordmark`: `1600x483`, `kaban-app-icon-1024.png`: `1024x1024`, `web/` PNGs: `16`, `32`, `48`, `180`, `192`, `512`, `512`); `web/favicon.ico` must have header `(0, 1, 3)`; `web/site.webmanifest` must declare `"name": "Kaban"` with existing, dimension-matched icons; 5 `presentation/slide-*.png` files and guide/preview files must exist; `svg/*.svg`, `masters/kaban-symbol-small.svg`, and `web/` icon/favicon files must match `public/` byte-for-byte (including `public/pwa-icon.svg`, `public/favicon-baulito.svg`, and `public/favicon-baulito.ico`); `web/favicon.svg` must contain a rounded `#71452E` `<rect>`; and `masters/kaban-symbol-master.svg` must differ from `masters/kaban-symbol-small.svg`.
- **Typeface and rights**: Bantayog Regular comes from `public/fonts`. The logo contains outlined letters, with no live text, font embedding, or redistributed font binaries. Do not redraw or simplify the rough letter contours. The project's local Bantayog notices accompany the existing typeface in `public/fonts`. This update retains the existing letter outlines and does not redistribute font software or grant a separate font licence.
- **Scope disclaimers**: No external trademark clearance was performed. Print CMYK values are mathematical approximations; no Pantone match or physical print proof is claimed. SVG and PNG artwork is supplied; no native AI/EPS or print PDF is included. Original Bantayog contour complexity is intentional. Logo geometry does not claim to reproduce an authenticated traditional motif.

## Side Effects
- `[build.py:build]`: Reads `../font-study/a-keepsake-v2-bantayog.svg`; creates `svg/` and `masters/` directories if absent; writes 18 SVGs in `svg/`, 2 SVGs in `masters/`, `contrast-checks.json`, `presentation-spec.json`, `kaban-preview.svg`, and `usage-guide.html`. (Raster PNG, web icon, and presentation exports use external logo-design skill scripts separately; the deliverable SVG/PNG/web files work independently of `build.py`.)
- `[verify.py]`: Reads files across `svg/`, `masters/`, `png/`, `web/`, `presentation/`, `design/kaban/logo-kit/`, and `public/`; raises `AssertionError` on mismatch or prints `"PASS: ..."` summary to stdout without modifying files.

## Verification
- Run kit verification: `python design/kaban/logo-kit/verify.py`
- Rebuild vector masters and guides: `python design/kaban/logo-kit/build.py` (requires `../font-study/a-keepsake-v2-bantayog.svg`)
- Run: `npm test` (repository root test suite)