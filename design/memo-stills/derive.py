"""From retake.js's raw shots: The Meme Ontology's card (1200 x 900 and 800 x 600 WebP), its square (1400 x 1400)
and the hero map's two pictures (520 x 344 WebP, original colour, as Alice chose).

    python design/memo-stills/derive.py
"""
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.abspath(os.path.join(HERE, "..", "..", "public", "images"))
RAW = os.path.join(HERE, "raw")


def centre(img, ratio):
    w, h = img.size
    if w / h > ratio:
        nw = round(h * ratio)
        return img.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    nh = round(w / ratio)
    return img.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))


home = Image.open(os.path.join(RAW, "home-1600.png")).convert("RGB")
card = centre(home, 4 / 3)
card.resize((1200, 900), Image.LANCZOS).save(os.path.join(PUBLIC, "projects", "12-card-v4.jpg"), quality=86)
card.resize((800, 600), Image.LANCZOS).save(os.path.join(PUBLIC, "projects", "12-card-v4-800.webp"), "WEBP", quality=82, method=6)
centre(home, 1).resize((1400, 1400), Image.LANCZOS).save(os.path.join(PUBLIC, "projects", "12.jpg"), quality=86)

for raw, name in [("home-1440.png", "onto"), ("viz-1440.png", "dv")]:
    img = centre(Image.open(os.path.join(RAW, raw)).convert("RGB"), 520 / 344)
    img.resize((520, 344), Image.LANCZOS).save(os.path.join(PUBLIC, "hero", name + ".webp"), "WEBP", quality=82, method=6)
print("card, square and hero pictures written")
