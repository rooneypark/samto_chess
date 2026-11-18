"""기마 월도·화극 (mounted glaive). The right hand is the main hand; the left hand holds the reins and comes to the
shaft only to support the wind-up, then lets go as the blade comes down (a declared release: from the saddle the left
arm cannot follow a cut that finishes low on the right side). The weapon stays on the horse's right side and never
crosses the horse's neck or the rider.

The horse is part of the attack, not a pedestal: it settles back while the rider winds up, lifts its right fore
hoof as the blade comes over, and plants it forward on the frame the blade lands, with the neck reaching down.
"""
import cavalry

TITLE = '기마 월도'
BODY = 'samto-body-cavalry-neutral.json'
# Long grip (user review 2026-11-18: held too short, so the swing was small). The main hand is 55 px from the butt
# of a 148 px glaive, the support hand 30 px below it: 93 px of weapon swing beyond the hands, like a foot spearman's
# grip. With the hands close together near the butt, both stay on the shaft through the whole cut.
WEAPON = cavalry.Glaive(total=148.0, main_socket=55.0, collar=112.0)
def rig(neutral): return cavalry.CavalryRig(neutral, WEAPON)

def pose(**kw):
    base = dict(h_root=(0, 0, 63), h_pitch=0.0, neck=0.0, head=0.0, FL=(14, 28, 0), FR=(-14, 28, 0), HL=(16, -29, 0), HR=(-16, -29, 0),
                seat=(0, 0, 0), hip_turn=0.0, hip_lean=0.0, hip_side=0.0, chest_turn=0.0, chest_lean=2.0, chest_side=0.0,
                main=(-33, 10, 92), axis=(0.02, 0.25, 0.97), support=30.0, support_on=0.0)
    base['hand.L'] = (7, 18, 92)
    base.update(kw); return base

GUARD = pose()

# ---- A1 대각 내려베기: a full two-handed arc from behind the right shoulder down to the front tile ----------------
# The shaft is carried out and around the rider's right leg on its way up (it would pass through the leg on a straight path).
A1_LIFT = pose(h_root=(0, -3, 62.4), h_pitch=1.5, neck=3, seat=(0, 0, 1.5), hip_turn=6, chest_turn=16, chest_lean=-3, chest_side=-3,
               main=(-40, 2, 110), axis=(-0.05, -0.12, 0.99), support=24.0, support_on=0.0)
A1_RAISE = pose(h_root=(0, -5.5, 61.6), h_pitch=2.8, neck=5, seat=(0, 0, 3), hip_turn=12, chest_turn=40, chest_lean=-8, chest_side=-8,
                main=(-22, -5, 127), axis=(-0.1, -0.62, 0.78), support=24.0, support_on=1.0)
A1_COIL = pose(h_root=(0, -7, 61), h_pitch=3.8, neck=6, seat=(0, 0, 3.5), hip_turn=14, chest_turn=42, chest_lean=-10, chest_side=-6,
               main=(-22, -6, 128), axis=(-0.1, -0.68, 0.73), support=24.0, support_on=1.0)
A1_TOP = pose(h_root=(0, 2, 62), h_pitch=0.5, neck=2, FR=(-14, 31, 9), seat=(0, 1, 5), hip_turn=4, hip_lean=5, chest_turn=28, chest_lean=4, chest_side=-12,
              main=(-26, 12, 128), axis=(-0.08, 0.55, 0.83), support=22.0, support_on=1.0)
A1_HIT = pose(h_root=(0, 7.5, 60.8), h_pitch=-4.5, neck=-18, head=-8, FR=(-14, 36, 0), seat=(0, 2, 5), hip_turn=-10, hip_lean=12, chest_turn=-30, chest_lean=22, chest_side=-8,
              main=(-22.0, 27.4, 98.8), axis=(0.2366, 0.7804, -0.5788), support=27.0, support_on=0.0, **{'hand.L': (7, 24, 90)})
A1_OVER = pose(h_root=(0, 8.5, 60.5), h_pitch=-5, neck=-20, head=-9, FR=(-14, 36, 0), seat=(0, 2, 4.5), hip_turn=-12, hip_lean=13, chest_turn=-42, chest_lean=28, chest_side=-10,
               main=(-21.6, 27.6, 98.6), axis=(0.232, 0.776, -0.586), support=27.0, support_on=0.0, **{'hand.L': (7, 25, 89)})
A1_SETTLE = pose(h_root=(0, 6.5, 61.2), h_pitch=-3, neck=-16, head=-7, FR=(-14, 36, 0), seat=(0, 1, 4), hip_turn=-9, hip_lean=10, chest_turn=-37, chest_lean=24, chest_side=-9,
                 main=(-22.3, 27.0, 98.5), axis=(0.2366, 0.7804, -0.5788), support=27.0, support_on=0.0, **{'hand.L': (7, 23, 90)})
A1_DRAW = pose(h_root=(0, 4.5, 62), h_pitch=-1.5, neck=-2, FR=(-14, 36, 0), seat=(0, 0.5, 2.5), hip_turn=-4, hip_lean=6, chest_turn=-14, chest_lean=12, chest_side=-5,
               main=(-22, 20, 104), axis=(-0.04, 0.70, 0.40), support_on=0.0)
A1_BACK = pose(h_root=(0, 1.5, 62.8), neck=-1, FR=(-14, 31, 5), seat=(0, 0, 1), chest_turn=-6, chest_lean=6, chest_side=-2,
               main=(-31, 13, 98), axis=(0.0, 0.45, 0.89), support_on=0.0)

from clips.cycles import horse_move
CLIPS = {
 'move': horse_move(GUARD),
 'idle': dict(title='전투 대기', keys=[(0, GUARD, 'linear'), (7, pose(h_root=(0, 0, 62.4), neck=-2.5, chest_lean=3.5, main=(-33, 10.6, 90.2), axis=(0.02, 0.29, 0.957), **{'hand.L': (7, 18.5, 90.8)}), 'inout'), (14, GUARD, 'inout')],
              support=[('FL', 'FR', 'HL', 'HR')] * 15, durations=[95] * 15, sheet=[0, 7]),
 'a1': dict(title='A1 대각 내려베기', impact=8,
            keys=[(0, GUARD, 'linear'), (2, A1_LIFT, 'inout'), (4, A1_RAISE, 'inout'), (5, A1_COIL, 'out'), (6, A1_TOP, 'in'), (7, A1_HIT, 'snap'), (8, A1_OVER, 'out'),
                  (9, A1_SETTLE, 'inout'), (11, A1_DRAW, 'inout'), (12, A1_BACK, 'inout'), (14, GUARD, 'out')],
            support=[('FL', 'FR', 'HL', 'HR')] * 6 + [('FL', 'HL', 'HR')] + [('FL', 'FR', 'HL', 'HR')] * 5 + [('FL', 'HL', 'HR')] * 2 + [('FL', 'FR', 'HL', 'HR')],
            durations=[110, 100, 100, 110, 130, 160, 50, 40, 60, 190, 100, 90, 90, 90, 100], sheet=[0, 5, 6, 7, 9, 12]),
}

from clips import mounted_more
CLIPS.update(mounted_more.build(__import__("sys").modules[__name__], "blade"))
