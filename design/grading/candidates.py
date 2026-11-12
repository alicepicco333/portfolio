"""Replacement candidates for the two homepage pictures Alice does not like (12 Nov 2026): Luki Massa (Digital
archives, In progress) and Unobravo (User research, Selected work). Each candidate is cut to 4:3 at 1200 x 900
and shown at card size and at the hero map's 260 x 172.

    python candidates.py      -> cand/<id>.jpg and candidates.html

The Luki Massa diagrams are unreadable when the whole sheet is shrunk to a card, so its candidates are close
crops of one part. Unobravo's are two research artefacts, a before/after, one screen and the current style (the
video-session screen is left out: it would put a cast photo of unknown source in front of the project).
"""
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.abspath(os.path.join(HERE, "..", "..", "public"))
PROJ = os.path.join(PUBLIC, "images", "projects")
UNO = os.path.join(PROJ, "unobravo")
PAPER = (236, 237, 240)
CREAM = (250, 240, 234)

# [id, label, source, crop box (left, top, right, bottom) in source pixels, or None for a 4:3 centre crop]
LUKI = [
    ("L1", "The archive as bars: series S02 and S05, subseries, fascicoli, the traced path in blue", os.path.join(PROJ, "13-v3-structure.jpg"), (990, 198, 1410, 513)),
    ("L2", "How one page links up inside a METS record", os.path.join(PROJ, "13-v3-anatomy.jpg"), (884, 232, 1414, 630)),
    ("L3", "A real record: EAD3 unit, NISO MIX checksum, file pointers", os.path.join(PROJ, "13-v3-code.jpg"), (56, 392, 856, 992)),
    ("L4", "Three levels of METS files, each stored next to what it describes", os.path.join(PROJ, "13-v3-levels.jpg"), (30, 150, 800, 728)),
]
PATCH = {"L1": [(980, 445, 1076, 540)]}   # the end of "S03 Carte personali" and its counts, left of the S05 legend
UNOBRAVO = [
    ("U1", "Research: the urgency matrix (impact x persistence of each issue)", os.path.join(UNO, "research", "urgency-current.jpg"), None),
    ("U2", "Research: the service blueprint", os.path.join(UNO, "research", "blueprint.jpg"), (0, 0, 1800, 1350)),
    ("U3", "Before and after: the home screen", "before-after", None),
    ("U4", "One screen: the breathing exercise", os.path.join(UNO, "motion-breathe-poster.jpg"), (0, 385, 720, 925)),
    ("U5", "Three phones, the style of the current picture", os.path.join(UNO, "hero.jpg"), (200, 0, 2200, 1500)),
]


def centre_43(img):
    w, h = img.size
    if w / h > 4 / 3:
        nw = round(h * 4 / 3)
        return img.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    nh = round(w * 3 / 4)
    return img.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))


def before_after():
    out = Image.new("RGB", (1200, 900), CREAM)
    for i, name in enumerate(["before-home.jpg", "after-home.jpg"]):
        im = Image.open(os.path.join(UNO, "before-after", name)).convert("RGB")
        im = im.resize((round(im.width * 800 / im.height), 800), Image.LANCZOS)
        x = 600 - 40 - im.width if i == 0 else 600 + 40
        out.paste(im, (x, 50))
    return out


def make(cid, src, box):
    if src == "before-after":
        img = before_after()
    else:
        img = Image.open(src).convert("RGB")
        for rect in PATCH.get(cid, []):   # word endings from a neighbouring column, painted in the sheet's ground
            img.paste(img.getpixel((1300, 560)), rect)
        img = img.crop(box) if box else centre_43(img)
    w = min(1200, img.width)   # never enlarged: a close crop keeps its own pixels
    img = img.resize((w, round(w * 3 / 4)), Image.LANCZOS)
    os.makedirs(os.path.join(HERE, "cand"), exist_ok=True)
    img.save(os.path.join(HERE, "cand", cid + ".jpg"), quality=86)
    return f"cand/{cid}.jpg"


def main():
    css = (":root{--ink:#0E0E10;--paper:#D5D6DB;--blue:#1A1AFF}body{margin:0;background:var(--paper);color:var(--ink);"
           "font:15px/1.4 'Inter Tight',system-ui,sans-serif;padding:32px}h1{font-size:32px;margin:0 0 8px}"
           "h2{font-size:22px;margin:40px 0 4px}p.lead{max-width:760px;margin:0 0 8px}"
           ".grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;margin-top:16px}"
           "figure{margin:0}.card{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;border:1px solid var(--ink)}"
           ".row{display:flex;gap:12px;align-items:flex-end;margin-top:8px}"
           ".hero{width:260px;height:172px;object-fit:cover;flex:none}"
           "figcaption{font:12px/1.35 'JetBrains Mono',monospace;margin-top:6px}b{color:var(--blue)}"
           ".now{outline:2px dashed var(--ink);outline-offset:6px}")
    html = ["<!doctype html><html lang='en'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>",
            "<title>Replacement pictures</title>",
            "<link href='https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;600&family=JetBrains+Mono&display=swap' rel='stylesheet'>",
            f"<style>{css}</style></head><body><h1>Replacement pictures</h1>",
            "<p class='lead'>Candidates for the two homepage pictures you did not like. Each one is shown as a card and, "
            "below it, at the size it takes behind its skill in the hero map (260 x 172). The first figure in each group "
            "is the current picture, for comparison. Pick one per project by its code; any of them can also take the "
            "grey grade.</p>"]
    groups = [
        ("Luki Massa: Digital archives, In progress", "/images/projects/13-v3-card.jpg", LUKI),
        ("Unobravo: User research, Selected work", "/images/projects/20-card-v12.jpg", UNOBRAVO),
    ]
    for title, current, items in groups:
        html.append(f"<h2>{title}</h2><div class='grid'>")
        cur = os.path.relpath(PUBLIC + current.replace("/", os.sep), HERE).replace(os.sep, "/")
        html.append(f"<figure class='now'><img class='card' src='{cur}' alt=''><div class='row'><img class='hero' src='{cur}' alt=''></div>"
                    "<figcaption><b>Now</b> the current picture</figcaption></figure>")
        for cid, label, src, box in items:
            p = make(cid, src, box)
            html.append(f"<figure><img class='card' src='{p}' alt=''><div class='row'><img class='hero' src='{p}' alt=''></div>"
                        f"<figcaption><b>{cid}</b> {label}</figcaption></figure>")
            print("made", cid)
        html.append("</div>")
    html.append("</body></html>")
    with open(os.path.join(HERE, "candidates.html"), "w", encoding="utf8") as f:
        f.write("\n".join(html))
    print("candidates.html written")


if __name__ == "__main__":
    main()
