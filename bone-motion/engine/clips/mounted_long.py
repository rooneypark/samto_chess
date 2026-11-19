"""Long pole weapons on horseback: 여포's 202 px halberd, 마초's and 공손찬's 195 px spears.

The mounted bones carry a 148 px glaive or a 140 px spear and send its tip to the common hit point 100 px ahead. These
three drawings have a weapon about 55 px longer. Two ways were tried on the standard clips (2026-11-19):
  - hands where the bone has them, the extra length beyond the tip: the point runs 30 px off the canvas in every
    strike, a swing as much as a thrust (measured for every clip of the family);
  - the tip where the bone has it, the hands moved up to mid-shaft ("slide"): nothing is cut, but it reads as a pole
    held short (user: 'like holding a bat short'), and PixelLab drew the head on the wrong end of the pole.
User decision: swings, not thrusts; the grip stays long; nothing may be cut.

So the weapon here has its real length in the bone, and the hands do what a rider with a long pole does:
  1. as the head goes out in front, the hands stay back (by `pull`) and slip a little up the shaft (the rest), so the
     head lands ON the hit point instead of past it;
  2. where the pole would still leave the 256 canvas (lifted straight up, or hanging far behind), the hands slip along
     the shaft just far enough to keep both ends inside, and no further. That is the only time the grip shortens.
In the ready pose nothing changes: the grip is the bone's.

    build(base module, total length, pull, canvas shift) -> (WEAPON, convert, clip, spin)
"""
import math
import cavalry
from samto_motion import add, mul, unit, project

MARGIN = 7.0      # key poses are fitted with this much room: the frames in between swing a little wider than their keys

def build(base, total, pull, shift, pulls=None):
    grip = base.WEAPON.main_socket; reach = base.WEAPON.total - grip; extra = total - base.WEAPON.total
    weapon = cavalry.Glaive(total=total, main_socket=grip, collar=total - (base.WEAPON.total - base.WEAPON.collar))
    def outside(main, ax, socket):
        worst = 0.0
        for along in (0.0, total):
            v = add(main, mul(ax, along - socket))
            for view in ('front', 'left', 'rear'):
                x, y, _ = project(view, v); x += shift[view][0]; y += shift[view][1]
                worst = max(worst, MARGIN - x, x - (256 - MARGIN), MARGIN - y, y - (256 - MARGIN))
        return worst
    def fit(q):
        """Slip the hands along the shaft by the least amount that brings both ends of the pole inside the canvas."""
        ax = unit(q['axis']); s0 = q['socket']
        if outside(q['main'], ax, s0) <= 0: return q
        best = min((outside(q['main'], ax, s0 + d), abs(d), d) for d in range(-30, 91, 2))
        ok = [d for d in range(-30, 91, 2) if outside(q['main'], ax, s0 + d) <= 0]
        d = min(ok, key=abs) if ok else best[2]
        q = dict(q); q['socket'] = s0 + d; q['support'] = q.get('support', 30.0) - d; return q      # the support hand keeps its distance from the main hand
    def convert(p, how=None):
        ax = unit(p['axis']); tip_y = p['main'][1] + ax[1] * reach; pl = pull if how is None else how
        w = max(0.0, min(1.0, (tip_y - 45.0) / 40.0)); w = w * w * (3 - 2 * w)      # 0 while the head is up or behind, 1 from 85 px ahead
        q = dict(p); q['main'] = add(p['main'], mul(ax, -pl * w)); q['socket'] = p.get('socket', grip) + (extra - pl) * w
        if w > 0.1: q['support_on'] = 0.0      # the left hand cannot follow hands that stay this far back; it lets go as the blow goes out
        return fit(q)
    def clip(c, title, notes=None, how=None):
        out = dict(c, title=title)
        if 'poses' in c: out['poses'] = [convert(p, how) for p in c['poses']]
        else: out['keys'] = [(i, convert(p, how), ease) for i, p, ease in c['keys']]
        if notes: out['notes'] = notes
        return out
    tilt = math.radians(20.0)
    def two(socket, gap=13.0): return grip - (socket - gap)      # Glaive counts the support hand from the bone's own grip: this puts it `gap` px below the main hand
    def ring(theta, **kw):
        """Both hands together at mid-shaft, at arm's length above the head; theta = where the head points: 0 ahead, 90 to
        the rider's right. The disc is tilted down in front, so the head passes low ahead and the butt high behind."""
        a = math.radians(theta); axis = (-math.sin(a), math.cos(a) * math.cos(tilt), -math.cos(a) * math.sin(tilt)); sock = total / 2 + 6
        b = dict(h_root=(0, 0, 62.4), seat=(0, 0, 2), chest_lean=3.0, main=(-1, 3, 150), axis=axis, support=two(sock, 8.0), support_on=1.0, socket=sock)
        b.update(kw); return fit(base.pose(**b))
    G = convert(base.GUARD)
    lift = fit(base.pose(h_root=(0, -2, 62.6), seat=(0, 0, 1), chest_lean=0.0, main=(-36, 8, 118), axis=(0.30, 0.12, 0.946), support=two(grip + 12, 20), support_on=0.0, socket=grip + 12))      # leaned in over the head: upright it is taller than the canvas, and its butt would pass the rider's leg
    over = fit(base.pose(h_root=(0, -2, 62.4), seat=(0, 0, 1.5), chest_lean=0.0, main=(-12, 5, 142), axis=(-0.03, -0.62, 0.78), support=two(total / 2 - 8, 16), support_on=1.0, socket=total / 2 - 8))
    spin = dict(title='두 손 돌려치기', impact=8, overhead=True,
                keys=[(0, G, 'linear'), (2, lift, 'inout'), (3, over, 'inout'), (4, ring(180), 'inout'), (5, ring(250, chest_turn=10), 'linear'), (6, ring(315, chest_turn=12), 'linear'),
                      (7, ring(360, chest_lean=8, h_root=(0, 3, 61.8), neck=-6), 'linear'), (8, ring(60, chest_turn=-12, chest_lean=6), 'linear'), (9, ring(125, chest_turn=-12), 'linear'),
                      (10, ring(180), 'out'), (11, over, 'inout'), (12, lift, 'inout'), (14, G, 'out')],
                support=[('FL', 'FR', 'HL', 'HR')] * 15, durations=[100, 90, 90, 80, 70, 55, 45, 70, 60, 60, 80, 110, 100, 90, 100], sheet=[0, 4, 6, 7, 8, 10])
    return weapon, convert, clip, spin
