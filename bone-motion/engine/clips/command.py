"""군령 (command). A commander does not strike: he gathers the sword in across the chest, sinking back onto the rear foot, then takes a full
step and points it at the target and holds. Nothing touches the target and no damage is dealt; frame 8 is the signal."""
from props import Blade
from clips.common import foot, idle_clip, supports

TITLE = '군령'
BODY = 'samto-body-neutral.json'
WEAPON = Blade('sword', 'R', total=36.0, grip=6.0, collar=10.0)

def pose(**kw):
    base = dict(pelvis=(0, 0, 45), hip_turn=12, hip_lean=2, chest_turn=18, chest_lean=3, sword=(-25, 8, 54), sword_aim=(-26, 66))
    base['hand.L'] = (17, 6, 50); base['foot.L'] = foot((8, 8), 0); base['foot.R'] = foot((-9, -12), 35)
    base.update(kw); return base

GUARD = pose()
A1_RISE = pose(pelvis=(0, -2, 44), hip_turn=16, chest_turn=22, chest_lean=0, sword=(-14, 20, 62), sword_aim=(-15, 5))
A1_GATHER = pose(pelvis=(0, -7, 41.5), hip_turn=20, hip_lean=-1, chest_turn=28, chest_lean=-4, sword=(0, 14, 74), sword_aim=(-40, 60), **{'hand.L': (18, 0, 50), 'foot.L': foot((8, 8), 0, heel=3)})
A1_GATHER2 = pose(pelvis=(0, -8, 41), hip_turn=22, hip_lean=-2, chest_turn=30, chest_lean=-5, sword=(1, 14, 75), sword_aim=(-44, 62), **{'hand.L': (18, -1, 50), 'foot.L': foot((8, 8), 0, heel=4)})
A1_STEP = pose(pelvis=(0, 4, 42.5), hip_turn=6, hip_lean=3, chest_turn=5, chest_lean=3, sword=(-6, 28, 84), sword_aim=(-10, 48),
               **{'hand.L': (19, 4, 51), 'foot.R': foot((-9, 2), 25, air=6), 'foot.L': foot((8, 8), 0, heel=1)})
A1_POINT = pose(pelvis=(0, 14, 42), hip_turn=-10, hip_lean=6, chest_turn=-30, chest_lean=10, sword=(-10, 58, 80), sword_aim=(5, 8),
                **{'hand.L': (20, 4, 52), 'foot.R': foot((-9, 16), 15), 'foot.L': foot((8, 8), -5, heel=3)})
A1_OVER = pose(pelvis=(0, 16, 41.8), hip_turn=-12, hip_lean=7, chest_turn=-33, chest_lean=12, sword=(-10, 62, 81), sword_aim=(5, 5),
               **{'hand.L': (20, 3, 52), 'foot.R': foot((-9, 16), 15), 'foot.L': foot((8, 8), -5, heel=4)})
A1_HOLD = pose(pelvis=(0, 13, 42.3), hip_turn=-9, hip_lean=5, chest_turn=-28, chest_lean=9, sword=(-10, 57, 80), sword_aim=(5, 9),
               **{'hand.L': (20, 4, 52), 'foot.R': foot((-9, 16), 15), 'foot.L': foot((8, 8), -5, heel=2)})
A1_RETURN = pose(pelvis=(0, 8, 43.5), hip_turn=0, hip_lean=3, chest_turn=-4, chest_lean=5, sword=(-18, 26, 60), sword_aim=(5, -20),
                 **{'hand.L': (18, 5, 51), 'foot.R': foot((-9, 16), 15)})
A1_BACK = pose(pelvis=(0, 2, 44.6), hip_turn=8, hip_lean=2, chest_turn=12, chest_lean=3, sword=(-21, 12, 52), sword_aim=(5, -42),
               **{'foot.R': foot((-9, 0), 28, air=5)})

from clips.cycles import foot_move
CLIPS = {
 'move': foot_move(GUARD, stride=15.0, lean=6.0, ms=50, stance=0.45),
 'idle': idle_clip(GUARD),
 'a1': dict(title='A1 지목', impact=8, event='지목(피해 없음)',
            keys=[(0, GUARD, 'linear'), (2, A1_RISE, 'inout'), (4, A1_GATHER, 'inout'), (5, A1_GATHER2, 'out'), (6, A1_STEP, 'in'), (7, A1_POINT, 'snap'), (8, A1_OVER, 'out'),
                  (10, A1_HOLD, 'inout'), (12, A1_RETURN, 'inout'), (13, A1_BACK, 'inout'), (14, GUARD, 'out')],
            support=supports(air_right=(6, 13)), durations=[100, 100, 100, 110, 120, 160, 50, 45, 70, 110, 210, 100, 90, 90, 100], sheet=[0, 5, 6, 7, 10, 12],
            notes='타격이 아니라 신호다. 검은 표적에 닿지 않고 피해가 없다.'),
}

from clips import command_more
CLIPS.update(command_more.build(__import__("sys").modules[__name__]))
