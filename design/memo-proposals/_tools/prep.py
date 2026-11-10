"""Builds assets/data.js and assets/img/ for the MEMO redesign mockups.

Reads the public data files of the live site (downloaded beforehand into SRC)
and fetches the images it needs from the Know Your Meme CDN, as small local
thumbnails. Run: python -I prep.py <src-dir> <out-dir>
"""
import io
import json
import os
import sys
import urllib.request

from PIL import Image

SRC, OUT = sys.argv[1], sys.argv[2]
IMG = os.path.join(OUT, "img")
os.makedirs(IMG, exist_ok=True)
UA = {"User-Agent": "memo-design-mockup/1.0"}


def load(name):
    with open(os.path.join(SRC, name), encoding="utf-8") as f:
        return json.load(f)


def fetch(url, dest, max_side):
    if os.path.exists(dest):
        return True
    try:
        req = urllib.request.Request(url, headers=UA)
        data = urllib.request.urlopen(req, timeout=30).read()
        im = Image.open(io.BytesIO(data))
        im = im.convert("RGB")
        im.thumbnail((max_side, max_side))
        im.save(dest, "JPEG", quality=84, optimize=True)
        return True
    except Exception as e:  # keep going, report at the end
        print("fail", url, e)
        return False


memes = load("meme_data.json")["memes"]
sampled = {x["meme_url"].rstrip("/").split("/")[-1]: x for x in load("sampled_dataset.json")}
colours = load("color_data.json")
annots = load("transformation_annotations.json")
variants_meta = {v["photo_id"]: v for v in load("variants_metadata.json")}

TEMPLATES = [
    ("stonks", "Stonks"),
    ("surprised-pikachu", "Surprised Pikachu"),
    ("me-and-the-boys", "Me And The Boys"),
    ("npc-wojak", "Npc Wojak"),
    ("steven-crowders-change-my-mind-campus-sign", "Steven Crowders Change My Mind Campus Sign"),
]
NICE = {
    "Npc Wojak": "NPC Wojak",
    "Steven Crowders Change My Mind Campus Sign": "Change My Mind",
}

templates = []
for slug, name in TEMPLATES:
    m = memes[slug]
    s = sampled.get(slug, {})
    fn = f"t-{slug}.jpg"
    fetch(m["imageURL"], os.path.join(IMG, fn), 720)
    vs = []
    for a in [x for x in annots if x["memeName"] == name]:
        vm = variants_meta.get(a["photoId"], {})
        vfn = f"v-{a['photoId']}.jpg"
        ok = fetch(a["imageURL"], os.path.join(IMG, vfn), 520)
        vs.append({
            "id": a["photoId"],
            "title": a["variantTitle"],
            "by": a["variantUploader"],
            "dims": a["transformationDimension"],
            "extent": a["transformationExtent"],
            "typeFrom": a["canonicalImageType"],
            "typeTo": a["variantImageType"],
            "img": vfn if ok else None,
            "url": vm.get("photo_url", "").replace(":443", ""),
        })
    templates.append({
        "slug": slug,
        "name": NICE.get(name, name),
        "year": m["year"],
        "views": m["popularityViews"],
        "photos": s.get("photos"),
        "formats": m["hasFormat"],
        "platform": m["hasOriginPlatform"],
        "imageType": m["hasImageType"],
        "clipScore": m["clipImageTypeScore"],
        "text": m["hasTextPresence"],
        "colorMode": m["hasColorMode"],
        "fileFormat": m["hasFileFormat"],
        "period": m["hasTimePeriod"],
        "description": m["description"],
        "kym": m["memeUrl"],
        "imageURL": m["imageURL"],
        "img": fn,
        "variants": vs,
    })

# A few corpus entries opened as examples in direction B
EXTRA = ["me-gusta", "ironic-doge-memes"]
extra = {}
for slug in EXTRA:
    m = memes[slug]
    fn = f"m-{slug}.jpg"
    fetch(m["imageURL"], os.path.join(IMG, fn), 520)
    s = sampled.get(slug, {})
    extra[slug] = {
        "slug": slug, "year": m["year"], "views": m["popularityViews"], "photos": s.get("photos"),
        "formats": m["hasFormat"], "platform": m["hasOriginPlatform"], "imageType": m["hasImageType"],
        "clipScore": m["clipImageTypeScore"], "fileFormat": m["fileFormat"] if "fileFormat" in m else m["hasFileFormat"],
        "description": m["description"], "kym": m["memeUrl"], "img": fn,
    }

# Corpus: one row per meme, for the square views
FORMATS, PLATFORMS, TYPES = [], [], []


def idx(lst, v):
    if v not in lst:
        lst.append(v)
    return lst.index(v)


corpus = []
for slug, m in memes.items():
    c = colours.get(slug)
    y = int(m["year"]) if str(m.get("year", "")).isdigit() else 0
    fmt = next((f for f in (m.get("hasFormat") or []) if f and f != "Unknown"), "Unknown")
    corpus.append([
        slug, y,
        round(c["h"]) if c else -1, round(c["s"]) if c else 0, round(c["l"]) if c else 50,
        idx(FORMATS, fmt), idx(PLATFORMS, m.get("hasOriginPlatform") or "Unknown"),
        idx(TYPES, m.get("hasImageType") or "Unknown"), m.get("popularityViews") or 0,
    ])

data = {
    "templates": templates,
    "extra": extra,
    "corpusCols": ["slug", "year", "h", "s", "l", "format", "platform", "imageType", "views"],
    "formats": FORMATS, "platforms": PLATFORMS, "imageTypes": TYPES,
    "corpus": corpus,
}
with open(os.path.join(OUT, "data.js"), "w", encoding="utf-8") as f:
    f.write("window.MEMO=" + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")
print("templates", len(templates), "variants", sum(len(t["variants"]) for t in templates), "corpus", len(corpus))
print("missing imgs", [v["id"] for t in templates for v in t["variants"] if not v["img"]])
