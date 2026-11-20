"""책사·지원 (caster). The tactician body is narrower and shorter than the infantry body (its own standard bone).
A feather fan in the RIGHT hand; the LEFT hand is free and acts with it. A cast is not a strike: nothing touches
the target. The body still has to show where the force comes from, so the weight sinks and winds back before the
release, and the left foot steps out so the weight lands on it as the fan sweeps forward.
"""
from samto_motion import Fan

TITLE = '책사·지원'
BODY = 'samto-body-tactician-neutral.json'
WEAPON = Fan(total=24.0)

def pose(**kw):
    base = dict(pelvis=(0, 0, 42), hip_turn=10, hip_lean=2, chest_turn=15, chest_lean=4,
                rear=(-17, 15, 62), aim=(-14, 62))
    base['hand.L'] = (10, 9, 45)
    base['foot.L'] = dict(at=(8, 5), yaw=-5, heel=0, air=0); base['foot.R'] = dict(at=(-8, -5), yaw=22, heel=0, air=0)
    base.update(kw); return base

GUARD = pose()

# ---- S1 대계 (큰 지원 전법): gather low and back, hold, then release forward and up ---------------------------
S1_GATHER = pose(pelvis=(0, -7, 37), hip_turn=18, hip_lean=-2, chest_turn=34, chest_lean=-6, rear=(-16, 1, 50), aim=(-20, -50),
                 **{'hand.L': (4, 9, 56), 'foot.L': dict(at=(8, 5), yaw=-5, heel=3, air=0)})
S1_DEEP = pose(pelvis=(0, -8, 36), hip_turn=20, hip_lean=-3, chest_turn=38, chest_lean=-8, rear=(-17, -1, 49), aim=(-24, -56),
               **{'hand.L': (3, 8, 57), 'foot.L': dict(at=(8, 5), yaw=-5, heel=4, air=0)})
S1_STEP = pose(pelvis=(0, 0, 38.5), hip_turn=10, hip_lean=1, chest_turn=14, chest_lean=0, rear=(-15, 14, 58), aim=(-10, -20),
               **{'hand.L': (8, 16, 55), 'foot.L': dict(at=(8, 12), yaw=-5, heel=0, air=5), 'foot.R': dict(at=(-8, -5), yaw=22, heel=2, air=0)})
S1_RELEASE = pose(pelvis=(0, 12, 42), hip_turn=-6, hip_lean=5, chest_turn=-22, chest_lean=12, rear=(-9, 53, 80), aim=(8, 25),
                  **{'hand.L': (12, 31, 52), 'foot.L': dict(at=(8, 17), yaw=-5, heel=0, air=0), 'foot.R': dict(at=(-8, -5), yaw=22, heel=5, air=0)})
S1_OVER = pose(pelvis=(0, 14, 42.5), hip_turn=-8, hip_lean=6, chest_turn=-26, chest_lean=15, rear=(-8, 57, 81), aim=(8, 18),
               **{'hand.L': (13, 34, 51), 'foot.L': dict(at=(8, 17), yaw=-5, heel=0, air=0), 'foot.R': dict(at=(-8, -5), yaw=22, heel=6, air=0)})
S1_HOLD = pose(pelvis=(0, 11, 42), hip_turn=-5, hip_lean=4, chest_turn=-19, chest_lean=10, rear=(-9, 51, 79), aim=(8, 28),
               **{'hand.L': (12, 30, 52), 'foot.L': dict(at=(8, 17), yaw=-5, heel=0, air=0), 'foot.R': dict(at=(-8, -5), yaw=22, heel=4, air=0)})
S1_RETURN = pose(pelvis=(0, 6, 42), hip_turn=4, hip_lean=3, chest_turn=2, chest_lean=6, rear=(-12, 30, 68), aim=(9, 46),
                 **{'hand.L': (11, 19, 47), 'foot.L': dict(at=(8, 17), yaw=-5, heel=0, air=0), 'foot.R': dict(at=(-8, -5), yaw=22, heel=1, air=0)})
S1_BACK = pose(pelvis=(0, 2, 42), hip_turn=8, hip_lean=2, chest_turn=11, chest_lean=5, rear=(-12, 20, 64), aim=(10, 55),
               **{'hand.L': (10, 12, 45), 'foot.L': dict(at=(8, 10), yaw=-5, heel=0, air=4)})

from clips.cycles import foot_move
CLIPS = {
 'move': foot_move(GUARD, stride=12.0, lift=6.0, lean=5.0, twist=6.0, swing=5.0, ms=54, stance=0.5, drop=1.0, run_height=42.0),
 'idle': __import__('clips.common', fromlist=['idle_clip']).idle_clip(GUARD),
 's1': dict(title='S1 대계', impact=8, event='발동',
            keys=[(0, GUARD, 'linear'), (4, S1_GATHER, 'inout'), (5, S1_DEEP, 'out'), (6, S1_STEP, 'in'), (7, S1_RELEASE, 'snap'), (8, S1_OVER, 'out'),
                  (10, S1_HOLD, 'inout'), (12, S1_RETURN, 'inout'), (13, S1_BACK, 'inout'), (14, GUARD, 'out')],
            support=[('L', 'R')] * 6 + [('R',)] + [('L', 'R')] * 6 + [('R',), ('L', 'R')],
            durations=[100, 100, 110, 120, 130, 170, 50, 45, 70, 110, 200, 100, 90, 90, 100], sheet=[0, 5, 7, 8, 10, 12]),
}

from clips import caster_more
CLIPS.update(caster_more.build(__import__("sys").modules[__name__]))

RAW = dict(CLIPS)      # as written; families built from this one start from RAW (snappy.py)
CLIPS = __import__('snappy').upgrade(__import__('sys').modules[__name__])
