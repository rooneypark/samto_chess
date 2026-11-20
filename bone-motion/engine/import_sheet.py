"""Turn a generated three-view sheet (front | left-facing side | rear, on a painted checkerboard, with captions) into the
three 256x256 transparent drawings the pipeline needs.

    python -X utf8 bone-motion/engine/import_sheet.py <sheet.png> <id> [--cell 11.2] [--scale 1.5] [--rows 97] [--colours 56] [--order front,side,back]
    -> bone-motion/art-in/<id>/front.png, side.png, back.png  (+ sheet-check.png, the three at 3x on a flat ground)

What it does, in order:
  1. Finds the three figures as bands of the sheet (the caption rows below --rows cells are cut off).
  2. Reads each band back at its own pixel size. These sheets are pixel art blown up by a non-whole factor that is not even
     the same both ways (11.20 across, 11.28 down here), so the grid is measured on each band and every cell gives the
     median of its middle.
  3. Removes the background by flooding in from the edge over the two greys of the checkerboard. Light greys INSIDE the
     figure (a white fan, hair) are not touched, because the flood stops at the dark outline. The grey fringe is taken off,
     and the three views are brought to one palette of --colours colours.
  4. Scales each by `scale` without mixing colours: every output pixel takes the commonest colour of the pixels it covers,
     so the palette stays the drawing's own (no soft edges, no half-transparent pixels).
  5. Sets each on a 256 canvas: soles on row 223 (the ground line is y = 224), the middle of the shoes at x = 128.
The original sheet is not changed.
"""
import os, sys
from collections import Counter, deque
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm

def arg(name, default):
    return type(default)(sys.argv[sys.argv.index(name) + 1]) if name in sys.argv else default

def fit(profile, cell):
    """The real size and offset of the drawing's pixels along one axis: the grid whose lines fall on the strongest colour steps."""
    best = None; n = len(profile)
    for p in np.arange(cell - 0.25, cell + 0.25, 0.005):
        for ph in np.arange(0, p, 0.25):
            v = profile[np.round(np.arange(ph, n - 1, p)).astype(int)].mean()
            if best is None or v > best[0]: best = (v, p, ph)
    return best[1], best[2]

def native(src, cell):
    """One band of the sheet read back at the drawing's own pixel size. The grid is measured on the band itself (these sheets
    are not square: 11.20 across, 11.28 down), and each cell gives the median of its middle, so neither a drifting grid nor the
    soft seams between cells get into the result."""
    a = np.asarray(src.convert('RGB')).astype(float); h, w, _ = a.shape
    px, x0 = fit(np.abs(np.diff(a, axis=1)).sum(axis=2).sum(axis=0), cell); py, y0 = fit(np.abs(np.diff(a, axis=0)).sum(axis=2).sum(axis=1), cell)
    xs = np.arange(x0 + 1 - px, w, px); ys = np.arange(y0 + 1 - py, h, py); out = Image.new('RGB', (len(xs), len(ys)), (255, 255, 255)); o = out.load()      # a cell off the sheet counts as background
    for j, y in enumerate(ys):
        for i, x in enumerate(xs):
            b = a[max(0, int(y + py * 0.3)):max(1, min(h, int(y + py * 0.7) + 1)), max(0, int(x + px * 0.3)):max(1, min(w, int(x + px * 0.7) + 1))]
            if b.shape[0] >= 3 and b.shape[1] >= 3: o[i, j] = tuple(int(v) for v in np.median(b.reshape(-1, 3), axis=0))
    return out

def bands(path, cell, rows):
    """The three figures as bands of the sheet, found on a rough copy: columns that are not checkerboard, above the captions."""
    src = Image.open(path).convert('RGB'); top = src.crop((0, 0, src.width, int(rows * cell)))
    small = np.asarray(top.resize((top.width // 8, top.height // 8), Image.BOX)).astype(int)
    busy = ((small.max(axis=2) - small.min(axis=2) > 30) | (small.max(axis=2) < GROUND[0] - 30)).sum(axis=0) > 2; runs = []; start = None
    for x, on in enumerate(list(busy) + [False]):
        if on and start is None: start = x
        if not on and start is not None:
            if x - start > 1: runs.append((start, x))
            start = None
    merged = []      # a thin forearm reaching to a spear leaves a short gap in the rough copy: that is still one figure
    for r in runs:
        if merged and r[0] - merged[-1][1] < 10: merged[-1] = (merged[-1][0], r[1])
        else: merged.append(r)
    runs = [r for r in merged if r[1] - r[0] > 12]
    pad = int(cell * 4)
    return [top.crop((max(0, a * 8 - pad), 0, min(top.width, b * 8 + pad), top.height)) for a, b in runs]

GROUND = [185, 255]      # the checkerboard's greys, darkest to lightest; measured on each sheet by sample_ground()
def ground(c): return max(c[:3]) - min(c[:3]) < 14 and GROUND[0] <= c[0] <= GROUND[1]

def sample_ground(path):
    """The sheet's checkerboard is light on some sheets and dark on others: take its range from the outer frame of the sheet."""
    a = np.asarray(Image.open(path).convert('RGB')).astype(int); f = np.concatenate([a[:40].reshape(-1, 3), a[:, :40].reshape(-1, 3)])
    g = f[(f.max(axis=1) - f.min(axis=1)) < 14][:, 0]; GROUND[0] = int(np.percentile(g, 0.5)) - 12; GROUND[1] = min(255, int(np.percentile(g, 99.5)) + 12)

def cut_out(im):
    im = im.convert('RGBA'); px = im.load(); w, h = im.size; seen = set(); q = deque()
    for x in range(w):
        for y in (0, h - 1): q.append((x, y))
    for y in range(h):
        for x in (0, w - 1): q.append((x, y))
    while q:
        x, y = q.popleft()
        if (x, y) in seen or not (0 <= x < w and 0 <= y < h) or not ground(px[x, y]): continue
        seen.add((x, y)); q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    for x, y in seen: px[x, y] = (0, 0, 0, 0)
    # a cell that straddled the outline and the checkerboard comes out mid grey: colourless, lighter than any outline, on the edge
    fringe = [(x, y) for y in range(h) for x in range(w) if px[x, y][3] and max(px[x, y][:3]) - min(px[x, y][:3]) < 22 and min(110, GROUND[0] - 45) < px[x, y][0] <= GROUND[0]
              and any(not (0 <= x + i < w and 0 <= y + j < h) or px[x + i, y + j][3] == 0 for i, j in ((1, 0), (-1, 0), (0, 1), (0, -1)))]
    for x, y in fringe: px[x, y] = (0, 0, 0, 0)
    # keep the figure only: anything not joined to the biggest piece (a speck, a bit of caption) goes
    left = {(x, y) for y in range(h) for x in range(w) if px[x, y][3]}; parts = []
    while left:
        q = deque([left.pop()]); part = set(q)
        while q:
            x, y = q.popleft()
            for n in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if n in left: left.discard(n); part.add(n); q.append(n)
        parts.append(part)
    for part in sorted(parts, key=len)[:-1]:
        for x, y in part: px[x, y] = (0, 0, 0, 0)
    return im.crop(im.getbbox())

def palette(figs, n):
    """One small palette for the three views (a generated sheet has hundreds of near-identical colours)."""
    data = [p[:3] for f in figs for p in f.getdata() if p[3]]; strip = Image.new('RGB', (len(data), 1)); strip.putdata(data)
    q = strip.quantize(colors=n, method=Image.MEDIANCUT, dither=Image.NONE); pal = np.array(q.getpalette()[:n * 3]).reshape(-1, 3)
    cache = {}; out = []
    for f in figs:
        g = f.copy(); px = g.load()
        for y in range(g.height):
            for x in range(g.width):
                c = px[x, y]
                if not c[3]: continue
                if c[:3] not in cache: cache[c[:3]] = tuple(int(v) for v in pal[((pal - np.array(c[:3])) ** 2).sum(axis=1).argmin()])
                px[x, y] = cache[c[:3]] + (255,)
        out.append(g)
    return out

def rescale(im, scale):
    """scale = n / 2 (1.5 -> x3 then /2). Each output pixel = the commonest colour of the 2x2 it covers; transparent wins a tie."""
    n = int(round(scale * 2)); big = im.resize((im.width * n, im.height * n), Image.NEAREST); b = big.load()
    out = Image.new('RGBA', (big.width // 2, big.height // 2), (0, 0, 0, 0)); o = out.load()
    for y in range(out.height):
        for x in range(out.width):
            four = [b[2 * x + i, 2 * y + j] for j in (0, 1) for i in (0, 1)]; c, k = Counter(four).most_common(1)[0]
            o[x, y] = (0, 0, 0, 0) if sum(1 for f in four if f[3] == 0) >= 2 else c if k >= 2 else four[0]
    return out

def place(im):
    px = im.load(); bottom = im.height - 1; xs = [x for x in range(im.width) for y in range(max(0, bottom - 5), bottom + 1) if px[x, y][3]]
    mid = (min(xs) + max(xs)) / 2.0; out = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
    out.alpha_composite(im, (int(round(128 - mid)), 223 - bottom)); return out

if __name__ == '__main__':
    sheet, hero = sys.argv[1], sys.argv[2]; cell = arg('--cell', 11.2); scale = arg('--scale', 1.5); rows = arg('--rows', 97)
    sample_ground(sheet); figs = palette([cut_out(native(b, cell)) for b in bands(sheet, cell, rows)], arg('--colours', 56))
    if len(figs) != 3: raise SystemExit('인물을 %d개 찾았습니다 (3개여야 함)' % len(figs))
    d = os.path.join(sm.WORK, 'art-in', hero); os.makedirs(d, exist_ok=True); check = Image.new('RGBA', (768 * 3, 768), (200, 198, 185, 255))
    for k, (name, f) in enumerate(zip(arg('--order', 'front,side,back').split(','), figs)):
        im = place(rescale(f, scale)); im.save(os.path.join(d, name + '.png')); bb = im.getbbox()
        print('%-5s 원래 %dx%d -> %dx%d, 캔버스 %s, 색 %d가지' % (name, f.width, f.height, bb[2] - bb[0], bb[3] - bb[1], bb, len(set(im.getdata())) - 1))
        check.alpha_composite(im.resize((768, 768), Image.NEAREST), (k * 768, 0))
    check.save(os.path.join(d, 'sheet-check.png'))
