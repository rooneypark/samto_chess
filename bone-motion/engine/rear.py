"""후면 전용 본 (rear-only bone variant).

The fighting guard is bladed: the chest is turned 30-50 degrees. The approved back drawings are square to the camera,
and asking PixelLab to redraw a square back as a turned one made the body and the face swing round toward the camera
(Zhang Fei, docs/2026-11-19-zhangfei-motion-handoff.md, cause 1). The front and side keep the confirmed guard untouched.
For the REAR view only, the torso turn is measured from the guard instead of from straight ahead:

    turn' = max(0, turn - guard_turn)   for turn >= 0      (guard -> 0, a wind-up beyond the guard keeps its extra turn)
    turn' = turn                        for turn <  0      (follow-through past square is unchanged)

Hands, weapon and feet keep their positions, so the strike still lands on the common hit point; only the shoulder and
hip lines square up. Every frame is re-solved and re-checked (arm reach, weapon against torso and head).

    python -X utf8 bone-motion/engine/rear.py            check every type and clip
"""
import importlib, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm, render

LIMIT = 20.0      # a guard turned less than this is drawn from the plain bone

def _module(family): return importlib.import_module('clips.' + family)

def _rig(m):
    neutral = os.path.join(sm.WORK, 'inputs', 'request', m.BODY)
    return m.rig(neutral) if hasattr(m, 'rig') else render.FootRig(sm.Body(neutral), m.WEAPON)

def _poses(clip): return clip['poses'] if 'poses' in clip else sm.timeline(clip['keys'])

def guard_turn(family):
    m = _module(family); p = _poses(m.CLIPS['idle'])[0]
    return (p.get('hip_turn', 0.0), p.get('chest_turn', 0.0)) if 'chest_turn' in p else None

def needed(family):
    g = guard_turn(family); return bool(g) and abs(g[1]) > LIMIT

def square(v, g):
    if g < 0: return -square(-v, -g)
    return max(0.0, v - g) if v >= 0 else v

CARRY = ('rear', 'bow')      # pose keys that place a two-handed weapon; these may be drawn in toward the body
PULL = 12.0                  # px a weapon may move toward the shoulder that cannot reach it

def _squared(p, g, keep, pull=(0.0, 0.0, 0.0)):
    """One pose with the guard turn taken out, except for the fraction `keep` (0 = fully square, 1 = original), and the
    weapon moved by `pull`."""
    q = dict(p); k = 1.0 - keep
    q['hip_turn'] = square(p['hip_turn'], g[0] * k); q['chest_turn'] = square(p['chest_turn'], g[1] * k)
    if 'head_turn' in p: q['head_turn'] = square(p['head_turn'], g[1] * 0.15 * k)
    for key in CARRY:
        if key in p: q[key] = sm.add(p[key], pull)
    return q

def _wrong(rig, q):
    """Reach problems, plus the weapon passing through the torso or head."""
    j, issues = rig.solve(q); issues = list(issues)
    if getattr(rig, 'weapon_ends', None) and not getattr(rig, 'flexible', False):
        butt, tip = rig.weapon_ends
        issues += ['weapon in ' + name for name, a, b, radius in rig.volumes(j) if render.seg_seg(j[butt], j[tip], a, b) - radius - 1.6 < 0]
    return j, issues

def _fit(rig, p, g):
    """Smallest change that lets every hand and foot reach with the body square: first draw the weapon in toward the
    short arm (up to PULL px), and only if that is not enough keep part of the original turn."""
    j, issues = _wrong(rig, _squared(p, g, 0.0))
    if not issues: return 0.0, (0.0, 0.0, 0.0)
    if any(k in p for k in CARRY) and all(' hand ' in s for s in issues):
        side = 'L' if any(s.startswith('L hand') for s in issues) else 'R'
        d = sm.unit(sm.sub(j['shoulder.' + side], j['hand.' + side])); step = 1.0
        while step <= PULL:
            pull = sm.mul(d, step)
            if not _wrong(rig, _squared(p, g, 0.0, pull))[1]: return 0.0, pull
            step += 1.0
    k = 0.1
    while k < 1.0 and _wrong(rig, _squared(p, g, k))[1]: k = round(k + 0.1, 2)
    return k, (0.0, 0.0, 0.0)

def _spread(values, ends_fixed):
    n = len(values); wide = [max(values[max(0, i - 1):i + 2]) for i in range(n)]
    out = [max(values[i], (wide[max(0, i - 1)] + wide[i] + wide[min(n - 1, i + 1)]) / 3.0) for i in range(n)]
    if ends_fixed: out[0], out[-1] = values[0], values[-1]
    return out

def poses(family, clip_id):
    """Squared poses; the kept turn and the pull are spread over neighbouring frames so nothing twitches.
    -> (poses, kept fraction per frame, pull px per frame)"""
    m = _module(family); g = guard_turn(family); rig = _rig(m); src = _poses(m.CLIPS[clip_id])
    fits = [_fit(rig, p, g) for p in src]; ends = not m.CLIPS[clip_id].get('treadmill')
    keep = _spread([f[0] for f in fits], ends)
    pulls = list(zip(*[_spread([abs(f[1][a]) for f in fits], ends) for a in range(3)]))
    sign = lambda f, a: -1.0 if f[1][a] < 0 else 1.0
    ref = [next((f for f in fits if sm.length(f[1]) > 0), fits[0])] * len(fits)      # one direction for the whole clip
    pulls = [tuple(pulls[i][a] * sign(fits[i] if sm.length(fits[i][1]) > 0 else ref[i], a) for a in range(3)) for i in range(len(fits))]
    out = []
    for p, k, pull in zip(src, keep, pulls):
        q = _squared(p, g, k, pull); extra = 0.0
        while _wrong(rig, q)[1] and k + extra < 1.0: extra = round(extra + 0.05, 2); q = _squared(p, g, min(1.0, k + extra), pull)
        if _wrong(rig, q)[1]: q = dict(p)      # nothing squared works for this frame: the original pose, which already passed
        out.append(q)
    return out, keep, [round(sm.length(x), 1) for x in pulls]

def solve(family, clip_id):
    """Same return shape as overview.solve, plus what is left to look at: (module, clip, rig, frames, problems, kept)."""
    m = _module(family); clip = m.CLIPS[clip_id]; rig = _rig(m); ps, kept, pulled = poses(family, clip_id); frames = []; problems = []
    for i, p in enumerate(ps):
        j, issues = rig.solve(p); frames.append(j); problems += ['%d번: %s' % (i + 1, x) for x in issues]
    if hasattr(rig, 'post'): rig.post(frames, ps)
    if getattr(rig, 'weapon_ends', None) and not getattr(rig, 'flexible', False):
        butt, tip = rig.weapon_ends
        for i, j in enumerate(frames):
            for name, a, b, radius in rig.volumes(j):
                if render.seg_seg(j[butt], j[tip], a, b) - radius - 1.6 < 0: problems.append('%d번: 무기가 %s 관통' % (i + 1, name))
    return m, clip, rig, frames, problems, kept, pulled, ps

if __name__ == '__main__':
    from overview import FAMILIES
    total = bad = 0
    for family in FAMILIES:
        g = guard_turn(family)
        if g is None: print('%-14s 기마: 몸통 회전 키가 달라 대상 아님' % family); continue
        if not needed(family): print('%-14s 가슴 %2.0f°: 원래 본 그대로' % (family, abs(g[1]))); continue
        m = _module(family); fails = []; worst = rest = far = 0.0
        for clip_id in m.CLIPS:
            total += 1
            try: r = solve(family, clip_id); problems = r[4]; worst = max(worst, max(r[5]) * abs(g[1])); rest = max(rest, r[5][0] * abs(g[1])); far = max(far, max(r[6]))
            except Exception as e: problems = ['%s: %s' % (type(e).__name__, e)]
            if problems: bad += 1; fails.append('%s(%s)' % (clip_id, '; '.join(problems[:2]) + (' 외 %d' % (len(problems) - 2) if len(problems) > 2 else '')))
        print('%-14s 가슴 %2.0f° → 대기 %2.0f° (동작 중 최대 %2.0f° 남김, 무기 최대 %.0fpx 당김): %d클립 중 문제 %d' % (family, abs(g[1]), rest, worst, far, len(m.CLIPS), len(fails)) + ''.join('\n    ' + f for f in fails))
    print('\n합계 %d클립 중 문제 %d' % (total, bad))
