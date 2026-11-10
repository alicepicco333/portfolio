"""For direction A: find variants that share the template's frame, and save them
cropped and scaled onto the template's frame, so a swipe or difference overlay
lines up. Writes assets/img/va-<id>.jpg and assets/align.js.
Run: python -I align.py <assets-dir>
"""
import json
import os
import sys

import numpy as np
from PIL import Image

A = sys.argv[1]
IMG = os.path.join(A, "img")
src = open(os.path.join(A, "data.js"), encoding="utf-8").read()
data = json.loads(src[len("window.MEMO="):-2])

SW = 96  # search width in px


def arr(im, w, h):
    return np.asarray(im.resize((w, h), Image.BILINEAR), dtype=np.float32) / 255.0


out = {}
for t in data["templates"]:
    tim = Image.open(os.path.join(IMG, t["img"])).convert("RGB")
    TW, TH = tim.size
    sh = round(SW * TH / TW)
    ta = arr(tim, SW, sh)
    for v in t["variants"]:
        vim = Image.open(os.path.join(IMG, v["img"])).convert("RGB")
        vw, vh = vim.size
        best = None
        for sc in np.linspace(1.0, 0.55, 19):
            cw = vw * sc
            ch = cw * TH / TW
            if ch > vh:
                ch = vh
                cw = ch * TW / TH
            # sample a coarse grid of offsets
            nx = max(1, int((vw - cw) / 6) + 1)
            ny = max(1, int((vh - ch) / 6) + 1)
            for ix in range(nx):
                for iy in range(ny):
                    x = min(ix * 6, vw - cw)
                    y = min(iy * 6, vh - ch)
                    c = arr(vim.crop((x, y, x + cw, y + ch)), SW, sh)
                    err = float(np.abs(c - ta).mean())
                    if best is None or err < best[0]:
                        best = (err, x, y, cw, ch)
        err, x, y, cw, ch = best
        aligned = err < 0.085
        if aligned:
            vim.crop((x, y, x + cw, y + ch)).resize((TW, TH), Image.LANCZOS).save(
                os.path.join(IMG, f"va-{v['id']}.jpg"), "JPEG", quality=86)
        out[v["id"]] = {"err": round(err, 3), "aligned": aligned}
        print(t["name"][:14], v["id"], round(err, 3), aligned)

with open(os.path.join(A, "align.js"), "w", encoding="utf-8") as f:
    f.write("window.MEMO_ALIGN=" + json.dumps(out) + ";\n")
