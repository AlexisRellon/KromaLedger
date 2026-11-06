"""Build the approved Baulito Curious Chest masters and delivery artwork."""
import json
from copy import deepcopy
from pathlib import Path
from xml.etree import ElementTree as ET

OUT = Path(__file__).resolve().parent
NS = "{http://www.w3.org/2000/svg}"
ET.register_namespace("", "http://www.w3.org/2000/svg")
BROWN = "#71452E"
IVORY = "#F5EEDD"
INK = "#211B17"
NORMAL = "M24 112Q24 56 80 56H176Q224 56 224 112V192Q224 216 200 216H48Q24 216 24 192Z"
REVERSE = "M25 112Q25 57 80 57H176Q223 57 223 112V192Q223 215 200 215H48Q25 215 25 192Z"
SIDE = "M40 112H64V80Q40 88 40 112Z M40 136H64V192H40Z"
SMALL_SIDE = "M40 112Q40 88 64 80V192H40Z"
SEAMS = "M88 144H128V160H88Z M176 144H208V160H176Z"
KEY = "M152 160A14 14 0 0 0 144 185L139.98 200H164.02L160 185A14 14 0 0 0 152 160Z"
WORD = ET.parse(OUT.parent / "font-study/a-keepsake-v2-bantayog.svg").getroot().find(NS + "g")
assert WORD is not None


def write(name, viewbox, children, folder="svg"):
    root = ET.Element(NS + "svg", {"viewBox": viewbox, "role": "img", "aria-labelledby": "title"})
    ET.SubElement(root, NS + "title", {"id": "title"}).text = "Kaban — Baulito Curious Chest " + name
    for child in children:
        root.append(child)
    assert not root.findall(".//" + NS + "text")
    assert not root.findall(".//" + NS + "image")
    assert root.findall(".//" + NS + "path")
    path = OUT / folder / (name + ".svg")
    path.parent.mkdir(parents=True, exist_ok=True)
    ET.ElementTree(root).write(path, encoding="unicode")


def symbol(paint, reverse=False, small=False):
    mark = ET.Element(NS + "g", {"transform": "translate(0 -10) rotate(-15 128 128)", "fill": paint})
    radius = 29 if reverse else 28
    eyes = " ".join(f"M{cx-radius} 104A{radius} {radius} 0 1 0 {cx+radius} 104A{radius} {radius} 0 1 0 {cx-radius} 104Z" for cx in (112, 184))
    ET.SubElement(mark, NS + "path", {"fill-rule": "evenodd", "d": " ".join((REVERSE if reverse else NORMAL, SMALL_SIDE if small else SIDE, eyes, SEAMS, KEY))})
    for cx in (112, 184):
        ET.SubElement(mark, NS + "circle", {"cx": str(cx + (4 if small else 6)), "cy": "100", "r": str(16 if small else 17 if reverse else 18)})
    return mark


def word(paint):
    result = deepcopy(WORD)
    for node in result.iter():
        if "fill" in node.attrib:
            node.set("fill", paint)
    return result


def group(transform, node):
    result = ET.Element(NS + "g", {"transform": transform})
    result.append(node)
    return result


def contrast(first, second):
    def luminance(value):
        channels = [int(value[i:i + 2], 16) / 255 for i in (1, 3, 5)]
        linear = [v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in channels]
        return sum(v * w for v, w in zip(linear, (0.2126, 0.7152, 0.0722)))
    a, b = sorted((luminance(first), luminance(second)))
    return (b + 0.05) / (a + 0.05)


def build():
    for label, paint in (("color", BROWN), ("black", "#000000"), ("white", "#FFFFFF"), ("ivory", IVORY)):
        reverse = label in ("white", "ivory")
        mark = symbol(paint, reverse)
        write("kaban-symbol-" + label, "0 0 256 256", [deepcopy(mark)])
        write("kaban-horizontal-" + label, "0 0 888 256", [deepcopy(mark), word(paint)])
        write("kaban-stacked-" + label, "0 0 640 480", [group("translate(192 0)", deepcopy(mark)), group("translate(-261 260)", word(paint))])
        write("kaban-wordmark-" + label, "276 36 610 184", [word(paint)])
    write("kaban-symbol-small", "0 0 256 256", [symbol(BROWN, small=True)], "masters")
    write("kaban-symbol-master", "0 0 256 256", [symbol(BROWN)], "masters")
    for label, paint in (("small-black", "#000000"), ("small-white", "#FFFFFF")):
        write("kaban-symbol-" + label, "0 0 256 256", [symbol(paint, small=True)])
    ratios = {"chestnut-on-ivory": contrast(BROWN, IVORY), "ivory-on-ink": contrast(IVORY, INK), "white-on-chestnut": contrast("#FFFFFF", BROWN)}
    assert all(value >= 4.5 for value in ratios.values()), ratios
    (OUT / "contrast-checks.json").write_text(json.dumps(ratios, indent=2), encoding="utf-8")
    spec = {
        "brand": "Kaban", "tagline": "Kept for tomorrow.",
        "brief": "Baulito, Kaban's watchful chest companion, becomes the logo. The approved angled chest keeps its expressive eyes and keyhole, paired with the existing Bantayog wordmark.",
        "adjectives": ["warm", "watchful", "dependable", "personal"],
        "industry": "consumer-app", "mockups": ["app-icon", "website", "social", "favicon-tab", "sticker", "business-card"],
        "nav": ["Your vault", "How it works", "Privacy"],
        "brand_color": BROWN, "tile_color": BROWN, "greyscale": False, "final": True,
        "concepts": [{"name": "Baulito / Curious Chest", "symbol": "svg/kaban-symbol-color.svg", "lockup": "svg/kaban-horizontal-color.svg", "stacked": "svg/kaban-stacked-color.svg",
                      "symbol_on_tile": "svg/kaban-symbol-ivory.svg", "symbol_on_dark": "svg/kaban-symbol-ivory.svg", "lockup_on_dark": "svg/kaban-horizontal-ivory.svg", "stacked_on_tile": "svg/kaban-stacked-ivory.svg",
                      "idea": "A little chest with a curious upward gaze, keeping watch over everyday money.",
                      "rationale": ["The 15-degree tilt preserves the selected concept's playful stance.", "Generous eye openings and a central keyhole connect the logo to Baulito.", "The existing outlined Bantayog wordmark preserves Kaban's identity."]}],
        "recommendation": "Use the chestnut horizontal lockup on ivory as the primary signature. Use the dedicated small cut at 16–32 px and ivory artwork on dark surfaces."
    }
    (OUT / "presentation-spec.json").write_text(json.dumps(spec, indent=2), encoding="utf-8")
    def svg_fragment(nodes):
        return ''.join(ET.tostring(node, encoding="unicode") for node in nodes)
    hero = svg_fragment([symbol(BROWN), word(BROWN)])
    reverse_lockup = svg_fragment([symbol(IVORY, reverse=True), word(IVORY)])
    tile_mark = svg_fragment([symbol(IVORY, small=True)])
    preview = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1100">
<rect width="1600" height="1100" fill="{IVORY}"/>
<g font-family="Arial, sans-serif" fill="{INK}">
<text x="60" y="72" font-size="24" letter-spacing="3">KABAN / BAULITO</text>
<text x="60" y="116" font-size="21">Meet your little keeper. Curious, watchful, always by your side.</text>
<g transform="translate(90 155) scale(1.58)">{hero}</g>
<path d="M60 590H1540" stroke="{BROWN}" stroke-opacity="0.25"/>
<rect x="60" y="630" width="480" height="350" rx="20" fill="{INK}"/>
<text x="90" y="678" font-size="19" fill="{IVORY}">REVERSED / IVORY ON INK</text>
<g transform="translate(87 740) scale(0.48)">{reverse_lockup}</g>
<text x="90" y="947" font-size="18" fill="{IVORY}">Bantayog Regular · outlined artwork</text>
<rect x="560" y="630" width="480" height="350" rx="20" fill="#FFFFFF"/>
<text x="590" y="678" font-size="19">THE PALETTE</text>
<rect x="590" y="716" width="125" height="120" rx="8" fill="{BROWN}"/>
<rect x="730" y="716" width="125" height="120" rx="8" fill="{IVORY}"/>
<rect x="870" y="716" width="125" height="120" rx="8" fill="{INK}"/>
<g font-size="17"><text x="590" y="868">Chestnut</text><text x="590" y="895">{BROWN}</text><text x="730" y="868">Ivory</text><text x="730" y="895">{IVORY}</text><text x="870" y="868">Ink</text><text x="870" y="895">{INK}</text></g>
<text x="590" y="947" font-size="18">Chestnut / ivory contrast: 7.00:1</text>
<rect x="1060" y="630" width="480" height="350" rx="20" fill="#FFFFFF"/>
<text x="1090" y="678" font-size="19">APP ICON / SIMPLIFIED CUT</text>
<rect x="1215" y="710" width="170" height="170" rx="38" fill="{BROWN}"/>
<g transform="translate(1244 739) scale(0.4375)">{tile_mark}</g>
<text x="1090" y="947" font-size="18">SVG · PNG · favicon · PWA icons</text>
<text x="60" y="1045" font-size="19">Primary signature: chestnut on ivory. Full-colour, black, white and ivory variants included.</text>
</g></svg>'''
    (OUT / "kaban-preview.svg").write_text(preview, encoding="utf-8")
    guide = f'''<!doctype html><html lang="en"><meta charset="utf-8"><title>Kaban — Baulito usage guide</title>
<style>@page{{size:A4;margin:14mm}}*{{box-sizing:border-box}}body{{margin:0;background:{IVORY};color:{INK};font:15px/1.45 Arial,sans-serif}}main{{max-width:900px;margin:auto;padding:40px}}h1{{font-size:30px;margin:0 0 6px}}h2{{font-size:17px;margin:20px 0 6px}}p{{margin:6px 0}}header svg{{width:360px;height:auto}}.grid{{display:grid;grid-template-columns:1fr 1fr;gap:28px}}table{{width:100%;border-collapse:collapse;font-size:13px}}td,th{{padding:8px 4px;border-bottom:1px solid #cbbda9;text-align:left}}.swatch{{display:inline-block;width:14px;height:14px;vertical-align:middle;margin-right:6px;border:1px solid #aaa}}footer{{margin-top:20px;font-size:12px;border-top:1px solid #cbbda9;padding-top:12px}}a{{color:{BROWN}}}@media print{{body{{background:white;font-size:10pt}}main{{padding:0;max-width:none}}h2{{margin-top:14px}}}}</style>
<main><header><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 888 256">{hero}</svg><h1>Baulito / usage guide</h1><p>The approved Curious Chest: a little keeper with a watchful gaze.</p></header>
<h2>Colour</h2><table><tr><th>Role</th><th>HEX / RGB</th><th>Approx. CMYK</th></tr>
<tr><td><span class="swatch" style="background:{BROWN}"></span>Chestnut / primary</td><td>{BROWN} / 113, 69, 46</td><td>0, 39, 59, 56</td></tr>
<tr><td><span class="swatch" style="background:{IVORY}"></span>Ivory / light and reverse</td><td>{IVORY} / 245, 238, 221</td><td>0, 3, 10, 4</td></tr>
<tr><td><span class="swatch" style="background:{INK}"></span>Ink / dark surface</td><td>{INK} / 33, 27, 23</td><td>0, 18, 30, 87</td></tr></table>
<p>Contrast: chestnut on ivory 7.00:1; ivory on ink 14.72:1. CMYK is indicative; proof before printing. Pantone is unassigned.</p>
<div class="grid"><section><h2>Space and size</h2><p>Leave at least 32 units on the 256-unit symbol canvas outside every visible edge. Canvas padding is additional.</p><p>Standard symbol: 32 px / 8 mm minimum. Small cut: 16–31 px. Horizontal: 160 px / 35 mm wide. Stacked: 140 px / 30 mm. Wordmark: 120 px / 30 mm.</p>
<h2>Backgrounds</h2><p>Chestnut or black on light surfaces. Ivory or white on dark surfaces; use the supplied reverse. On busy imagery, add a solid ivory or chestnut field. Do not place chestnut directly on ink.</p>
<h2>Typography</h2><p>Bantayog Regular is the main brand/display face. Preserve the supplied outlines and rough contours. Use a readable text face for paragraphs. “Kept for tomorrow.” is optional supporting copy.</p></section>
<section><h2>Pick the right file</h2><p>SVG: web, UI and scalable artwork.<br>Transparent PNG: slides and documents.<br>favicon.svg / favicon.ico: browser tabs.<br>apple-touch-icon.png: Apple home screen.<br>icon-192 / icon-512: PWA use.<br>maskable-512: platform-cropped icons.</p><p>Use the dedicated app tiles for home-screen icons. Merge metadata into the app's existing PWA configuration.</p>
<h2>Avoid</h2><p>Stretching, changing the built-in tilt, shadows, gradients, outline effects, extra woodgrain or bolts, replacement lettering, altered lockup spacing, cropped lids and full wordmarks used as favicons.</p></section></div>
<footer>Bantayog by Jad Maza; existing project outlines retained. This kit contains artwork, not font binaries. See the project's local Bantayog licence notices. No trademark clearance or physical print proof is included.</footer></main></html>'''
    (OUT / "usage-guide.html").write_text(guide, encoding="utf-8")
    print("Built Baulito vector artwork. All three contrast pairs exceed 4.5:1.")


if __name__ == "__main__":
    build()
