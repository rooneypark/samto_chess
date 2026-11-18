"""보행 창 (foot spear). Two hands on the shaft: the RIGHT hand is the rear hand by the hip, the LEFT hand is the
front hand. The spear stays on the character's right side and never crosses the torso.

Stance (전투 대기): left foot and left shoulder forward, weight a little low, spear carried nearly upright (72 degrees) and leaning out to the
right rather than forward. A spear that points forward looks very short from the front and from behind (user review
2026-11-18: 'it looks extremely short, cut off at the leg'); upright, it shows its full length in all three views. This is the start and the end of every independent attack.
"""
from samto_motion import Spear

TITLE = '보행 창'
BODY = 'samto-body-neutral.json'
WEAPON = Spear(total=128.0, rear_socket=34.0, collar=104.0)

def pose(**kw):
    base = dict(pelvis=(0, 0, 44), hip_turn=30, hip_lean=4, chest_turn=50, chest_lean=8,
                rear=(-26, 10, 46), aim=(-11, 75), front=52.0)
    base['front_on'] = 1.0; base['hand.L'] = (12, 18, 55)      # only used while front_on < 1
    base['foot.L'] = dict(at=(9, 14), yaw=8, heel=0, air=0); base['foot.R'] = dict(at=(-9, -12), yaw=50, heel=0, air=0)
    base.update(kw); return base

GUARD = pose()

# ---- A1 정면 직창: one big step and a straight two-handed thrust at waist height --------------------------------
# Weight goes back onto the right foot while the hips and chest wind up and the shaft is drawn level; the left foot
# then leaves the ground, the hips unwind first, the chest and arms follow, and the foot lands on the same frame
# the tip arrives. The shaft slides forward through the left hand (front socket 78 -> 50), which is what gives the
# tip its travel without stretching anything.
A1_COIL = pose(pelvis=(-2, -11, 38.5), hip_turn=42, hip_lean=0, chest_turn=68, chest_lean=2, rear=(-21, -20, 44), aim=(6, 4), front=78.0,
               **{'foot.L': dict(at=(9, 14), yaw=8, heel=3, air=0), 'foot.R': dict(at=(-9, -12), yaw=50, heel=0, air=0)})
A1_STEP = pose(pelvis=(-1, 1, 40), hip_turn=24, hip_lean=4, chest_turn=46, chest_lean=8, rear=(-19, -8, 45), aim=(7, 3), front=68.0,
               **{'foot.L': dict(at=(8, 22), yaw=6, heel=0, air=6), 'foot.R': dict(at=(-9, -12), yaw=50, heel=2, air=0)})
A1_HIT = pose(pelvis=(0, 9, 37), hip_turn=6, hip_lean=10, chest_turn=12, chest_lean=22, rear=(-17.5, 7.5, 46.5), aim=(10.7, -0.9), front=50.0,
              **{'foot.L': dict(at=(7, 28), yaw=5, heel=0, air=0), 'foot.R': dict(at=(-9, -12), yaw=50, heel=5, air=0)})
A1_OVER = pose(pelvis=(0, 12, 36.5), hip_turn=2, hip_lean=12, chest_turn=5, chest_lean=26, rear=(-17.5, 13.5, 46.5), aim=(10.7, -1.5), front=50.0,
               **{'foot.L': dict(at=(7, 28), yaw=5, heel=0, air=0), 'foot.R': dict(at=(-9, -12), yaw=50, heel=6, air=0)})
A1_SETTLE = pose(pelvis=(0, 7.5, 38), hip_turn=8, hip_lean=9, chest_turn=14, chest_lean=19, rear=(-17.5, 5.5, 46.5), aim=(10.7, 0), front=52.0,
                 **{'foot.L': dict(at=(7, 28), yaw=5, heel=0, air=0), 'foot.R': dict(at=(-9, -12), yaw=50, heel=4, air=0)})
A1_PULL = pose(pelvis=(-1, 3, 40), hip_turn=20, hip_lean=6, chest_turn=36, chest_lean=11, rear=(-18, -2, 46), aim=(8, 10), front=62.0,
               **{'foot.L': dict(at=(7, 28), yaw=5, heel=0, air=0), 'foot.R': dict(at=(-9, -12), yaw=50, heel=1, air=0)})
A1_BACK = pose(pelvis=(0, 1, 43), hip_turn=27, hip_lean=4, chest_turn=46, chest_lean=8, rear=(-19, -4, 45), aim=(9, 22), front=68.0,
               **{'foot.L': dict(at=(8, 19), yaw=7, heel=0, air=4), 'foot.R': dict(at=(-9, -12), yaw=50, heel=0, air=0)})
from clips.cycles import foot_move
CLIPS = {
 'move': foot_move(GUARD),
 'idle': __import__('clips.common', fromlist=['idle_clip']).idle_clip(GUARD),
 'a1': dict(title='A1 정면 직창', impact=8,
            keys=[(0, GUARD, 'linear'), (4, A1_COIL, 'inout'), (6, A1_STEP, 'in'), (7, A1_HIT, 'snap'), (8, A1_OVER, 'out'),
                  (9, A1_SETTLE, 'inout'), (11, A1_PULL, 'inout'), (13, A1_BACK, 'inout'), (14, GUARD, 'out')],
            support=[('L', 'R')] * 5 + [('R',), ('R',)] + [('L', 'R')] * 5 + [('R',), ('R',), ('L', 'R')],
            durations=[100, 90, 90, 100, 150, 45, 40, 55, 70, 170, 90, 90, 80, 80, 100], sheet=[0, 4, 6, 7, 9, 12]),
}

from clips import foot_spear_more
CLIPS.update(foot_spear_more.build(pose, GUARD))
