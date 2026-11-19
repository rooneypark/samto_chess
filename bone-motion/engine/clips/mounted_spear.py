"""기마 창 (mounted spear). A one-handed couched thrust: the RIGHT hand holds the spear near the butt, the LEFT hand
keeps the reins. The spear is levelled and drawn back beside the right hip, then driven straight forward past the
right side of the neck of the horse while the horse plants its right fore hoof and reaches its neck down."""
import cavalry

TITLE = '기마 창'
BODY = 'samto-body-cavalry-neutral.json'
WEAPON = cavalry.Glaive(total=140.0, main_socket=50.0, collar=118.0)
def rig(neutral): return cavalry.CavalryRig(neutral, WEAPON)

def pose(**kw):
    base = dict(h_root=(0, 0, 63), h_pitch=0.0, neck=0.0, head=0.0, FL=(14, 28, 0), FR=(-14, 28, 0), HL=(16, -29, 0), HR=(-16, -29, 0),
                seat=(0, 0, 0), hip_turn=0.0, hip_lean=0.0, hip_side=0.0, chest_turn=0.0, chest_lean=2.0, chest_side=0.0,
                main=(-33, 10, 92), axis=(0.02, 0.25, 0.97), support=30.0, support_on=0.0)
    base['hand.L'] = (7, 18, 92)
    base['socket'] = WEAPON.main_socket      # where the main hand holds the shaft, from the butt
    base.update(kw); return base

GUARD = pose()
A1_LIFT = pose(h_root=(0, -3, 62.4), h_pitch=1.5, neck=3, seat=(0, 0, 1), hip_turn=6, chest_turn=14, chest_lean=-2, main=(-34, 2, 104), axis=(0.02, 0.55, 0.83))
A1_COUCH = pose(h_root=(0, -5.5, 61.6), h_pitch=2.8, neck=5, seat=(0, 0, 2), hip_turn=12, chest_turn=35, chest_lean=-6, chest_side=-3, main=(-27, -10, 100), axis=(0.02, 0.99, 0.10))
A1_COIL = pose(h_root=(0, -7, 61), h_pitch=3.8, neck=6, seat=(0, 0, 2.5), hip_turn=14, chest_turn=40, chest_lean=-8, chest_side=-4, main=(-28, -13, 104), axis=(0.08, 0.98, -0.18))
A1_DRIVE = pose(h_root=(0, 2, 62), h_pitch=0.5, neck=2, FR=(-14, 31, 9), seat=(0, 1, 4), hip_turn=2, hip_lean=5, chest_turn=4, chest_lean=8, chest_side=-4, main=(-26, 8, 102), axis=(0.15, 0.93, -0.33))
A1_HIT = pose(h_root=(0, 10, 60.6), h_pitch=-4.5, neck=-12, head=-4, FR=(-14, 36, 0), seat=(0, 2, 5), hip_turn=-10, hip_lean=12, chest_turn=-36, chest_lean=24, chest_side=-6,
              main=(-23, 30, 99), axis=(0.252, 0.767, -0.591))
A1_OVER = pose(h_root=(0, 11.5, 60.3), h_pitch=-5, neck=-14, head=-5, FR=(-14, 36, 0), seat=(0, 2, 4.5), hip_turn=-12, hip_lean=13, chest_turn=-40, chest_lean=27, chest_side=-7,
               main=(-21.5, 35, 95.5), axis=(0.252, 0.767, -0.591))
A1_SETTLE = pose(h_root=(0, 8.5, 61.2), h_pitch=-3, neck=-8, head=-2, FR=(-14, 36, 0), seat=(0, 1, 4), hip_turn=-9, hip_lean=10, chest_turn=-33, chest_lean=21, chest_side=-5,
                 main=(-23.5, 28.5, 100), axis=(0.252, 0.767, -0.591))
A1_DRAW = pose(h_root=(0, 4.5, 62), h_pitch=-1.5, neck=-2, FR=(-14, 36, 0), seat=(0, 0.5, 2.5), hip_turn=-2, hip_lean=6, chest_turn=-8, chest_lean=10, chest_side=-3,
               main=(-27, 8, 100), axis=(0.03, 0.97, 0.22))
A1_BACK = pose(h_root=(0, 1.5, 62.8), neck=-1, FR=(-14, 31, 5), seat=(0, 0, 1), chest_turn=-3, chest_lean=5, main=(-33, 10, 96), axis=(0.02, 0.55, 0.83))

from clips.cycles import horse_move
CLIPS = {
 'move': horse_move(GUARD),
 'idle': dict(title='전투 대기', keys=[(0, GUARD, 'linear'), (7, pose(h_root=(0, 0, 62.4), neck=-2.5, chest_lean=3.5, main=(-33, 10.6, 90.2), axis=(0.02, 0.29, 0.957), **{'hand.L': (7, 18.5, 90.8)}), 'inout'), (14, GUARD, 'inout')],
              support=[('FL', 'FR', 'HL', 'HR')] * 15, durations=[95] * 15, sheet=[0, 7]),
 'a1': dict(title='A1 기마 직창', impact=8,
            keys=[(0, GUARD, 'linear'), (2, A1_LIFT, 'inout'), (4, A1_COUCH, 'inout'), (5, A1_COIL, 'out'), (6, A1_DRIVE, 'in'), (7, A1_HIT, 'snap'), (8, A1_OVER, 'out'),
                  (9, A1_SETTLE, 'inout'), (11, A1_DRAW, 'inout'), (12, A1_BACK, 'inout'), (14, GUARD, 'out')],
            support=[('FL', 'FR', 'HL', 'HR')] * 6 + [('FL', 'HL', 'HR')] + [('FL', 'FR', 'HL', 'HR')] * 5 + [('FL', 'HL', 'HR')] * 2 + [('FL', 'FR', 'HL', 'HR')],
            durations=[110, 100, 100, 110, 130, 160, 50, 40, 60, 190, 100, 90, 90, 90, 100], sheet=[0, 5, 6, 7, 9, 12]),
}

from clips import mounted_more
CLIPS.update(mounted_more.build(__import__("sys").modules[__name__], "spear"))
