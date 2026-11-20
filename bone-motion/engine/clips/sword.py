"""한손 검·단도 (one-hand sword). Sword in the RIGHT hand, the LEFT arm is the counterweight: it reaches forward
while the sword is wound back and swings back as the cut goes through. The cut is carried by one big step of the
right foot and a full turn of hips and chest, not by the arm."""
from props import Blade
from clips.common import foot, idle_clip, supports

TITLE = '한손 검'
BODY = 'samto-body-neutral.json'
WEAPON = Blade('sword', 'R', total=40.0, grip=6.0, collar=10.0)

def pose(**kw):
    base = dict(pelvis=(0, 0, 44), hip_turn=25, hip_lean=3, chest_turn=35, chest_lean=6, sword=(-25, 8, 54), sword_aim=(-24, 60))
    base['hand.L'] = (12, 20, 58); base['foot.L'] = foot((8, 12), 5); base['foot.R'] = foot((-9, -12), 45)
    base.update(kw); return base

GUARD = pose()
A1_LIFT = pose(pelvis=(-1, -3, 42), hip_turn=32, hip_lean=2, chest_turn=48, chest_lean=2, sword=(-27, -4, 70), sword_aim=(-12, 84), **{'hand.L': (10, 25, 60)})
A1_COIL = pose(pelvis=(-2, -9, 39.5), hip_turn=40, hip_lean=0, chest_turn=62, chest_lean=-2, sword=(-20, -14, 82), sword_aim=(20, 115), **{'hand.L': (8, 30, 62)})
A1_STEP = pose(pelvis=(-1, 8, 41), hip_turn=5, hip_lean=5, chest_turn=18, chest_lean=6, sword=(-27, 8, 86), sword_aim=(-14, 72),
               **{'hand.L': (16, 22, 60), 'foot.L': foot((8, 12), 0, heel=2), 'foot.R': foot((-9, 14), 30, air=6)})
A1_HIT = pose(pelvis=(-2, 26, 38), hip_turn=-25, hip_lean=10, chest_turn=-45, chest_lean=20, sword=(-4.3, 69.5, 59.4), sword_aim=(8, -25),
              **{'hand.L': (22, 16, 58), 'foot.L': foot((8, 12), -10, heel=5), 'foot.R': foot((-9, 42), 15)})
A1_OVER = pose(pelvis=(-2, 27, 37.5), hip_turn=-28, hip_lean=11, chest_turn=-50, chest_lean=22, sword=(3, 68, 48), sword_aim=(40, -38),
               **{'hand.L': (23, 14, 57), 'foot.L': foot((8, 12), -10, heel=6), 'foot.R': foot((-9, 42), 15)})
A1_SETTLE = pose(pelvis=(-2, 25, 38.5), hip_turn=-22, hip_lean=9, chest_turn=-42, chest_lean=18, sword=(-1, 66, 52), sword_aim=(32, -30),
                 **{'hand.L': (22, 16, 58), 'foot.L': foot((8, 12), -10, heel=4), 'foot.R': foot((-9, 42), 15)})
A1_PULL = pose(pelvis=(-2, 23, 39.5), hip_turn=-4, hip_lean=6, chest_turn=-8, chest_lean=10, sword=(-16, 38, 60), sword_aim=(8, 25),
               **{'hand.L': (16, 24, 58), 'foot.L': foot((8, 12), 0, heel=2), 'foot.R': foot((-9, 42), 15)})
A1_BACK = pose(pelvis=(0, 6, 43), hip_turn=16, hip_lean=4, chest_turn=24, chest_lean=7, sword=(-20, 12, 58), sword_aim=(5, 45),
               **{'hand.L': (13, 21, 58), 'foot.R': foot((-9, 10), 35, air=5)})

from clips.cycles import foot_move
CLIPS = {
 'move': foot_move(GUARD),
 'idle': idle_clip(GUARD),
 'a1': dict(title='A1 사선 내려베기', impact=8,
            keys=[(0, GUARD, 'linear'), (2, A1_LIFT, 'inout'), (4, A1_COIL, 'inout'), (6, A1_STEP, 'in'), (7, A1_HIT, 'snap'), (8, A1_OVER, 'out'), (9, A1_SETTLE, 'inout'),
                  (11, A1_PULL, 'inout'), (13, A1_BACK, 'inout'), (14, GUARD, 'out')],
            support=supports(air_right=(5, 6, 12, 13)), durations=[100, 90, 90, 100, 150, 45, 40, 50, 70, 170, 90, 90, 80, 80, 100], sheet=[0, 4, 6, 7, 9, 12]),
}

from clips import sword_more
CLIPS.update(sword_more.build(__import__("sys").modules[__name__]))

RAW = dict(CLIPS)      # as written; families built from this one start from RAW (snappy.py)
CLIPS = __import__('snappy').upgrade(__import__('sys').modules[__name__])
