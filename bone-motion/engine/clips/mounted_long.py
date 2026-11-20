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

    build(base module, total length, pull, canvas shift) -> (WEAPON, convert, clip, spin, golf)
"""
import math
import cavalry
from samto_motion import add, mul, unit, project, length

SLANT = False      # 2026-11-20: off again. With the weapons shortened to 175 / 170 px the upright ready pose fits the canvas, and the user keeps the ready poses as drawn
READY = (0.04, 0.58, 0.81)      # the slanted ready pose: head forward and up, about 54 degrees from level
MARGIN = 7.0      # key poses are fitted with this much room: the frames in between swing a little wider than their keys

def build(base, total, pull, shift, pulls=None):
    return build_with_launcher(base, total, pull, shift, pulls)[:4]

def build_all(*a, **kw):
    """(WEAPON, convert, clip, spin, golf, twin, musou)"""
    return _build(*a, **kw)


def build_with_launcher(*a, **kw):
    return _build(*a, **kw)[:5]

def _build(base, total, pull, shift, pulls=None, grip=None, cut=None):
    """grip: where the main hand holds, from the butt (default: the base bone's). cut: if given, the hand never slips along the
    shaft in a blow, and elsewhere only when an end of the pole would leave the canvas by more than `cut` px (여포: user
    2026-11-20, 'hold the halberd as long as it can be held'; a weapon cut off a little at the edge is accepted)."""
    reach = base.WEAPON.total - base.WEAPON.main_socket; grip = base.WEAPON.main_socket if grip is None else grip; extra = total - grip - reach
    margin = MARGIN if cut is None else -cut
    weapon = cavalry.Glaive(total=total, main_socket=grip, collar=total - (base.WEAPON.total - base.WEAPON.collar))
    def outside(main, ax, socket):
        worst = 0.0
        for along in (0.0, total):
            v = add(main, mul(ax, along - socket))
            for view in ('front', 'left', 'rear'):
                x, y, _ = project(view, v); x += shift[view][0]; y += shift[view][1]
                worst = max(worst, margin - x, x - (256 - margin), margin - y, y - (256 - margin))
        return worst
    def fit(q):
        """Slip the hands along the shaft by the least amount that brings both ends of the pole inside the canvas."""
        ax = unit(q['axis']); s0 = q['socket']
        if outside(q['main'], ax, s0) <= 0: return q
        if cut is not None:      # held long: first lay the pole over instead of letting the hand slip (user: no re-gripping). Least tilt that fits.
            flat = (ax[0], ax[1], 0.0); own = unit(flat) if length(flat) > 0.15 else (0.0, -1.0, 0.0)
            for t in (0.15, 0.3, 0.45, 0.6, 0.8, 1.0, 1.3):
                for lean in (own, (0.0, -1.0, 0.0), (-0.45, -0.89, 0.0), (0.0, 1.0, 0.0)):
                    a2 = unit(add(ax, mul(lean, t)))
                    if outside(q['main'], a2, s0) <= 0: q = dict(q); q['axis'] = a2; return q
        best = min((outside(q['main'], ax, s0 + d), abs(d), d) for d in range(-30, 91, 2))
        ok = [d for d in range(-30, 91, 2) if outside(q['main'], ax, s0 + d) <= 0]
        d = min(ok, key=abs) if ok else best[2]
        q = dict(q); q['socket'] = s0 + d; q['support'] = q.get('support', 30.0) - d; return q      # the support hand keeps its distance from the main hand
    # The ready pose (user, 2026-11-20, for all three riders): the pole is not carried upright, where its head tops the canvas
    # in the side and rear views for the whole idle, but slanted, head forward and up. Every pose that is still near the
    # base bone's ready pose is turned by the same amount, less the further the pole has already left that pose.
    g_old = unit(base.GUARD['axis']); g_new = unit(READY) if (cut is not None and SLANT) else g_old
    def ready(axis):
        a = unit(axis); c = max(-1.0, min(1.0, a[0] * g_old[0] + a[1] * g_old[1] + a[2] * g_old[2])); near = max(0.0, 1.0 - math.acos(c) / 0.5)
        if near <= 0 or g_new == g_old: return a
        k = unit((g_old[1] * g_new[2] - g_old[2] * g_new[1], g_old[2] * g_new[0] - g_old[0] * g_new[2], g_old[0] * g_new[1] - g_old[1] * g_new[0]))
        th = math.acos(max(-1.0, min(1.0, sum(x * y for x, y in zip(g_old, g_new))))) * near; kv = (k[1] * a[2] - k[2] * a[1], k[2] * a[0] - k[0] * a[2], k[0] * a[1] - k[1] * a[0]); kd = sum(x * y for x, y in zip(k, a))
        return unit(tuple(a[i] * math.cos(th) + kv[i] * math.sin(th) + k[i] * kd * (1 - math.cos(th)) for i in range(3)))
    def convert(p, how=None):
        tip_y = p['main'][1] + unit(p['axis'])[1] * reach      # how far forward the base bone's blade is: measured before the ready pose is slanted
        p = dict(p, axis=ready(p['axis']))
        ax = unit(p['axis']); pl = pull if how is None else how
        w = max(0.0, min(1.0, (tip_y - 45.0) / 40.0)); w = w * w * (3 - 2 * w)      # 0 while the head is up or behind, 1 from 85 px ahead
        q = dict(p); q['main'] = add(p['main'], mul(ax, -pl * w)); q['socket'] = (p.get('socket', base.WEAPON.main_socket) - base.WEAPON.main_socket + grip) + (0.0 if cut is not None else (extra - pl) * w)
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
    # ---- 쳐올리기: the launcher (user, 2026-11-19/20: 'the enemy in front is thrown into the air with the halberd. Think of a
    # baseball swing: the arm straight, one strong swing, the head not turning. No turning the pole round, no changing the grip').
    # One hand, the ready pose's grip all the way. The head of the weapon is let down behind on the right with the body wound
    # right, then one swing: low along the ground, up through the target, and on up to the other shoulder with the arm straight.
    # A weapon end may leave the canvas a little in a swing like this (snappy.py CUT).
    def P(main, axis, **kw):
        b = dict(main=main, axis=unit(axis), socket=G['socket'], support_on=0.0); b.update(kw); return fit(base.pose(**b)) if cut is not None else base.pose(**b)      # held long: laid over where it would top the canvas
    golf = dict(title='쳐올리기', impact=8,
                keys=[(0, G, 'linear'),
                      (2, P((-40, 8, 100), (-0.20, -0.75, -0.63), h_root=(0, -2, 62.4), chest_turn=14), 'inout'),                                      # the head goes down behind
                      (4, P((-44, -2, 108), (-0.34, -0.72, -0.61), h_root=(0, -4, 61.8), h_pitch=1.5, seat=(0, 0, 2), chest_turn=34, chest_lean=6), 'inout'),      # wound right, the head on the ground behind
                      (5, P((-44, -3, 108), (-0.36, -0.70, -0.62), h_root=(0, -4.5, 61.6), h_pitch=2, seat=(0, 0, 2), chest_turn=38, chest_lean=7), 'out'),
                      (6, P((-46, -6, 118), (-0.66, 0.25, -0.71), h_root=(0, 0, 61.4), h_pitch=-1, seat=(0, 0.5, 2.5), chest_turn=14, chest_lean=8), 'in'),      # low round the right side: straight down it would go into the ground
                      (7, P((-43, -13, 128), (0.30, 0.77, -0.57), h_root=(0, 5, 61.2), h_pitch=-3.5, seat=(0, 1, 3), chest_turn=-10, chest_lean=10), 'in'),        # up through the target
                      (8, P((-34, 2, 132), (0.28, 0.72, 0.63), h_root=(0, 5, 61.6), h_pitch=-2.5, seat=(0, 1, 3), chest_turn=-30, chest_lean=-2), 'snap'),          # the arm straight, the head going up
                      (9, P((-30, 6, 126), (0.22, 0.70, 0.68), h_root=(0, 3, 62.2), h_pitch=-1, seat=(0, 0, 2.5), chest_turn=-26, chest_lean=-4), 'out'),
                      (10, P((-30, 6, 127), (0.21, 0.68, 0.70), h_root=(0, 2.5, 62.4), seat=(0, 0, 2), chest_turn=-25, chest_lean=-4), 'inout'),
                      (12, P((-33, 8, 92), (0.03, 0.40, 0.916), h_root=(0, 1, 62.8), chest_turn=-3), 'inout'), (14, G, 'out')],
                support=[('FL', 'FR', 'HL', 'HR')] * 15, durations=[100, 90, 100, 120, 150, 60, 45, 40, 190, 150, 100, 90, 90, 90, 100], sheet=[0, 4, 6, 7, 8, 9])
    # ---- 좌우 내려베기 (user, 2026-11-20: 'showy means: look at how the 무쌍 games do it and make it properly'). What a rider with a
    # long weapon does there, as far as the written move lists describe it, is cut down on one side of the horse, carry the
    # weapon over the horse's neck and cut down on the other side. Our own clip of that idea: one hand, the ready grip.
    twin = dict(title='좌우 내려베기', impact=6, impact2=10,
                keys=[(0, G, 'linear'),
                      (1, P((-40, 8, 100), (-0.04, -0.10, 0.99), h_root=(0, -1, 62.8), chest_turn=6), 'inout'),      # out to the side first: the butt clears the leg
                      (2, P((-42, 2, 118), (-0.10, -0.55, 0.83), h_root=(0, -2, 62.4), chest_turn=18, chest_lean=-3), 'inout'),
                      (4, P((-34, -4, 126), (-0.12, -0.72, 0.68), h_root=(0, -4, 61.8), h_pitch=2, seat=(0, 0, 3), chest_turn=30, chest_lean=-7), 'out'),          # back over the right shoulder
                      (5, P((-40, -8, 124), (0.07, 0.77, -0.63), h_root=(0, 5, 61.2), h_pitch=-3, seat=(0, 1, 3), chest_turn=-12, chest_lean=13), 'snap'),          # down on the right
                      (6, P((-38, -6, 120), (0.12, 0.70, -0.70), h_root=(0, 5, 61.2), h_pitch=-3, seat=(0, 1, 3), chest_turn=-16, chest_lean=14), 'out'),
                      (7, P((-26, 6, 130), (0.35, 0.75, 0.56), h_root=(0, 1, 62), seat=(0, 0, 3), chest_turn=-4, chest_lean=0), 'inout'),                           # swept up across the front, above the horse's head
                      (8, P((-24, 8, 136), (0.62, 0.30, 0.72), h_root=(0, -3, 61.8), h_pitch=2, seat=(0, 0, 3), chest_turn=-7, chest_lean=-2), 'out'),             # high on the left
                      (9, P((-22, 12, 128), (0.58, 0.62, -0.52), neck=-16, head=-8, h_root=(0, 5, 61.2), h_pitch=-3, seat=(0, 1, 3), chest_turn=12, chest_lean=12), 'snap'),            # down on the left
                      (10, P((-22, 12, 127), (0.57, 0.61, -0.55), neck=-18, head=-9, h_root=(0, 5, 61.2), h_pitch=-3, seat=(0, 1, 3), chest_turn=15, chest_lean=13), 'out'),
                      (12, P((-20, 8, 110), (0.02, 0.50, 0.86), h_root=(0, 1, 62.6), chest_turn=4), 'inout'), (14, G, 'out')],
                support=[('FL', 'FR', 'HL', 'HR')] * 15, durations=[100, 90, 100, 110, 150, 40, 150, 90, 130, 40, 190, 100, 90, 90, 100], sheet=[0, 4, 5, 7, 8, 9])
    # ---- 무쌍: the overhead turn, then the weapon is driven into the ground in front (the move lists end such a flurry with a slam)
    slam = fit(base.pose(h_root=(0, 5, 61.0), h_pitch=-4, seat=(0, 1, 3), chest_lean=14.0, neck=-10, main=(-30, 10, 114), axis=unit((0.12, 0.62, -0.775)), support_on=0.0, socket=G['socket']))
    musou = dict(spin, title='무쌍', impact=8, impact2=12,
                 keys=[k for k in spin['keys'] if k[0] <= 10] + [(11, slam, 'snap'), (12, slam, 'linear'), (14, G, 'inout')],
                 durations=[100, 90, 90, 80, 70, 55, 45, 70, 60, 60, 130, 40, 200, 110, 100], sheet=[0, 4, 7, 9, 11, 13])
    return weapon, convert, clip, spin, golf, twin, musou
