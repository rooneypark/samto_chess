"""궁 (bow). Bow in the LEFT hand, string drawn by the RIGHT. Drawing, loosing and the arrow arriving are three
separate moments: full draw is held (frame 8), the string is let go on frame 9, the arrow reaches the target on
frame 10. The draw comes from the back: weight settles onto the rear foot and the chest opens side-on."""
from props import Bow
from clips.common import foot, idle_clip, supports

TITLE = '궁'
BODY = 'samto-body-neutral.json'
WEAPON = Bow(limb=34.0, draw=46.0, arrow=52.0)      # 68 px bow: readable at game size (26 px limbs disappeared behind the arm)

def pose(**kw):
    base = dict(pelvis=(0, 0, 44), hip_turn=45, hip_lean=2, chest_turn=60, chest_lean=4, bow=(14, 20, 56), bow_aim=(0, -25), draw=0.0, string_hand=0.0, arrow_on=0.0, arrow_fly=0.0)
    base['hand.R'] = (-10, 8, 50); base['foot.L'] = foot((8, 14), 10); base['foot.R'] = foot((-9, -12), 60)
    base.update(kw); return base

# Carry (user review 2026-11-18): the bow is simply held in front of the body on the left side, upright and turned a
# little outward so its curve shows; the right hand rests in front of the belly near the string, not behind the hip.
# The body stands less side-on than during the draw.
GUARD = pose(hip_turn=28, chest_turn=36, chest_lean=5, bow=(20, 29, 73), bow_aim=(32, -8), **{'hand.R': (-9, 22, 57)})
A1_NOCK = pose(bow=(14, 24, 62), bow_aim=(0, -10), draw=0.05, string_hand=1.0, arrow_on=1.0, chest_turn=62)
A1_RAISE = pose(pelvis=(0, -2, 44), hip_turn=50, chest_turn=75, chest_lean=1, bow=(4, 40, 72), bow_aim=(0, -14), draw=0.35, string_hand=1.0, arrow_on=1.0)
A1_DRAW = pose(pelvis=(-1, -8, 42.5), hip_turn=55, hip_lean=-1, chest_turn=82, chest_lean=-4, bow=(0, 48, 66), bow_aim=(0, -22), draw=1.0, string_hand=1.0, arrow_on=1.0,
               **{'foot.L': foot((8, 14), 10, heel=1)})
A1_HOLD = pose(pelvis=(-1, -9, 42), hip_turn=56, hip_lean=-1, chest_turn=84, chest_lean=-5, bow=(0, 48, 66), bow_aim=(0, -22), draw=1.0, string_hand=1.0, arrow_on=1.0,
               **{'foot.L': foot((8, 14), 10, heel=1)})
A1_LOOSE = pose(pelvis=(-1, -10.5, 42.3), hip_turn=56, hip_lean=0, chest_turn=86, chest_lean=-6, bow=(0, 49, 66), bow_aim=(0, -22), arrow_fly=-30.0,
                **{'hand.R': (-8, -26, 82)})
A1_ARRIVE = pose(pelvis=(-1, -9, 42.6), hip_turn=55, hip_lean=0, chest_turn=85, chest_lean=-5, bow=(0, 48, 66), bow_aim=(0, -22), arrow_fly=4.1,
                 **{'hand.R': (-9, -27, 80)})
A1_FOLLOW = pose(pelvis=(0, -2, 43.6), hip_turn=52, hip_lean=1, chest_turn=80, chest_lean=-2, bow=(3, 46, 66), bow_aim=(0, -22), **{'hand.R': (-10, -22, 76)})
A1_LOWER = pose(pelvis=(0, -1, 44), hip_turn=47, chest_turn=66, chest_lean=3, bow=(12, 30, 62), bow_aim=(0, -18), **{'hand.R': (-10, 0, 56)})

from clips.cycles import foot_move
CLIPS = {
 'move': foot_move(GUARD, twist=6.0),
 'idle': idle_clip(GUARD),
 'a1': dict(title='A1 한 발 쏘기', impact=9, event='발사', arrive=10,
            keys=[(0, GUARD, 'linear'), (2, A1_NOCK, 'inout'), (4, A1_RAISE, 'inout'), (6, A1_DRAW, 'out'), (7, A1_HOLD, 'inout'), (8, A1_LOOSE, 'snap'),
                  (9, A1_ARRIVE, 'linear'), (10, A1_FOLLOW, 'out'), (12, A1_LOWER, 'inout'), (14, GUARD, 'inout')],
            support=supports(), durations=[100, 100, 100, 110, 120, 130, 150, 170, 45, 120, 150, 110, 100, 100, 100], sheet=[0, 2, 7, 8, 9, 12]),
}

from clips import bow_more
CLIPS.update(bow_more.build(__import__("sys").modules[__name__]))
