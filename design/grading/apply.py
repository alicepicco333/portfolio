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
    ("/images/projects/18-card-800.webp", "ixd", "D"),          # Interaction design: Glove, Visor, Rover
    ("/images/projects/18-hl.jpg", "spec", "D"),                # Speculative design: Glove, Visor, Rover
    ("/images/projects/14-card-v3-800.webp", "live", "B"),      # Live coding: 5PIC3, blue
    ("/images/hero/ux.webp", "ux", "C"),                        # UX design: Teigetje & Woelrat, muted
    ("/images/hero/vis.webp", "vis", "C"),                      # Visual design: Teigetje & Woelrat, muted
    ("/images/projects/0-card-v5-800.webp", "card-0", "A"),     # Selected work: The Stolen Archive, grey
    ("/images/projects/11-card-v3-800.webp", "card-11", "C"),   # Selected work: Teigetje & Woelrat, muted
    ("/images/projects/18-card-800.webp", "card-18", "D"),      # Selected work: Glove, Visor, Rover
    ("/images/projects/14-card-v3-800.webp", "card-14", "B"),   # Selected work: 5PIC3 live, blue
]

ONLY = set(sys.argv[1:])   # python apply.py hci arch: redo only those

for src, name, g, *crop in CHOICES:
    if ONLY and name not in ONLY:
        continue
    img = Image.open(PUBLIC + src.replace("/", os.sep)).convert("RGB")
    if crop:
        img = img.crop(crop[0])
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
