"""Take outline-less grey smears off generated frames (a ghost of the weapon, a puff behind the rider). Local, free.

    python -X utf8 bone-motion/engine/degrey.py <hero> <clip> <view> [frame ...]      (no frames = all 15)

A smear is dull mid grey with no dark outline within 2 px; drawn steel always has its outline that near. Only blobs of 12 px or
more are removed, in the working frame and in original/ (sprite_fix.py rebuilds from there); the received frame stays as raw-NN.png.
"""
import os, shutil, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm, sprite_fix as sf

def smear(px):
    dark = lambda p: p[3] and sum(p[:3]) < 170
    def test(x, y):
        p = px[x, y]
        if not p[3] or max(p[:3]) - min(p[:3]) > 34 or not (85 < max(p[:3]) < 215): return False
        return not any(0 <= x + i < 256 and 0 <= y + j < 256 and dark(px[x + i, y + j]) for i in range(-2, 3) for j in range(-2, 3))
    cand = {(x, y) for y in range(256) for x in range(256) if test(x, y)}; out = []
    while cand:
        q = [cand.pop()]; comp = list(q)
        while q:
            x, y = q.pop()
            for n in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1), (x + 1, y + 1), (x - 1, y - 1), (x + 1, y - 1), (x - 1, y + 1)):
                if n in cand: cand.discard(n); q.append(n); comp.append(n)
        # a smear lies open against the empty canvas; steel inside its outline (a wide blade, an armour plate) does not
        edge = sum(1 for (x, y) in comp if any(not (0 <= x + i < 256 and 0 <= y + j < 256) or px[x + i, y + j][3] == 0 for i, j in ((1, 0), (-1, 0), (0, 1), (0, -1))))
        if len(comp) >= 12 and edge >= max(6, 0.12 * len(comp)): out += comp
    return out

if __name__ == '__main__':
    hero, clip, view = sys.argv[1:4]; frames = [int(a) for a in sys.argv[4:]] or range(1, 16); d = os.path.join(sm.WORK, 'out', 'pixellab', hero, clip, view)
    for n in frames:
        total = 0
        for base in (d, os.path.join(d, 'original')):
            f = os.path.join(base, '%02d.png' % n)
            if not os.path.exists(f): continue
            im = Image.open(f).convert('RGBA'); px = im.load(); pts = smear(px)
            if not pts: continue
            raw = os.path.join(base, 'raw-%02d.png' % n)
            if not os.path.exists(raw): shutil.copy2(f, raw)
            for p in pts: px[p] = (0, 0, 0, 0)
            im.save(f); total = len(pts)
        if total: print('%s %s %s %02d: 회색 얼룩 %d px 제거' % (hero, clip, view, n, total))
