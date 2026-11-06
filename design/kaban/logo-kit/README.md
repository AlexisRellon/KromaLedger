# Kaban / Baulito — Curious Chest

Approved direction: Option B, Curious Chest. Baulito's angled chest, watchful eyes and keyhole now identify Kaban, paired with the existing outlined Bantayog wordmark. Chestnut and ivory preserve Kaban's palette. The original concepts remain in `../baulito-logo-concepts/`.

## Files

- `svg/`: symbol, horizontal, stacked and wordmark-only artwork in chestnut, black, white and ivory. White/ivory symbols have optical compensation for dark backgrounds.
- `masters/`: standard and simplified small-size symbol masters.
- `png/`: transparent raster artwork in the same four treatments.
- `web/`: app-icon SVG, favicon SVG/ICO/PNGs, Apple touch icon, 192/512 icons, maskable icon, reference webmanifest and head snippet.
- `usage-guide.html`: printable single-page guide. `usage-guide.md` is the text version.
- `presentation.html` and `presentation/`: five-slide presentation and six consumer-app mockups. Example domains, accounts and contact details on these mockups are placeholders.
- `kaban-preview.png`: identity overview. `kaban-logo.png`: transparent chestnut horizontal logo.
- `contrast-checks.json`: calculated contrast ratios.

Use `svg/kaban-horizontal-color.svg` as the primary signature on light surfaces; use the ivory version on dark surfaces. Use the dedicated small cut at 16–31 px. It merges the two side-panel openings and reduces the pupils to preserve the eye rings. White/ivory standard symbols have a slightly thinner silhouette and wider eye openings.

The app header, public logo files, favicon and installed-app icons use this identity. The existing generated PWA manifest remains authoritative; `web/site.webmanifest` and the head snippet are reference assets. Existing wordmark artwork is retained.

The favicon uses the same rounded chestnut tile and ivory Baulito as `web/kaban-app-icon.svg`. After exporting web assets, copy that SVG to `web/favicon.svg` and `web/kaban-favicon.svg`, then use `render_png.py` to regenerate the 16/32/48 PNGs and ICO from it. Publish those files to `public/`, including the `favicon-baulito.svg` and `.ico` aliases used by the app.

## Typeface and rights

Bantayog Regular comes from the project's `public/fonts`. The logo contains outlined letters, with no live text, font embedding, or redistributed font binaries. Do not redraw or simplify the rough letter contours. The original typeface remains its designer's work.

The project's local Bantayog notices accompany the existing typeface in `public/fonts`. This update retains the existing letter outlines and does not redistribute font software or grant a separate font licence.

No external trademark clearance was performed. Print CMYK values are mathematical approximations; no Pantone match or physical print proof is claimed. SVG and PNG artwork is supplied; no native AI/EPS or print PDF is included.

## Validation

Masters and lockups contain vector paths and circles, without live type, raster images, filters or masks. Primary contrast pairs exceed 4.5:1. `verify.py` checks exported sizes, icon references and matching app assets. The symbol audit covers standard, reversed and small cuts. Original Bantayog contour complexity is intentional. Logo geometry does not claim to reproduce an authenticated traditional motif.

Rebuild masters in this repository with `python design/kaban/logo-kit/build.py` (requires the earlier outlined Bantayog study). The deliverable SVG/PNG/web files work independently of the build script. `build.py` rebuilds vector masters and presentation configuration; raster, web and presentation exports use the logo-design skill scripts separately.
