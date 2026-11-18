"""How much bigger can a hero be drawn than the standard bone before something breaks?

    python bone-motion/engine/headroom.py

For every family and clip: the largest uniform scale about the ground pivot that keeps every joint (plus a margin for
the head, hands and drawn bulk) inside the 256 canvas in all three views, and what that scale does to the strike point.
"""
import importlib, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm
from overview import solve, FAMILIES

MARGIN = 6.0      # px kept free at the canvas edge for hair, crests, cloth
BULK = {'head': 18.5, 'r_head': 18.5, 'head_top': 4.0, 'r_head_top': 4.0}

def limit(frames):
    worst = 99.0; where = None
    for i, j in enumerate(frames):
        for view, _ in sm.VIEWS:
            for name, v in j.items():
                x, y, _n = sm.project(view, v); r = BULK.get(name, 5.0)
                for d, room in ((x - 128, 128 - MARGIN - r), (128 - x, 128 - MARGIN - r), (224 - y, 224 - MARGIN - r), (y - 224, 32 - MARGIN - r)):
                    if d > 1e-6 and room / d < worst: worst = room / d; where = (i + 1, view, name)
    return worst, where

if __name__ == '__main__':
    for f in FAMILIES:
        mod = importlib.import_module('clips.' + f); out = []
        for cid in mod.CLIPS:
            m, clip, rig, frames = solve(f, cid); k, where = limit(frames); out.append((k, cid, where))
        k, cid, where = min(out)
        print('%-14s max scale %.2f  (limited by %s frame %d, %s view, %s)   per clip: %s' % (f, k, cid, where[0], where[1], where[2], ', '.join('%s %.2f' % (c, kk) for kk, c, _ in out)))
    print('strike point moves %.0fpx forward and %.1fpx up per +1%% (uniform scale)' % (1.0, 0.45))
