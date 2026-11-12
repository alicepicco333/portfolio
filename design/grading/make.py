"""Colour-grading options for the homepage images (the hero map's skill screens and the Selected work previews),
so they sit in the site's palette: ink #0E0E10, paper #ECEDF0, the electric blue #1A1AFF.

    python make.py            -> out/<option>/<name>.jpg and index.html (a comparison page)

Options: A grey duotone, B blue tritone, C muted and cool, D grey with the green glow (Glove, Visor, Rover only,
the grade its plates use). Originals are not touched.
"""
import os
import sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
PUBLIC = os.path.join(ROOT, "public")
sys.path.insert(0, os.path.join(ROOT, "design", "junior-plates"))
from grade import grade as glow_grade  # noqa: E402

INK = np.array([14, 14, 16], float) / 255
PAPER = np.array([236, 237, 240], float) / 255
BLUE = np.array([26, 26, 255], float) / 255
COOL = np.array([213, 214, 219], float) / 255

# the images the homepage shows: [label, path under public]
IMAGES = [
    ("Ethnography: The Stolen Archive", "/images/hero/anth.webp"),
    ("User research: Unobravo", "/images/projects/20-card-v12-800.webp"),
    ("HCI: Rijksmuseum Group Hunt", "/images/projects/17-hl.jpg"),
    ("Digital archives: Luki Massa", "/images/projects/13-v3-card-800.webp"),
    ("Ontologies: The Meme Ontology", "/images/hero/onto.webp"),
    ("Data visualization: The Meme Ontology", "/images/hero/dv.webp"),
    ("UX design: Teigetje & Woelrat", "/images/hero/ux.webp"),
    ("Visual design: Teigetje & Woelrat", "/images/hero/vis.webp"),
    ("Interaction design: Glove, Visor, Rover", "/images/projects/18-card-800.webp"),
    ("Speculative design: Glove, Visor, Rover", "/images/projects/18-hl.jpg"),
    ("Live coding: 5PIC3 live", "/images/projects/14-card-v3-800.webp"),
    ("Selected work: The Stolen Archive", "/images/projects/0-card-v5-800.webp"),
    ("Selected work: Teigetje & Woelrat", "/images/projects/11-card-v3-800.webp"),
    ("Selected work: The Meme Ontology", "/images/projects/12-card-v4-800.webp"),
]
GLOW = {"/images/projects/18-card-800.webp", "/images/projects/18-hl.jpg"}


def lum(a):
    return 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]


def contrast(t, k=1.12):
    return np.clip((t - 0.5) * k + 0.5, 0, 1)


def grey(a):
    t = contrast(lum(a))[..., None]
    return INK + (PAPER - INK) * t


def blue(a):
    t = contrast(lum(a), 1.05)[..., None]
    lo = INK + (BLUE - INK) * np.clip(t / 0.5, 0, 1)
    hi = BLUE + (PAPER - BLUE) * np.clip((t - 0.5) / 0.5, 0, 1)
    return np.where(t < 0.5, lo, hi)


def muted(a):
    l = lum(a)[..., None]
    out = l + (a - l) * 0.25          # three quarters of the colour out
    out = out * 0.85 + COOL * l * 0.15  # cooled towards the page grey
    return np.clip(INK + (out - 0) * (1 - INK), 0, 1)


OPTIONS = {"A": ("Grey", grey), "B": ("Blue", blue), "C": ("Muted", muted)}


def main():
    rows = []
    for label, src in IMAGES:
        img = Image.open(PUBLIC + src.replace("/", os.sep)).convert("RGB")
        if img.width > 900:
            img = img.resize((900, round(img.height * 900 / img.width)), Image.LANCZOS)
        a = np.asarray(img, float) / 255
        name = os.path.splitext(os.path.basename(src))[0]
        cells = [("Original", os.path.relpath(PUBLIC + src.replace("/", os.sep), HERE).replace(os.sep, "/"))]
        for key, (title, fn) in OPTIONS.items():
            os.makedirs(os.path.join(HERE, "out", key), exist_ok=True)
            p = os.path.join("out", key, name + ".jpg")
            Image.fromarray((np.clip(fn(a), 0, 1) * 255).astype(np.uint8)).save(os.path.join(HERE, p), quality=86)
            cells.append((f"{key}. {title}", p.replace(os.sep, "/")))
        if src in GLOW:
            os.makedirs(os.path.join(HERE, "out", "D"), exist_ok=True)
            p = os.path.join("out", "D", name + ".jpg")
            glow_grade(img).convert("RGB").save(os.path.join(HERE, p), quality=86)
            cells.append(("D. Grey with the green glow", p.replace(os.sep, "/")))
        rows.append((label, cells))
        print("graded", name)

    css = (":root{--ink:#0E0E10;--paper:#D5D6DB}body{margin:0;background:var(--paper);color:var(--ink);"
           "font:15px/1.4 'Inter Tight',system-ui,sans-serif;padding:32px}h1{font-size:32px;margin:0 0 8px}"
           "p.lead{max-width:720px;margin:0 0 32px}section{margin:0 0 40px}h2{font:600 14px/1.3 'JetBrains Mono',monospace;"
           "text-transform:none;margin:0 0 10px}.row{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}"
           "figure{margin:0}img{display:block;width:100%;aspect-ratio:3/2;object-fit:cover;background:#0E0E10}"
           "figcaption{font:12px/1.3 'JetBrains Mono',monospace;margin-top:6px}")
    html = ["<!doctype html><html lang='en'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>",
            "<title>Homepage image grading</title><link rel='preconnect' href='https://fonts.googleapis.com'>",
            "<link href='https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;600&family=JetBrains+Mono&display=swap' rel='stylesheet'>",
            f"<style>{css}</style></head><body><h1>Homepage image grading</h1>",
            "<p class='lead'>Each homepage image (the hero map's skill screens and the Selected work previews) in its original colour "
            "and three gradings in the site's palette. The Glove, Visor, Rover images also show the grade their plates use. "
            "Project pages keep their true colours.</p>"]
    for label, cells in rows:
        html.append(f"<section><h2>{label}</h2><div class='row'>")
        for cap, p in cells:
            html.append(f"<figure><img src='{p}' alt='' loading='lazy'><figcaption>{cap}</figcaption></figure>")
        html.append("</div></section>")
    html.append("</body></html>")
    with open(os.path.join(HERE, "index.html"), "w", encoding="utf8") as f:
        f.write("\n".join(html))
    print("index.html written")


if __name__ == "__main__":
    main()
