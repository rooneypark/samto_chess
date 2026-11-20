"""중무기 (mace, great axe). Both hands on a short heavy weapon: LEFT hand at the butt, RIGHT hand nearer the head.
The weight is the point: it is lifted and held over the right shoulder, comes down onto the target with the whole body dropping
under it, bounces once off the target, and takes a long time to heave back up."""
from samto_motion import Spear
from clips.common import foot, idle_clip, supports

TITLE = '중무기'
BODY = 'samto-body-neutral.json'
WEAPON = Spear(total=78.0, rear_socket=8.0, collar=58.0, rear_hand='L', front_hand='R', head='head')

def pose(**kw):
    base = dict(pelvis=(0, 0, 43), hip_turn=10, hip_lean=3, chest_turn=12, chest_lean=6, rear=(7, 25, 52), axis=(-0.35, 0.34, 0.87), front=27.0)
    base['foot.L'] = foot((8, 12), 5); base['foot.R'] = foot((-9, -12), 45)
    base.update(kw); return base

GUARD = pose()
A1_LIFT = pose(pelvis=(0, -2, 45), hip_turn=24, hip_lean=1, chest_turn=38, chest_lean=0, rear=(-4, 18, 62), axis=(-0.40, 0.05, 0.915))
A1_TOP = pose(pelvis=(0, -7, 44.8), hip_turn=28, hip_lean=-2, chest_turn=42, chest_lean=-8, rear=(-12, 9, 78), axis=(-0.35, -0.45, 0.82), front=28.0)
A1_TOP2 = pose(pelvis=(0, -7.5, 45), hip_turn=29, hip_lean=-2, chest_turn=44, chest_lean=-9, rear=(-12, 8, 79), axis=(-0.35, -0.50, 0.79), front=28.0)
A1_STEP = pose(pelvis=(0, 2, 44), hip_turn=12, hip_lean=5, chest_turn=15, chest_lean=8, rear=(-12, 22, 76), axis=(-0.20, 0.40, 0.894), front=18.0,
               **{'foot.L': foot((8, 20), 5, air=6), 'foot.R': foot((-9, -12), 45, heel=2)})
A1_HIT = pose(pelvis=(0, 4, 37), hip_turn=-5, hip_lean=12, chest_turn=-10, chest_lean=22, rear=(-8, 31, 57), axis=(0.113, 0.979, -0.17), front=16.0,
              **{'foot.L': foot((7, 24), 4), 'foot.R': foot((-9, -12), 45, heel=6)})
A1_BOUNCE = pose(pelvis=(0, 3.5, 38), hip_turn=-4, hip_lean=11, chest_turn=-8, chest_lean=20, rear=(-8, 30, 60), axis=(0.113, 0.985, -0.10), front=16.0,
                 **{'foot.L': foot((7, 24), 4), 'foot.R': foot((-9, -12), 45, heel=5)})
A1_SETTLE = pose(pelvis=(0, 4, 36.5), hip_turn=-4, hip_lean=12, chest_turn=-8, chest_lean=23, rear=(-8, 31, 54), axis=(0.11, 0.955, -0.27), front=16.0,
                 **{'foot.L': foot((7, 24), 4), 'foot.R': foot((-9, -12), 45, heel=5)})
A1_HEAVE = pose(pelvis=(0, 3, 40), hip_turn=6, hip_lean=8, chest_turn=5, chest_lean=14, rear=(7, 28, 47), axis=(-0.10, 0.80, 0.30), front=14.0,
                **{'foot.L': foot((7, 24), 4), 'foot.R': foot((-9, -12), 45, heel=2)})
A1_BACK = pose(pelvis=(0, 1, 42), hip_turn=15, hip_lean=4, chest_turn=22, chest_lean=8, rear=(9, 17, 48), axis=(-0.30, 0.40, 0.80),
               **{'foot.L': foot((8, 18), 5, air=4)})
from clips.cycles import foot_move
CLIPS = {
 'move': foot_move(GUARD, stride=14.0, lift=7.0, lean=3.0, bob=2.0, sway=1.0, twist=6.0, ms=56, stance=0.5),
 'idle': idle_clip(GUARD),
 'a1': dict(title='A1 내려찍기', impact=9,
            keys=[(0, GUARD, 'linear'), (3, A1_LIFT, 'inout'), (5, A1_TOP, 'out'), (6, A1_TOP2, 'inout'), (7, A1_STEP, 'in'), (8, A1_HIT, 'snap'), (9, A1_BOUNCE, 'out'),
                  (10, A1_SETTLE, 'inout'), (12, A1_HEAVE, 'inout'), (13, A1_BACK, 'inout'), (14, GUARD, 'out')],
            support=supports(air_left=(7, 13)), durations=[110, 110, 120, 130, 130, 140, 200, 45, 50, 80, 220, 110, 110, 100, 100], sheet=[0, 6, 7, 8, 10, 12]),
}

from clips import heavy_more
CLIPS.update(heavy_more.build(__import__("sys").modules[__name__]))

RAW = dict(CLIPS)      # as written; families built from this one start from RAW (snappy.py)
CLIPS = __import__('snappy').upgrade(__import__('sys').modules[__name__])
