"""How different are the attacks and skills of one type from each other?  (free, bone only)

    python -X utf8 bone-motion/engine/variety.py [type ...]

Two clips that differ only in timing or in a few degrees of wind-up come out of PixelLab looking like the same attack
(Zhao Yun 2026-11-19: four mounted clips, one thrust). For every pair of clips of a type this prints the average distance,
over the 15 frames, of the points a viewer follows: weapon tip and butt, both hands, head, and the body root. Timing is
ignored on purpose: frames are compared after each clip is resampled by how far along its own motion it is.

    under 9 px   거의 같은 동작으로 보인다        9-16 px   비슷하다        over 16 px   다른 동작
"""
import math, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm
from overview import solve, FAMILIES

SAME, CLOSE = 9.0, 16.0
def points(rig, j):
    get = lambda *names: next(j[n] for n in names if n in j)
    out = [get('r_hand.R', 'hand.R'), get('r_hand.L', 'hand.L'), get('r_head', 'head'), get('h_body_root', 'pelvis')]
    if getattr(rig, 'weapon_ends', None): out += [j[rig.weapon_ends[0]], j[rig.weapon_ends[1]], j[rig.weapon_ends[1]]]      # the tip counts twice: it is what the eye follows
    if 'h_fore_hoof.L' in j: out += [j['h_fore_hoof.L'], j['h_fore_hoof.R'], j['h_poll']]
    else: out += [j['ankle.L'], j['ankle.R']]
    return out

def track(family, clip_id):
    m, clip, rig, frames = solve(family, clip_id); pts = [points(rig, j) for j in frames]
    # resample by arc length so a slow and a fast version of the same move coincide
    step = [0.0] + [sum(sm.length(sm.sub(a, b)) for a, b in zip(pts[i], pts[i - 1])) for i in range(1, len(pts))]
    total = sum(step) or 1.0; at = [sum(step[:i + 1]) / total for i in range(len(pts))]; out = []
    for k in range(24):
        t = k / 23.0; i = max(1, next((n for n, v in enumerate(at) if v >= t), len(at) - 1)); span = (at[i] - at[i - 1]) or 1.0; w = (t - at[i - 1]) / span
        out.append([sm.lerp(a, b, min(1.0, max(0.0, w))) for a, b in zip(pts[i - 1], pts[i])])
    return out, clip['title']

def distance(a, b):
    return sum(sum(sm.length(sm.sub(p, q)) for p, q in zip(fa, fb)) / len(fa) for fa, fb in zip(a, b)) / len(a)

def report(family):
    m = __import__('importlib').import_module('clips.' + family); ids = [c for c in m.CLIPS if c not in ('idle', 'move')]
    tr = {c: track(family, c) for c in ids}; pairs = sorted((distance(tr[a][0], tr[b][0]), a, b) for i, a in enumerate(ids) for b in ids[i + 1:])
    same = [p for p in pairs if p[0] < SAME]; close = [p for p in pairs if SAME <= p[0] < CLOSE]
    print('\n%s (%s): %d클립, 쌍 %d개 중 거의 같음 %d, 비슷함 %d' % (m.TITLE, family, len(ids), len(pairs), len(same), len(close)))
    for d, a, b in same: print('   거의 같음 %4.1fpx  %s  ↔  %s' % (d, tr[a][1], tr[b][1]))
    for d, a, b in close: print('   비슷함   %4.1fpx  %s  ↔  %s' % (d, tr[a][1], tr[b][1]))
    return len(same), len(close), len(pairs)

if __name__ == '__main__':
    tot = [0, 0, 0]
    for family in sys.argv[1:] or FAMILIES:
        r = report(family); tot = [a + b for a, b in zip(tot, r)]
    print('\n합계: 쌍 %d개 중 거의 같음 %d, 비슷함 %d' % (tot[2], tot[0], tot[1]))
