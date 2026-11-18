"""Where does each attack land? Prints the weapon tip at the impact (and arrive) frame against the common strike point.

    python bone-motion/engine/hitpoint.py [family ...]
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm
from overview import solve, FAMILIES

STRIKE = (0.0, 100.0, 45.0)      # centre of the tile in front, chest height of a standing target

if __name__ == '__main__':
    for f in sys.argv[1:] or FAMILIES:
        import importlib; mod = importlib.import_module('clips.' + f); cid = 'a1' if 'a1' in mod.CLIPS else 's1'
        m, clip, rig, frames = solve(f, cid)
        if not rig.weapon_ends: continue
        tip = 'arrow_tip' if 'arrow_tip' in frames[0] else rig.weapon_ends[1]
        for key in ('impact', 'arrive'):
            if clip.get(key):
                v = frames[clip[key] - 1][tip]
                print('%-14s %-7s f%02d tip (%6.1f, %6.1f, %6.1f)  off %5.1fpx' % (f, key, clip[key], v[0], v[1], v[2], sm.length(sm.sub(v, STRIKE))))
        extra = [k for k in frames[0] if k.endswith('_tip') or k.startswith('arrow')]
        print('               joints:', extra)
