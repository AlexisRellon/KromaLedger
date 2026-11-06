"""Build outlined Kaban concept lockups from the project's existing fonts."""
from html import escape
from pathlib import Path
from xml.etree import ElementTree as ET

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent
NS = "{http://www.w3.org/2000/svg}"
FONTS = [
    ("Dangwa", "Dangwa-Regular.otf", None),
    ("Bantayog", "Bantayog-Regular.otf", None),
    ("Cabinet Grotesk", "CabinetGrotesk-Variable.woff2", 700),
    ("Satoshi", "Satoshi-Variable.woff2", 700),
    ("JetBrains Mono", "JetBrainsMono-Regular.woff2", None),
]
SYMBOLS = ["a-keepsake-v2", "b-within-v1", "c-hinged-v2"]


def word_paths(filename, weight):
    with TTFont(ROOT / "public/fonts" / filename) as font:
        glyphs = font.getGlyphSet(location={"wght": weight} if weight else None)
        cmap = font.getBestCmap()
        paths, bounds = SVGPathPen(glyphs), BoundsPen(glyphs)
        advance = 0
        kern = {}
        if "kern" in font:
            for table in font["kern"].kernTables:
                if table.version == 0:
                    kern.update(table.kernTable)
        previous = None
        for char in "Kaban":
            assert ord(char) in cmap, (filename, char)
            name = cmap[ord(char)]
            advance += kern.get((previous, name), 0)
            for pen in (paths, bounds):
                glyphs[name].draw(TransformPen(pen, (1, 0, 0, 1, advance, 0)))
            advance += glyphs[name].width
            previous = name
        x0, y0, x1, y1 = bounds.bounds
        scale = min(136 / (y1 - y0), 620 / (x1 - x0))
        tx = 300 - x0 * scale
        ty = 128 + (y0 + y1) * scale / 2
        return (f'<g transform="translate({tx:.4f} {ty:.4f}) '
                f'scale({scale:.6f} {-scale:.6f})"><path fill="#000000" '
                f'd="{paths.getCommands()}"/></g>')


def build():
    sheet = ['<rect width="1600" height="1310" fill="#f7f7f4"/>',
             '<g fill="#171717" font-family="Arial, sans-serif">',
             '<text x="60" y="65" font-size="38" font-weight="700">Kaban / fonts from your library</text>',
             '<text x="60" y="105" font-size="21" fill="#666666">Same symbols. Five type directions. All logo lettering converted to vector outlines.</text>']
    for col, title in enumerate(("A / Keepsake K", "B / Within", "C / Hinged K")):
        sheet.append(f'<text x="{60 + col * 510}" y="156" font-size="19">{title}</text>')
    for row, (family, filename, weight) in enumerate(FONTS):
        y = 185 + row * 220
        suffix = f" / {weight}" if weight else " / Regular"
        sheet.append(f'<rect x="40" y="{y}" width="1520" height="200" rx="16" fill="#ffffff"/>')
        sheet.append(f'<text x="60" y="{y + 35}" font-size="23" font-weight="700">{escape(family + suffix)}</text>')
        word = word_paths(filename, weight)
        for col, symbol in enumerate(SYMBOLS):
            source = ET.parse(ROOT / "design/kaban/concepts" / f"{symbol}.svg").getroot()
            mark = ''.join(f'<path fill="#000000" fill-rule="{node.get("fill-rule", "nonzero")}" d="{node.attrib["d"]}"/>'
                           for node in source.findall(NS + "path"))
            body = mark + word
            name = family.lower().replace(" ", "-")
            title = escape(f"Kaban — {family} — {symbol}")
            svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 256" role="img" aria-labelledby="title"><title id="title">{title}</title>{body}</svg>'
            parsed = ET.fromstring(svg)
            assert not parsed.findall('.//' + NS + 'text')
            assert len(parsed.findall('.//' + NS + 'path')) == 2
            (OUT / f"{symbol}-{name}.svg").write_text(svg, encoding="utf-8")
            sheet.append(f'<g transform="translate({55 + col * 510} {y + 58}) scale(0.49)">{body}</g>')
    sheet.append('</g>')
    (OUT / "kaban-font-comparison.svg").write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1310">' + ''.join(sheet) + '</svg>', encoding="utf-8")
    print("Built 15 outlined lockups and comparison sheet; glyph and SVG assertions passed.")


if __name__ == "__main__":
    build()
