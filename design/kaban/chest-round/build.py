"""Pair the new chest-reference concepts with existing Bantayog outlines."""
from pathlib import Path
from xml.etree import ElementTree as ET

OUT = Path(__file__).resolve().parent
NS = "{http://www.w3.org/2000/svg}"
WORD = ET.parse(OUT.parent / "font-study/a-keepsake-v2-bantayog.svg").getroot().find(NS + "g")
assert WORD is not None
ET.register_namespace("", "http://www.w3.org/2000/svg")
for name, version in (("seed-keeper", "v2"), ("carved-seal", "v1"), ("folded-guardian", "v2")):
    source = ET.parse(OUT / f"{name}-{version}.svg").getroot()
    source.set("viewBox", "0 0 888 256")
    source.append(WORD)
    assert not source.findall(".//" + NS + "text")
    assert len(source.findall(".//" + NS + "path")) == 2
    ET.ElementTree(source).write(OUT / f"{name}-bantayog-{version}.svg", encoding="unicode")
print("Built three Bantayog lockups; path-only SVG checks passed.")
