"""창·방패 (spear and shield). The shield on the LEFT forearm stays between the body and the target the whole time;
the RIGHT hand drives a short spear past the right edge of the shield. The spear never goes through shield or torso."""
from props import Blade, Shield, Combo
from clips.common import foot, idle_clip, supports

TITLE = '창·방패'
BODY = 'samto-body-neutral.json'
WEAPON = Combo(Blade('spear', 'R', total=104.0, grip=40.0, collar=84.0), Shield('L'))

def pose(**kw):
    base = dict(pelvis=(0, 0, 44), hip_turn=28, hip_lean=4, chest_turn=42, chest_lean=8, spear=(-28, 5, 52), spear_aim=(-10, 76), shield=(10, 22, 60), shield_aim=(0, 5))
    base['foot.L'] = foot((8, 14), 6); base['foot.R'] = foot((-9, -12), 48)
    base.update(kw); return base

GUARD = pose()
A1_COIL = pose(pelvis=(-2, -10, 39.5), hip_turn=38, hip_lean=0, chest_turn=60, chest_lean=3, spear=(-22, -20, 54), spear_aim=(4, 2), shield=(8, 24, 64), shield_aim=(0, 8),
               **{'foot.L': foot((8, 14), 6, heel=3)})
A1_STEP = pose(pelvis=(-1, 3, 41), hip_turn=24, hip_lean=4, chest_turn=42, chest_lean=8, spear=(-21, -4, 54), spear_aim=(5, 1), shield=(9, 28, 62),
               **{'foot.L': foot((8, 26), 6, air=6), 'foot.R': foot((-9, -12), 48, heel=2)})
A1_HIT = pose(pelvis=(0, 13, 38), hip_turn=10, hip_lean=9, chest_turn=8, chest_lean=20, spear=(-16.4, 38.8, 54), spear_aim=(15, -8), shield=(10, 36, 58), shield_aim=(0, 0),
              **{'foot.L': foot((7, 32), 5), 'foot.R': foot((-9, -12), 48, heel=5)})
A1_OVER = pose(pelvis=(0, 16.5, 37), hip_turn=6, hip_lean=11, chest_turn=2, chest_lean=24, spear=(-16, 46, 53), spear_aim=(15, -9), shield=(10, 37, 58), shield_aim=(0, 0),
               **{'foot.L': foot((7, 32), 5), 'foot.R': foot((-9, -12), 48, heel=6)})
A1_SETTLE = pose(pelvis=(0, 12, 38.5), hip_turn=11, hip_lean=8, chest_turn=10, chest_lean=18, spear=(-16, 39, 54), spear_aim=(15, -7), shield=(10, 35, 58), shield_aim=(0, 0),
                 **{'foot.L': foot((7, 32), 5), 'foot.R': foot((-9, -12), 48, heel=4)})
A1_PULL = pose(pelvis=(-1, 7, 39.5), hip_turn=20, hip_lean=6, chest_turn=34, chest_lean=11, spear=(-19, 10, 52), spear_aim=(5, 8), shield=(10, 30, 60),
               **{'foot.L': foot((7, 32), 5), 'foot.R': foot((-9, -12), 48, heel=1)})
A1_BACK = pose(pelvis=(0, 1, 43), hip_turn=26, hip_lean=4, chest_turn=40, chest_lean=8, spear=(-20, -2, 50), spear_aim=(5, 13), shield=(10, 24, 60),
               **{'foot.L': foot((8, 22), 6, air=4)})

from clips.cycles import foot_move
CLIPS = {
 'move': foot_move(GUARD),
 'idle': idle_clip(GUARD),
 'a1': dict(title='A1 방패 뒤 직창', impact=8,
            keys=[(0, GUARD, 'linear'), (4, A1_COIL, 'inout'), (6, A1_STEP, 'in'), (7, A1_HIT, 'snap'), (8, A1_OVER, 'out'), (9, A1_SETTLE, 'inout'),
                  (11, A1_PULL, 'inout'), (13, A1_BACK, 'inout'), (14, GUARD, 'out')],
            support=supports(air_left=(5, 6, 12, 13)), durations=[100, 90, 90, 100, 150, 45, 40, 55, 70, 170, 90, 90, 80, 80, 100], sheet=[0, 4, 6, 7, 9, 12]),
}

from clips import spear_shield_more
CLIPS.update(spear_shield_more.build(__import__("sys").modules[__name__]))

RAW = dict(CLIPS)      # as written; families built from this one start from RAW (snappy.py)
CLIPS = __import__('snappy').upgrade(__import__('sys').modules[__name__])
