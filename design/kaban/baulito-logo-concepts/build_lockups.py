"""Pair the three concept symbols with Kaban's existing outlined wordmark."""
from copy import deepcopy
from pathlib import Path
from xml.etree import ElementTree as ET

HERE = Path(__file__).resolve().parent
NS = "{http://www.w3.org/2000/svg}"
ET.register_namespace("", NS[1:-1])
word = ET.parse(HERE.parents[2] / "public/kaban-wordmark-black.svg").getroot()
x, y, width, height = map(float, word.attrib["viewBox"].split())
scale = 160 / height
symbols = sorted(HERE.glob("*-v2.svg"))
assert len(symbols) == 3
for source in symbols:
    root = ET.Element(NS + "svg", {"viewBox": f"0 0 {round(320 + width * scale)} 256", "role": "img", "aria-labelledby": "title"})
    ET.SubElement(root, NS + "title", {"id": "title"}).text = "Kaban / Baulito concept lockup"
    symbol = ET.SubElement(root, NS + "g")
    for child in ET.parse(source).getroot():
        if child.tag != NS + "title":
            symbol.append(deepcopy(child))
    letters = ET.SubElement(root, NS + "g", {"transform": f"translate(296 48) scale({scale}) translate({-x} {-y})"})
    for child in word:
        if child.tag != NS + "title":
            letters.append(deepcopy(child))
    assert not root.findall(".//" + NS + "text")
    assert not root.findall(".//" + NS + "image")
    ET.ElementTree(root).write(HERE / (source.stem + "-lockup.svg"), encoding="unicode")
print("Built three concept lockups with outlined Kaban wordmark.")
