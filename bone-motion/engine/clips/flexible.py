"""사슬·채찍 (chain, whip). The handle is in the RIGHT hand and never leaves it; the links are not posed but trail
behind the hand (props.Chain), so the tip arrives after the hand has already stopped: the hand throws on frame 8 and snaps back
on frame 9, which is when the chain goes straight and the weighted end lands."""
from props import Chain
from clips.common import foot, idle_clip, supports

TITLE = '사슬·채찍'
BODY = 'samto-body-neutral.json'
WEAPON = Chain('chain', 'R', links=6, link=11.0)

def pose(**kw):
    base = dict(pelvis=(0, 0, 44), hip_turn=20, hip_lean=3, chest_turn=30, chest_lean=6, chain=(-27, 8, 58), chain_aim=(-12, -76), chain_taut=0.0)
    base['hand.L'] = (12, 18, 58); base['foot.L'] = foot((8, 12), 5); base['foot.R'] = foot((-9, -12), 45)
    base.update(kw); return base

GUARD = pose()
A1_COIL = pose(pelvis=(-2, -9, 39.5), hip_turn=38, hip_lean=0, chest_turn=60, chest_lean=-2, chain=(-22, -14, 84), chain_aim=(15, 160), **{'hand.L': (8, 28, 62)})
A1_SWING = pose(pelvis=(-1, 6, 41), hip_turn=8, hip_lean=5, chest_turn=15, chest_lean=6, chain=(-24, 10, 90), chain_aim=(-5, 80),
                **{'hand.L': (16, 22, 60), 'foot.L': foot((8, 12), 0, heel=2), 'foot.R': foot((-9, 12), 30, air=5)})
A1_HIT = pose(pelvis=(-2, 22, 38), hip_turn=-20, hip_lean=9, chest_turn=-40, chest_lean=18, chain=(-8, 46, 64), chain_aim=(5, 25), chain_taut=0.35,
              **{'hand.L': (22, 14, 58), 'foot.L': foot((8, 12), -8, heel=5), 'foot.R': foot((-9, 38), 15)})
A1_OVER = pose(pelvis=(-2, 23, 37.5), hip_turn=-23, hip_lean=10, chest_turn=-45, chest_lean=20, chain=(-5, 35, 50), chain_aim=(4.3, -4.4), chain_taut=1.0,
               **{'hand.L': (23, 13, 57), 'foot.L': foot((8, 12), -8, heel=6), 'foot.R': foot((-9, 38), 15)})
A1_SETTLE = pose(pelvis=(-2, 21, 38.5), hip_turn=-18, hip_lean=8, chest_turn=-36, chest_lean=16, chain=(-7, 36, 52), chain_aim=(8, -35), chain_taut=0.3,
                 **{'hand.L': (22, 15, 58), 'foot.L': foot((8, 12), -8, heel=4), 'foot.R': foot((-9, 38), 15)})
A1_PULL = pose(pelvis=(-1, 20, 39.5), hip_turn=-4, hip_lean=6, chest_turn=-6, chest_lean=10, chain=(-16, 30, 62), chain_aim=(8, -60),
               **{'hand.L': (16, 22, 58), 'foot.L': foot((8, 12), 0, heel=2), 'foot.R': foot((-9, 38), 15)})
A1_BACK = pose(pelvis=(0, 6, 43), hip_turn=12, hip_lean=4, chest_turn=20, chest_lean=7, chain=(-21, 12, 58), chain_aim=(10, -70),
               **{'hand.L': (13, 19, 58), 'foot.R': foot((-9, 10), 35, air=5)})

from clips.cycles import foot_move
CLIPS = {
 'move': foot_move(GUARD),
 'idle': idle_clip(GUARD),
 'a1': dict(title='A1 후려치기', impact=9,
            keys=[(0, GUARD, 'linear'), (4, A1_COIL, 'inout'), (6, A1_SWING, 'in'), (7, A1_HIT, 'snap'), (8, A1_OVER, 'out'), (9, A1_SETTLE, 'inout'),
                  (11, A1_PULL, 'inout'), (13, A1_BACK, 'inout'), (14, GUARD, 'out')],
            support=supports(air_right=(5, 6, 12, 13)), durations=[100, 90, 90, 100, 150, 45, 40, 50, 80, 170, 90, 90, 80, 80, 100], sheet=[0, 4, 6, 7, 8, 12],
            notes='8번에 손이 던지고 9번에 당긴다. 그 순간 사슬이 곧게 펴지며 끝이 닿는다.'),
}

from clips import flexible_more
CLIPS.update(flexible_more.build(__import__("sys").modules[__name__]))
