"""Applies Alice's chosen gradings (12 Nov 2026) to the homepage images, writing graded WebP files to
public/images/hero/. Originals stay untouched; project pages keep true colour.

    python apply.py
"""
import os
import sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from make import grey, blue, muted, glow_grade, PUBLIC  # noqa: E402

GRADES = {"A": grey, "B": blue, "C": muted, "O": None}   # O: original colour, only cropped and resized
# [source under public, output name in public/images/hero, grade, optional crop box in source pixels]
# 12 Nov 2026, later: no hero pictures from in-progress projects (Alice), so HCI moves from the Rijksmuseum
# Group Hunt to Unobravo's usability-test urgency matrix (still grey), and Digital archives from Luki Massa
# to The Stolen Archive's collection page (original colour).
CHOICES = [
    ("/images/projects/unobravo/research/urgency-current.jpg", "hci", "A"),  # HCI: Unobravo usability findings, grey
    ("/images/projects/0-g3-v5.jpg", "arch", "O", (0, 175, 1100, 900)),      # Digital archives: The Stolen Archive collection
    # Interaction design: Glove, Visor, Rover's four hand gestures (plate 12, already in the plates' grade), set on
    # the plate's own grey at the hero picture's ratio. 13 Nov 2026: it showed the same rover scene as
    # Speculative design, and two skills should not share a picture (Alice).
    ("/images/projects/18-p12.jpg", "ixd", "O", (60, 225, 725, 787), "pad"),
    ("/images/projects/18-hl.jpg", "spec", "D"),                # Speculative design: Glove, Visor, Rover
    ("/images/projects/14-card-v3-800.webp", "live", "B"),      # Live coding: 5PIC3, blue
    ("/images/hero/ux.webp", "ux", "C"),                        # UX design: Teigetje & Woelrat, muted
    ("/images/hero/vis.webp", "vis", "C"),                      # Visual design: Teigetje & Woelrat, muted
    # Selected work: The Stolen Archive back in its own colours (13 Nov 2026, Alice); its grey card-0 is removed
    ("/images/projects/11-card-v3-800.webp", "card-11", "C"),   # Selected work: Teigetje & Woelrat, muted
    ("/images/projects/18-card-800.webp", "card-18", "D"),      # Selected work: Glove, Visor, Rover
    ("/images/projects/14-card-v3-800.webp", "card-14", "B"),   # Selected work: 5PIC3 live, blue
]

ONLY = set(sys.argv[1:])   # python apply.py hci arch: redo only those

RATIO = 364 / 240  # the hero picture (components/SkillMap/SkillScreen.js)

for src, name, g, *crop in CHOICES:
    if ONLY and name not in ONLY:
        continue
    img = Image.open(PUBLIC + src.replace("/", os.sep)).convert("RGB")
    if crop:
        ground = img.getpixel((4, 4))
        img = img.crop(crop[0])
        if "pad" in crop[1:]:
            # set on the source's own ground at the picture's ratio, with a margin, so nothing is cut off
            h = round(img.height * 1.12)
            canvas = Image.new("RGB", (max(round(h * RATIO), img.width + 40), h), ground)
            canvas.paste(img, ((canvas.width - img.width) // 2, (canvas.height - img.height) // 2))
            img = canvas
    if img.width > 800:
        img = img.resize((800, round(img.height * 800 / img.width)), Image.LANCZOS)
    if g == "O":
        out = img
    elif g == "D":
        out = glow_grade(img).convert("RGB")
    else:
        a = np.asarray(img, float) / 255
        out = Image.fromarray((np.clip(GRADES[g](a), 0, 1) * 255).astype(np.uint8))
    path = os.path.join(PUBLIC, "images", "hero", name + ".webp")
    out.save(path, "WEBP", quality=82, method=6)
    print(name, g, out.size, os.path.getsize(path) // 1024, "KB")
