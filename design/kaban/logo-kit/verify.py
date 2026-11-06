"""Check delivered artwork, PNG dimensions and web-icon references."""
import json
import struct
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parent
NS = "{http://www.w3.org/2000/svg}"
vectors = list((ROOT / "svg").glob("*.svg")) + list((ROOT / "masters").glob("*.svg"))
for path in vectors:
    root = ET.parse(path).getroot()
    assert root.findall(".//" + NS + "path"), path
    for tag in ("text", "image", "filter", "mask"):
        assert not root.findall(".//" + NS + tag), (path, tag)


def png_size(path):
    data = path.read_bytes()
    assert data[:8] == b"\x89PNG\r\n\x1a\n", path
    return struct.unpack(">II", data[16:24])


for kind, size in (("symbol", (1024, 1024)), ("horizontal", (1600, 462)), ("stacked", (1024, 768)), ("wordmark", (1600, 483))):
    for treatment in ("color", "black", "white", "ivory"):
        path = ROOT / "png" / f"kaban-{kind}-{treatment}.png"
        assert png_size(path) == size, path
assert png_size(ROOT / "png/kaban-app-icon-1024.png") == (1024, 1024)
for filename, size in (("favicon-16.png", 16), ("favicon-32.png", 32), ("favicon-48.png", 48), ("apple-touch-icon.png", 180), ("icon-192.png", 192), ("icon-512.png", 512), ("maskable-512.png", 512)):
    assert png_size(ROOT / "web" / filename) == (size, size), filename
assert struct.unpack("<HHH", (ROOT / "web/favicon.ico").read_bytes()[:6]) == (0, 1, 3)
manifest = json.loads((ROOT / "web/site.webmanifest").read_text())
assert manifest["name"] == "Kaban"
for icon in manifest["icons"]:
    path = ROOT / "web" / icon["src"].lstrip("/")
    assert path.is_file(), path
    assert "x".join(map(str, png_size(path))) == icon["sizes"], path
assert len(list((ROOT / "presentation").glob("slide-*.png"))) == 5
for filename in ("usage-guide.html", "usage-guide.md", "presentation.html", "README.md", "kaban-preview.png"):
    assert (ROOT / filename).is_file(), filename
public = ROOT.parents[2] / "public"
for path in (ROOT / "svg").glob("*.svg"):
    assert (public / path.name).read_bytes() == path.read_bytes(), path
for name in ("kaban-symbol-small.svg",):
    assert (public / name).read_bytes() == (ROOT / "masters" / name).read_bytes(), name
for name in ("favicon.svg", "favicon.ico", "favicon-16.png", "favicon-32.png", "favicon-48.png", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "maskable-512.png", "kaban-app-icon.svg"):
    assert (public / name).read_bytes() == (ROOT / "web" / name).read_bytes(), name
assert (public / "pwa-icon.svg").read_bytes() == (ROOT / "web/kaban-app-icon.svg").read_bytes()
assert (ROOT / "web/favicon.svg").read_bytes() == (ROOT / "web/kaban-app-icon.svg").read_bytes()
tile = ET.parse(ROOT / "web/favicon.svg").getroot().find(NS + "rect")
assert tile is not None and float(tile.attrib["rx"]) > 0 and tile.attrib["fill"] == "#71452E"
for extension in ("svg", "ico"):
    assert (public / f"favicon-baulito.{extension}").read_bytes() == (ROOT / "web" / f"favicon.{extension}").read_bytes()
assert (ROOT / "masters/kaban-symbol-master.svg").read_bytes() != (ROOT / "masters/kaban-symbol-small.svg").read_bytes()
print(f"PASS: {len(vectors)} vector SVGs; PNG dimensions; ICO entries; manifest references; five slides; guides; app assets match kit.")
