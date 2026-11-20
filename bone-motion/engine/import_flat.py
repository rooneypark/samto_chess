"""The five basic troops from their second set of sheets (2026-11-20): front | left-facing side | rear on a flat magenta ground.

    python -X utf8 bone-motion/engine/import_flat.py [sword spear shield archer tactician]
    sheets: bone-motion/art-in/base-sheets-v2/<name>.png  (1024 x 1024, kept in the repo folder; not in Git)
    -> bone-motion/art-in/base_<...>/front.png, side.png, back.png  (+ sheet-check.png), 256 x 256, transparent

These sheets are 320-pixel drawings saved at 1024 (one drawn pixel = 3.2), and the figures are 116 drawn pixels tall, so they
are read back at their own size and used 1:1: no enlargement, every line stays one pixel wide. (The first set was 82 pixels
tall and had to be enlarged 1.5x, which made the lines uneven.)
  1. one colour per drawn pixel: the median of the middle of each 3.2 px cell
  2. magenta out: everything near the ground colour, wherever it is (the figures have no magenta), then the half-blended
     pixels on the edge: dark ones become outline, light ones go
  3. the three figures are split at the empty columns, brought to one palette, and set on 256 canvases with the soles on
     row 223 and the middle of the shoes at x = 128
"""
import os, sys
from collections import deque
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm, import_sheet as S

SRC = os.path.join(sm.WORK, 'art-in', 'base-sheets-v2')
OUT = {'sword': 'base_swordsman', 'spear': 'base_spearman', 'shield': 'base_shield', 'archer': 'base_archer', 'tactician': 'base_tactician'}
CELL = 3.2; CLEAR = (0, 0, 0, 0)

def dark(p): return p[3] and sum(p[:3]) < 200
def pinkish(p): return p[0] - p[1] > 45 and p[2] - p[1] > 45      # some magenta mixed in; no colour of the figures looks like this

def native(path):
    a = np.asarray(Image.open(path).convert('RGB')).astype(float); n = int(round(a.shape[1] / CELL)); out = Image.new('RGBA', (n, n)); o = out.load()
    for j in range(n):
        for i in range(n):
            b = a[int(j * CELL + 0.9):int((j + 1) * CELL - 0.3) + 1, int(i * CELL + 0.9):int((i + 1) * CELL - 0.3) + 1]
            o[i, j] = tuple(int(v) for v in np.median(b.reshape(-1, 3), axis=0)) + (255,)
    return out

def cut_out(im):
    px = im.load(); w, h = im.size; ground = px[2, 2]
    for y in range(h):
        for x in range(w):
            p = px[x, y]
            if sum(abs(p[i] - ground[i]) for i in range(3)) < 110: px[x, y] = CLEAR
    ink = min((px[x, y] for y in range(h) for x in range(w) if px[x, y][3]), key=lambda p: sum(p[:3]))
    for _ in range(2):
        edge = [(x, y) for y in range(h) for x in range(w) if px[x, y][3] and pinkish(px[x, y])]
        for x, y in edge:
            near = [px[x + i, y + j] for i, j in ((1, 0), (-1, 0), (0, 1), (0, -1)) if 0 <= x + i < w and 0 <= y + j < h]
            px[x, y] = ink if sum(px[x, y][:3]) < 330 and any(q[3] and not pinkish(q) for q in near) else CLEAR
    return im

def figures(im):
    """The three figures, left to right: runs of occupied columns (a gap of up to 3 columns inside a figure is allowed: a
    spear held away from the body). Specks are dropped."""
    px = im.load(); w, h = im.size; cols = [sum(1 for y in range(h) if px[x, y][3]) > 0 for x in range(w)]; runs = []; start = None; gap = 0
    for x, on in enumerate(cols + [False] * 5):
        if on:
            start = x if start is None else start; gap = 0; end = x
        elif start is not None:
            gap += 1
            if gap > 3: runs.append((start, end + 1)); start = None
    runs = [r for r in runs if r[1] - r[0] > 12]; out = []
    for a, b in runs:
        f = im.crop((a, 0, b, h)); fp = f.load(); left = {(x, y) for y in range(h) for x in range(f.width) if fp[x, y][3]}; parts = []
        while left:
            q = deque([left.pop()]); part = set(q)
            while q:
                x, y = q.popleft()
                for n in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1), (x + 1, y + 1), (x - 1, y - 1), (x + 1, y - 1), (x - 1, y + 1)):
                    if n in left: left.discard(n); part.add(n); q.append(n)
            parts.append(part)
        for part in parts:
            if len(part) < 12:
                for p in part: fp[p] = CLEAR
        out.append(f.crop(f.getbbox()))
    return out

def feet_x(im, skip=()):
    px = im.load(); xs = [x for x in range(im.width) if x not in skip and any(px[x, y][3] for y in range(im.height - 5, im.height))]
    return (min(xs) + max(xs)) / 2.0

def weapon_cols(im, rows=6):
    """Columns that are occupied in the bottom rows but belong to something thin standing beside the shoes (a spear's foot,
    a bow's tip): runs of at most 4 columns."""
    px = im.load(); on = [any(px[x, y][3] for y in range(im.height - rows, im.height)) for x in range(im.width)] + [False]; out = []; start = None
    for x, v in enumerate(on):
        if v and start is None: start = x
        if not v and start is not None:
            if x - start <= 4: out += range(start, x)
            start = None
    return out

def finish(name, views, post=None):
    d = os.path.join(sm.WORK, 'art-in', OUT[name]); os.makedirs(d, exist_ok=True); order = ('front', 'side', 'back')
    figs = S.palette([views[v] for v in order], 48); check = Image.new('RGBA', (768 * 3, 768), (200, 198, 185, 255))
    for k, (v, f) in enumerate(zip(order, figs)):
        out = Image.new('RGBA', (256, 256), CLEAR); out.alpha_composite(f, (int(round(128 - feet_x(f, weapon_cols(f)))), 224 - f.height))
        out.save(os.path.join(d, v + '.png')); bb = out.getbbox()
        print('%-15s %-5s %dx%d  캔버스 %s' % (OUT[name], v, bb[2] - bb[0], bb[3] - bb[1], bb)); check.alpha_composite(out.resize((768, 768), Image.NEAREST), (k * 768, 0))
    check.save(os.path.join(d, 'sheet-check.png'))

def shorten_spear(im, k):
    """An upright spear whose top stands clear above the figure: cut k rows out of the shaft right under the head, so the head
    comes down by k. The spear's columns are the ones occupied in the top 20 rows; the cut is made at the first stretch of
    k rows in which those columns hold nothing wider than the shaft (so above the hand)."""
    px = im.load(); cols = [x for x in range(im.width) if any(px[x, y][3] for y in range(20))]; cols = list(range(min(cols), max(cols) + 1))
    row = lambda y: [x for x in cols if px[x, y][3]]
    thin = min(len(row(y)) for y in range(20, 60)) + 1      # the shaft's width (it wavers by a pixel on these sheets)
    head = next(y for y in range(20, im.height - k) if all(len(row(t)) <= thin for t in range(y, y + k + 1)))
    for y in range(head + k - 1, -1, -1):
        for x in cols: px[x, y] = px[x, y - k] if y - k >= 0 else CLEAR
    return im.crop(im.getbbox())

def bowstring(im):
    """The archer's string was a grey hair line on the sheet and did not survive the cut-out (user 2026-11-20: draw it).
    A straight 1 px line in the outline colour from the bow's top tip to its bottom tip, only where nothing is drawn, so it
    runs behind the hand. The bow is the thing that stands above the cap: its tip is the top rows' occupied columns."""
    px = im.load(); ink = min((p for p in im.getdata() if p[3]), key=lambda p: sum(p[:3]))
    top = [x for x in range(im.width) if any(px[x, y][3] for y in range(4))]; tip = (min(top) + max(top)) // 2
    x = tip + (3 if tip < im.width / 2 else -3)      # as on the sheet: the string hangs 3 px to the figure's side of the tips
    low = max(y for y in range(im.height) if any(px[c, y][3] for c in top))
    for y in range(5, low - 4):
        if not px[x, y][3]: px[x, y] = ink
    return im

def read(name):
    figs = figures(cut_out(native(os.path.join(SRC, name + '.png'))))
    if len(figs) != 3: raise SystemExit('%s: 인물을 %d개 찾았습니다 (3개여야 함)' % (name, len(figs)))
    return dict(zip(('front', 'side', 'back'), figs))

if __name__ == '__main__':
    for name in (sys.argv[1:] or list(OUT)):
        views = read(name)
        if name == 'spear':      # drawn 148 px long; the foot-spear bones are 128
            views = {v: shorten_spear(f, 20) for v, f in views.items()}
        if name == 'archer': views = {v: bowstring(f) for v, f in views.items()}
        finish(name, views)
