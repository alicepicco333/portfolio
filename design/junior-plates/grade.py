"""Grades a picture into the plates' palette: everything to the site's greys (ink #0E0E10 to paper #ECEDF0),
except green light (the fungus glow, Junior's LED), which stays and is pulled towards the project green #2a6236.

    python grade.py in.png out.jpg [--width 1200] [--gamma 1.0] [--lift 0] [--glow 1.0] [--crop x,y,w,h]

Used for the 3D Junior renders (sim-*.png), the ComfyUI pictures and the car video frame, so that real and
generated pictures sit in one palette. Colour is the only change: nothing is added or removed.
"""
import argparse
import numpy as np
from PIL import Image, ImageFilter

INK = np.array([14, 14, 16], float)
PAPER = np.array([236, 237, 240], float)
GREEN_DARK = np.array([12, 34, 19], float)
GREEN = np.array([42, 98, 54], float)       # #2a6236, the project accent
GREEN_LIGHT = np.array([150, 232, 172], float)  # the glow's hot centre


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def grade(img, gamma=1.0, lift=0.0, glow=1.0, contrast=1.0):
    a = np.asarray(img.convert('RGB'), float) / 255
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a.max(-1), a.min(-1)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    # hue in degrees
    d = np.maximum(mx - mn, 1e-6)
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    green = smooth(52, 92, h) * (1 - smooth(165, 190, h)) * smooth(0.1, 0.32, sat) * smooth(0.06, 0.2, mx)
    # soften the mask, so a halo fading into the ground keeps a soft edge
    radius = max(2, img.width // 300)
    soft = np.asarray(Image.fromarray((green * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius)), float) / 255
    green = np.clip(np.maximum(green * 0.6, soft) * glow, 0, 1)
    lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    t = np.clip((lum + lift) ** (1 / gamma), 0, 1)
    t = np.clip((t - 0.5) * contrast + 0.5, 0, 1)[..., None]
    grey = INK + (PAPER - INK) * t
    v = np.clip(mx * 1.15, 0, 1)[..., None]
    gr = np.where(v < 0.5, GREEN_DARK + (GREEN - GREEN_DARK) * (v / 0.5), GREEN + (GREEN_LIGHT - GREEN) * ((v - 0.5) / 0.5))
    out = grey * (1 - green[..., None]) + gr * green[..., None]
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('src'); p.add_argument('dst')
    p.add_argument('--width', type=int, default=0)
    p.add_argument('--gamma', type=float, default=1.0)
    p.add_argument('--lift', type=float, default=0.0)
    p.add_argument('--glow', type=float, default=1.0)
    p.add_argument('--contrast', type=float, default=1.0)
    p.add_argument('--crop', default='')
    p.add_argument('--quality', type=int, default=88)
    a = p.parse_args()
    im = Image.open(a.src)
    if a.crop:
        x, y, w, h = map(int, a.crop.split(','))
        im = im.crop((x, y, x + w, y + h))
    if a.width and im.width != a.width:
        im = im.resize((a.width, round(im.height * a.width / im.width)), Image.LANCZOS)
    grade(im, a.gamma, a.lift, a.glow, a.contrast).save(a.dst, quality=a.quality, optimize=True, progressive=True)
    print('graded', a.dst)
