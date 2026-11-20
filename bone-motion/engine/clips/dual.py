"""쌍무기 (two weapons). Each hand holds its own sword and each does its own job: in A1 the RIGHT sword cuts while
the LEFT sword comes up into a guard in front of the chest (한쪽이 베고 다른 쪽이 받친다)."""
from props import Blade, Combo
from clips.common import foot, idle_clip, supports

TITLE = '쌍무기'
BODY = 'samto-body-neutral.json'
WEAPON = Combo(Blade('swordR', 'R', total=36.0, grip=6.0, collar=10.0), Blade('swordL', 'L', total=36.0, grip=6.0, collar=10.0))

def pose(**kw):
    base = dict(pelvis=(0, 0, 44), hip_turn=22, hip_lean=3, chest_turn=30, chest_lean=6, swordR=(-25, 8, 54), swordR_aim=(-24, 60), swordL=(19, 18, 58), swordL_aim=(22, 54))
    base['foot.L'] = foot((8, 12), 5); base['foot.R'] = foot((-9, -12), 45)
    base.update(kw); return base

GUARD = pose()
A1_LIFT = pose(pelvis=(-1, -3, 42), hip_turn=30, hip_lean=2, chest_turn=46, chest_lean=2, swordR=(-27, -4, 70), swordR_aim=(-12, 84), swordL=(11, 25, 60), swordL_aim=(-6, 42))
A1_COIL = pose(pelvis=(-2, -9, 39.5), hip_turn=40, hip_lean=0, chest_turn=62, chest_lean=-2, swordR=(-20, -14, 82), swordR_aim=(20, 115), swordL=(8, 30, 62), swordL_aim=(-4, 30))
A1_STEP = pose(pelvis=(-1, 8, 41), hip_turn=5, hip_lean=5, chest_turn=18, chest_lean=6, swordR=(-27, 8, 86), swordR_aim=(-14, 72), swordL=(15, 24, 61), swordL_aim=(-14, 50),
               **{'foot.L': foot((8, 12), 0, heel=2), 'foot.R': foot((-9, 14), 30, air=6)})
A1_HIT = pose(pelvis=(-2, 26, 38), hip_turn=-25, hip_lean=10, chest_turn=-45, chest_lean=20, swordR=(-3.8, 73.1, 57.7), swordR_aim=(8, -25), swordL=(17, 27, 62), swordL_aim=(-32, 64),
              **{'foot.L': foot((8, 12), -10, heel=5), 'foot.R': foot((-9, 42), 15)})
A1_OVER = pose(pelvis=(-2, 27, 37.5), hip_turn=-28, hip_lean=11, chest_turn=-50, chest_lean=22, swordR=(3, 68, 48), swordR_aim=(40, -38), swordL=(18, 27, 62), swordL_aim=(-34, 66),
               **{'foot.L': foot((8, 12), -10, heel=6), 'foot.R': foot((-9, 42), 15)})
A1_SETTLE = pose(pelvis=(-2, 25, 38.5), hip_turn=-22, hip_lean=9, chest_turn=-42, chest_lean=18, swordR=(-1, 66, 52), swordR_aim=(32, -30), swordL=(17, 27, 62), swordL_aim=(-30, 62),
                 **{'foot.L': foot((8, 12), -10, heel=4), 'foot.R': foot((-9, 42), 15)})
A1_PULL = pose(pelvis=(-2, 23, 39.5), hip_turn=-4, hip_lean=6, chest_turn=-8, chest_lean=10, swordR=(-16, 38, 60), swordR_aim=(8, 25), swordL=(15, 28, 60), swordL_aim=(-14, 52),
               **{'foot.L': foot((8, 12), 0, heel=2), 'foot.R': foot((-9, 42), 15)})
A1_BACK = pose(pelvis=(0, 6, 43), hip_turn=14, hip_lean=4, chest_turn=20, chest_lean=7, swordR=(-21, 12, 58), swordR_aim=(5, 45), swordL=(13, 22, 58), swordL_aim=(-8, 50),
               **{'foot.R': foot((-9, 10), 35, air=5)})

from clips.cycles import foot_move
CLIPS = {
 'move': foot_move(GUARD),
 'idle': idle_clip(GUARD),
 'a1': dict(title='A1 우 베기·좌 받침', impact=8,
            keys=[(0, GUARD, 'linear'), (2, A1_LIFT, 'inout'), (4, A1_COIL, 'inout'), (6, A1_STEP, 'in'), (7, A1_HIT, 'snap'), (8, A1_OVER, 'out'), (9, A1_SETTLE, 'inout'),
                  (11, A1_PULL, 'inout'), (13, A1_BACK, 'inout'), (14, GUARD, 'out')],
            support=supports(air_right=(5, 6, 12, 13)), durations=[100, 90, 90, 100, 150, 45, 40, 50, 70, 170, 90, 90, 80, 80, 100], sheet=[0, 4, 6, 7, 9, 12]),
}

from clips import dual_more
CLIPS.update(dual_more.build(__import__("sys").modules[__name__]))

RAW = dict(CLIPS)      # as written; families built from this one start from RAW (snappy.py)
CLIPS = __import__('snappy').upgrade(__import__('sys').modules[__name__])
