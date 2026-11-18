"""Where is a family's weapon closest to a body? Prints, per volume, the tightest frames across all clips.

    python bone-motion/engine/tight.py mounted_blade [limit_px]
"""
import importlib, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import render
from overview import solve

if __name__ == '__main__':
    family = sys.argv[1]; limit = float(sys.argv[2]) if len(sys.argv) > 2 else 2.0
    mod = importlib.import_module('clips.' + family); found = {}
    for cid in mod.CLIPS:
        m, clip, rig, frames = solve(family, cid); butt, tip = rig.weapon_ends
        for i, j in enumerate(frames):
            for name, a, b, radius in rig.volumes(j):
                c = render.seg_seg(j[butt], j[tip], a, b) - radius - 1.6
                if c < limit: found.setdefault(name, []).append((round(c, 1), cid, i + 1))
    for name, items in found.items():
        items.sort(); print('%-18s %d frames under %.1fpx; tightest: %s' % (name, len(items), limit, items[:8]))
    if not found: print('nothing under %.1fpx' % limit)
