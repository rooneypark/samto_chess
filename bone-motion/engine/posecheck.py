"""Find poses that cannot be: a weapon through a leg or an arm, a hand inside the body, crossed legs, a weapon in the ground.

    python bone-motion/engine/posecheck.py            the idle pose of every type
    python bone-motion/engine/posecheck.py --all      every frame of every clip (slow, prints the worst per clip)

The build's own check looks at the weapon against torso and head. This one also looks at thighs, shins, arms, the
horse's legs, and at the body against itself. Clearance is the gap between the surfaces in px; below 0 they overlap.
"""
import importlib, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm, render
from overview import solve, FAMILIES

SHAFT = 1.6

def capsules(j, rig):
    """Body volumes as (name, a, b, radius). Foot rig and rider share names with an optional r_ prefix."""
    pre = 'r_' if 'r_pelvis' in j else ''; g = lambda n: j[pre + n]; r = getattr(getattr(rig, 'body', None), 'r', None) or dict(torso=12.0, head=18.5, upper=5.0, fore=4.5, thigh=6.5, shin=5.5)
    out = [('몸통', g('pelvis'), g('chest'), r['torso']), ('머리', g('head'), g('head'), r['head'])]
    for s, ko in (('L', '왼'), ('R', '오른')):
        out += [(ko + ' 위팔', g('shoulder.' + s), g('elbow.' + s), r['upper']), (ko + ' 아래팔', g('elbow.' + s), g('wrist.' + s), r['fore']),
                (ko + ' 허벅지', g('hip.' + s), g('knee.' + s), r['thigh']), (ko + ' 정강이', g('knee.' + s), g('ankle.' + s), r['shin'])]
    if pre:
        out += [('말 몸통', j['h_croup'], j['h_chest'], 15.0), ('말 목', j['h_withers'], j['h_poll'], 8.0), ('말 머리', j['h_poll'], j['h_muzzle'], 6.5)]
        for s, ko in (('L', '왼'), ('R', '오른')):
            out += [('말 %s 앞다리' % ko, j['h_fore_shoulder.' + s], j['h_fore_fetlock.' + s], 4.0), ('말 %s 뒷다리' % ko, j['h_hind_hip.' + s], j['h_hind_hock.' + s], 4.5)]
    return out

def weapon_segments(j, rig):
    w = getattr(rig, 'weapon', None); segs = getattr(w, 'segments', []) if w else []
    return [(a, b, render.RADIUS.get(kind, SHAFT)) for a, b, kind in segs if kind not in ('string', 'arrow', 'chain', 'weight') and a in j and b in j]

def holding(j, a, b, pre):
    """Which hands are on this weapon segment (within 4 px of it): their forearm may touch it."""
    out = set()
    for s, ko in (('L', '왼'), ('R', '오른')):
        if render.seg_seg(j[a], j[b], j[pre + 'hand.' + s], j[pre + 'hand.' + s]) < 6.0: out.add(ko)
    return out

def problems(j, rig):
    pre = 'r_' if 'r_pelvis' in j else ''; caps = capsules(j, rig); found = []
    for a, b, wr in weapon_segments(j, rig):
        hands = holding(j, a, b, pre)
        for name, p, q, r in caps:
            if any(name.startswith(h) and ('아래팔' in name) for h in hands): continue            # the forearm of a hand that holds it
            gap = render.seg_seg(j[a], j[b], p, q) - r - wr
            if any(name.startswith(h) and ('위팔' in name) for h in hands): gap += 3.0              # the upper arm of that hand may come close
            found.append((gap, '무기(%s)와 %s' % (a.split('_')[0], name)))
        low = min(j[a][2], j[b][2])
        if low < 0: found.append((low, '무기(%s)가 땅 아래로' % a.split('_')[0]))
    by = {n: (p, q, r) for n, p, q, r in caps}
    for s in ('왼', '오른'):                                                                      # a forearm buried in the torso or the head
        p, q, r = by[s + ' 아래팔']
        for other in ('몸통', '머리'):
            o = by[other]; found.append((render.seg_seg(p, q, o[0], o[1]) - r - o[2] + 5.0, '%s 아래팔과 %s' % (s, other)))   # 5 px of overlap is a hand resting on the body
    a, b = by['왼 정강이'], by['오른 정강이']; found.append((render.seg_seg(a[0], a[1], b[0], b[1]) - a[2] - b[2], '두 정강이'))
    a, b = by['왼 허벅지'], by['오른 정강이']; found.append((render.seg_seg(a[0], a[1], b[0], b[1]) - a[2] - b[2] + 2.0, '왼 허벅지와 오른 정강이'))
    a, b = by['오른 허벅지'], by['왼 정강이']; found.append((render.seg_seg(a[0], a[1], b[0], b[1]) - a[2] - b[2] + 2.0, '오른 허벅지와 왼 정강이'))
    return sorted(found)

if __name__ == '__main__':
    every = '--all' in sys.argv; names = [a for a in sys.argv[1:] if not a.startswith('--')] or FAMILIES; bad = 0
    for f in names:
        mod = importlib.import_module('clips.' + f)
        for cid in (mod.CLIPS if every else ['idle']):
            m, clip, rig, frames = solve(f, cid); worst = {}
            for i, j in enumerate(frames if every else frames[:1]):
                for gap, what in problems(j, rig):
                    if gap < 0 and (what not in worst or gap < worst[what][0]): worst[what] = (gap, i + 1)
            line = '; '.join('%s %.1fpx%s' % (w, g, ' (%d번)' % n if every else '') for w, (g, n) in sorted(worst.items(), key=lambda x: x[1]))
            if worst: bad += 1
            if worst or not every: print('%-14s %-5s %s' % (mod.TITLE, cid, ('겹침: ' + line) if worst else '이상 없음'))
            if not every and not worst:
                near = [x for x in problems(frames[0], rig) if x[0] < 2.0]
                if near: print('               가까움(2px 미만): ' + '; '.join('%s %.1fpx' % (w, g) for g, w in near))
    print('겹침이 있는 클립:', bad)
