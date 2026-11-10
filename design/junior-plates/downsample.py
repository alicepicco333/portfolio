"""Downsamples the 3200 x 1800 plate shots to 1600 x 900 JPGs: quality 86, lowered step by step if a file
would be over 250 KB. Usage: python downsample.py <tmp dir> <out dir> p01 p02 ...
Writes <out dir>/18-pNN.jpg."""
import io, os, sys
from PIL import Image

tmp, out, ids = sys.argv[1], sys.argv[2], sys.argv[3:]
for pid in ids:
    im = Image.open(os.path.join(tmp, pid + '.png')).convert('RGB').resize((1600, 900), Image.LANCZOS)
    for q in (86, 84, 82, 80, 78, 76, 74, 72, 70):
        buf = io.BytesIO()
        im.save(buf, 'JPEG', quality=q, optimize=True, progressive=True, subsampling=0 if q >= 84 else 2)
        if buf.tell() <= 250_000:
            break
    dest = os.path.join(out, '18-' + pid + '.jpg')
    with open(dest, 'wb') as f:
        f.write(buf.getvalue())
    print(f'{os.path.basename(dest)}  q{q}  {buf.tell() // 1024} KB')
