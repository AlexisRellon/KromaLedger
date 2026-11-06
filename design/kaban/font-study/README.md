# Kaban / local font comparison

Open `kaban-font-comparison.png` to compare all three existing symbols with five font families from `public/fonts`. Individual SVG lockups are alongside it. Earlier custom-lettered concepts remain in `../concepts`.

Sources: Dangwa-Regular.otf, Bantayog-Regular.otf, CabinetGrotesk-Variable.woff2 at weight 700, Satoshi-Variable.woff2 at weight 700, and JetBrainsMono-Regular.woff2. The input string is `Kaban`; Dangwa and Bantayog display their own capital-like lowercase designs. Fonts were not altered. Logo lettering is exported as paths, without embedding or copying font binaries.

Recommendation: Bantayog with Keepsake K for its softer, irregular lettering against the structured chest; Cabinet Grotesk with Keepsake K for a more polished digital direction. Dangwa has the strongest ornamental character and draws attention away from the symbol. Satoshi is quieter; JetBrains Mono emphasizes software over the family-keepsake story.

Rebuild with `python design/kaban/font-study/build.py` from the repository root. Requires the already installed fontTools package. The builder checks glyph coverage, parses every SVG, and asserts that lockups contain paths and no live text. The comparison was rendered in Chrome and visually inspected. Spot audits of Dangwa, Bantayog and Cabinet Grotesk identify source-font contour complexity/angles and unused horizontal space; the type outlines were preserved rather than simplified. This is concept artwork, not a final production kit.

Local licence notes: Dangwa-LICENSE.txt states commercial and personal use are free. CabinetGrotesk-LICENSE.txt explicitly permits logo and wordmark artwork. Bantayog's two local notices refer to an external EULA and a single-user licence; that full EULA has not been verified. Retain the original licence files and confirm applicable terms before final delivery. Trademark clearance is outside this comparison.
