"""Basic-troop portraits from generated 1024 x 1024 pictures on flat magenta -> 96 x 120 transparent PNG (the game's portrait size).

    python -X utf8 bone-motion/engine/import_portraits.py [sword spear shield_unit archer tactician]
    sources: bone-motion/art-in/base-portraits/src/<game id>.png      results: bone-motion/art-in/base-portraits/<game id>.png

Each picture is pixel art on its own grid (about 12-13.5 px per drawn pixel, measured per picture). It is read back at its own
size, the magenta is taken out (import_flat.cut_out), and the bust is set in the 96 x 120 frame so that every head is the same
size (HEAD px wide) and starts at the same height; shoulders that do not fit are cut off by the frame, never shrunk. The enlargement is nearest-neighbour, so the
edges stay hard (no half-transparent pixels).
"""
import os, sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm, import_flat as F

D = os.path.join(sm.WORK, 'art-in', 'base-portraits'); W, H = 96, 120

def grid(profile):
    return max(((profile[np.round(np.arange(ph, len(profile) - 1, p)).astype(int)].mean(), p, ph) for p in np.arange(8.0, 18.0, 0.02) for ph in np.arange(0, p, 0.5)), key=lambda t: t[0])[1:]

def native(path):
    a = np.asarray(Image.open(path).convert('RGB')).astype(float); h, w, _ = a.shape
    px, x0 = grid(np.abs(np.diff(a, axis=1)).sum(axis=2).sum(axis=0)); py, y0 = grid(np.abs(np.diff(a, axis=0)).sum(axis=2).sum(axis=1))
    xs = np.arange(x0 + 1 - px, w, px); ys = np.arange(y0 + 1 - py, h, py); out = Image.new('RGBA', (len(xs), len(ys)), tuple(int(v) for v in a[2, 2]) + (255,)); o = out.load()
    for j, y in enumerate(ys):
        for i, x in enumerate(xs):
            b = a[max(0, int(y + py * 0.3)):min(h, int(y + py * 0.7) + 1), max(0, int(x + px * 0.3)):min(w, int(x + px * 0.7) + 1)]
            if b.shape[0] >= 2 and b.shape[1] >= 2: o[i, j] = tuple(int(v) for v in np.median(b.reshape(-1, 3), axis=0)) + (255,)
    return out, px, py

HEAD = 60      # every head is this wide in the frame (user 2026-11-20: "do not shrink any; the same size; rather cut off")
TOP = 5        # empty rows above the headgear
SHIFT = {}     # px to the right, per id
SAME = {'spear': 'sword', 'shield_unit': 'sword'}      # user 2026-11-20: the three soldiers look alike, so all three use the swordsman's portrait

def head(cut):
    """The head's width and middle, in the cut-out's own pixels: the widest row above the neck. The neck is the narrowest
    row between 35 % and 75 % of the height (below it the shoulders widen again)."""
    px = cut.load(); w, h = cut.size
    def row(y):
        xs = [x for x in range(w) if px[x, y][3]]; return (min(xs), max(xs)) if xs else (0, 0)
    def run(y):      # the run of the row that holds the picture's middle column band (a spear or arrows beside the head are not the head)
        best = (0, 0); s = None
        for x in range(w + 1):
            on = x < w and px[x, y][3] > 0
            if on and s is None: s = x
            if not on and s is not None:
                if x - s > best[1] - best[0]: best = (s, x)
                s = None
        return best
    neck = min(range(int(h * 0.35), int(h * 0.75)), key=lambda y: run(y)[1] - run(y)[0]); a, b = max((run(y) for y in range(neck)), key=lambda r: r[1] - r[0])
    return b - a, (a + b) / 2.0

def portrait(name):
    nat, px, py = native(os.path.join(D, 'src', SAME.get(name, name) + '.png')); cut = F.cut_out(nat); cut = cut.crop(cut.getbbox()); hw, hx = head(cut)
    k = HEAD / hw; big = cut.resize((max(1, round(cut.width * k)), max(1, round(cut.height * k))), Image.NEAREST)
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0)); out.alpha_composite(big, (round(W / 2 - hx * k) + SHIFT.get(name, 0), max(TOP, H - big.height))); out.save(os.path.join(D, name + '.png'))      # what does not fit is cut off
    print('%-12s 머리 너비 %d -> %d (x%.2f), 그림 %dx%d' % (name, hw, HEAD, k, big.width, big.height))

if __name__ == '__main__':
    for n in (sys.argv[1:] or [f[:-4] for f in sorted(os.listdir(os.path.join(D, 'src'))) if f.endswith('.png')]): portrait(n)
