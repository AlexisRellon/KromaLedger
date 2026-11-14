# Kaban / local font comparison

## Overview
Open `kaban-font-comparison.png` to compare all three existing symbols with five font families from `public/fonts`. Individual SVG lockups are alongside it. Earlier custom-lettered concepts remain in `../concepts`.

Sources: `Dangwa-Regular.otf`, `Bantayog-Regular.otf`, `CabinetGrotesk-Variable.woff2` at weight 700, `Satoshi-Variable.woff2` at weight 700, and `JetBrainsMono-Regular.woff2`. The input string is `Kaban`; Dangwa and Bantayog display their own capital-like lowercase designs. Fonts were not altered. Logo lettering is exported as paths, without embedding or copying font binaries.

Recommendation: Bantayog with Keepsake K for its softer, irregular lettering against the structured chest; Cabinet Grotesk with Keepsake K for a more polished digital direction. Dangwa has the strongest ornamental character and draws attention away from the symbol. Satoshi is quieter; JetBrains Mono emphasizes software over the family-keepsake story.

## Interface
- `python design/kaban/font-study/build.py` (`[build.py:build]`) — CLI entrypoint (`if __name__ == "__main__": build()`) generating 15 individual outlined lockup SVGs (`{symbol}-{family}.svg`) and the `kaban-font-comparison.svg` comparison sheet.
- `[build.py:word_paths(filename, weight)]` — Loads `ROOT / "public/fonts" / filename` via `TTFont`, applies optional variable `wght` axis and version-0 `kern` offsets for `"Kaban"`, scales to fit `(136, 620)`, and returns a transformed `<g><path fill="#000000" .../></g>` SVG string.
- `[build.py:build()]` — Combines each symbol in `SYMBOLS` from `design/kaban/concepts/{symbol}.svg` with `word_paths(filename, weight)` for each entry in `FONTS`, validates the resulting SVGs, and writes the 15 lockups plus `kaban-font-comparison.svg`.
- `[build.py:ROOT]`, `[build.py:OUT]`, `[build.py:NS]` — Repository root path (`parents[3]`), study output directory path, and `"{http://www.w3.org/2000/svg}"` namespace prefix.
- `[build.py:FONTS]` — 5 `(family, filename, weight)` tuples (`Dangwa`, `Bantayog`, `Cabinet Grotesk` @ `700`, `Satoshi` @ `700`, `JetBrains Mono`).
- `[build.py:SYMBOLS]` — `["a-keepsake-v2", "b-within-v1", "c-hinged-v2"]`.

## Invariants
- `[build.py:word_paths]`: Every character of `"Kaban"` must be present in the font's best cmap (`assert ord(char) in cmap, (filename, char)`).
- `[build.py:build]`: Every generated lockup SVG (`viewBox="0 0 960 256"`, `role="img"`, `aria-labelledby="title"`) is parsed via `ET.fromstring` and asserted to contain zero `<text>` elements (`assert not parsed.findall('.//' + NS + 'text')`) and exactly 2 `<path>` elements (`assert len(parsed.findall('.//' + NS + 'path')) == 2`).
- Font binaries in `public/fonts` are never modified, embedded, or copied; type outlines are preserved rather than simplified (spot audits of Dangwa, Bantayog, and Cabinet Grotesk identify source-font contour complexity/angles and unused horizontal space). This is concept artwork, not a final production kit.
- Local licence notes: `Dangwa-LICENSE.txt` states commercial and personal use are free. `CabinetGrotesk-LICENSE.txt` explicitly permits logo and wordmark artwork. Bantayog's two local notices refer to an external EULA and a single-user licence; that full EULA has not been verified. Retain the original licence files and confirm applicable terms before final delivery. Trademark clearance is outside this comparison.

## Side Effects
- Reads font files from `public/fonts/` (`Dangwa-Regular.otf`, `Bantayog-Regular.otf`, `CabinetGrotesk-Variable.woff2`, `Satoshi-Variable.woff2`, `JetBrainsMono-Regular.woff2`) and symbol SVGs from `../concepts/` (`a-keepsake-v2.svg`, `b-within-v1.svg`, `c-hinged-v2.svg`) (`[build.py:word_paths]`, `[build.py:build]`).
- Writes 15 individual SVG lockups (`{symbol}-{family}.svg`) and `kaban-font-comparison.svg` in `design/kaban/font-study/` (`[build.py:build]`).
- Prints `"Built 15 outlined lockups and comparison sheet; glyph and SVG assertions passed."` to stdout (`[build.py:build]`).

## Verification
- Rebuild and run glyph/SVG assertions: `python design/kaban/font-study/build.py` (from repository root; requires `fontTools`; comparison was also rendered in Chrome and visually inspected).
- Run: `npm test` (repository root test suite)