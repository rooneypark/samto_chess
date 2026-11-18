"""One-hand blade moves shared by 한손 검·단도 and the right hand of 쌍무기.

The body keys come from the family's own A1 (guard, lift, coil, step, hit, over, settle, pull, back): the right foot
steps through and the hips and chest unwind. Each move here changes where the blade comes from, where it goes after
the hit, how low the body gets, and which frames carry the weight.
"""
from clips.kit import *

def blade_set(mod, key, reach):
    G, LIFT, COIL, STEP, HIT, OVER, SET, PULL, BACK = (mod.GUARD, mod.A1_LIFT, mod.A1_COIL, mod.A1_STEP, mod.A1_HIT, mod.A1_OVER, mod.A1_SETTLE, mod.A1_PULL, mod.A1_BACK)
    def K(base, hand, aim, **kw):
        d = dict(base); d[key] = hand; d[key + '_aim'] = aim; d.update(kw); return d
    def at(turn, pitch, over=0.0): return reach_hand(reach, turn, pitch, over)
    step_air = sup(air_R=(5, 6, 12, 13)); out = {}

    # 올려베기: the blade drops to the low left and comes up through the target
    out['rise'] = clip('올려베기', [(0, G, 'linear'), (2, K(LIFT, (-16, 10, 44), (20, -25)), 'inout'), (4, K(COIL, (-19, 0, 43), (25, -45)), 'inout'),
        (6, K(STEP, (-12, 28, 41), (10, -25)), 'in'), (7, K(HIT, at(-6, 5), (-6, 5)), 'snap'), (8, K(OVER, (-12, 62, 66), (-30, 50)), 'out'),
        (9, K(SET, (-14, 58, 72), (-38, 62)), 'inout'), (11, K(PULL, (-18, 36, 62), (-10, 50)), 'inout'), (13, BACK, 'inout'), (14, G, 'out')], support=step_air,
        notes='검을 몸 앞 아래로 내렸다가 표적을 지나 오른쪽 위로 올려 벤다.')
    # 전진 찌르기: straight line from the hip
    out['thrust'] = clip('전진 찌르기', [(0, G, 'linear'), (2, K(LIFT, (-25, -2, 56), (0, 20)), 'inout'), (4, K(COIL, (-23, -16, 52), (4, 2)), 'inout'),
        (6, K(STEP, (-21, 6, 50), (5, 0)), 'in'), (7, K(HIT, at(5, -3), (5, -3)), 'snap'), (8, K(OVER, at(5, -3, 6), (5, -3)), 'out'),
        (9, K(SET, at(5, -3, -3), (5, -3)), 'inout'), (11, K(PULL, (-14, 40, 52), (5, 15)), 'inout'), (13, BACK, 'inout'), (14, G, 'out')], support=step_air,
        notes='허리 옆에서 곧게 찌른다. 끝에서 6px 더 밀고 들어갔다가 돌아온다.')
    # 수평 베기: from far right, level, across the target
    out['level'] = clip('수평 베기', [(0, G, 'linear'), (2, K(LIFT, (-30, 2, 58), (-40, 30)), 'inout'), (4, K(COIL, (-32, -6, 56), (-80, 8)), 'inout'),
        (6, K(STEP, (-30, 30, 50), (-45, 2)), 'in'), (7, K(HIT, at(20, 0), (20, 0)), 'snap'), (8, K(OVER, (6, 60, 45), (70, -2)), 'out'),
        (9, K(SET, (10, 54, 46), (85, -4)), 'inout'), (11, K(PULL, (-18, 38, 60), (0, 30)), 'inout'), (13, BACK, 'inout'), (14, G, 'out')], support=step_air,
        notes='오른쪽 바깥에서 가슴 높이로 수평으로 베고 왼쪽으로 지나간다.')
    # 찌르고 올려베기: two touches in one clip
    out['double'] = clip('찌르고 올려베기', [(0, G, 'linear'), (2, K(COIL, (-23, -14, 52), (4, 2)), 'inout'), (4, K(STEP, (-21, 6, 50), (5, 0)), 'in'),
        (5, K(HIT, at(5, -3), (5, -3)), 'snap'), (6, K(OVER, at(5, -3, 5), (5, -3)), 'out'), (7, K(SET, (-8, 46, 38), (20, -30)), 'inout'),
        (8, K(HIT, at(-6, 5), (-6, 5)), 'snap'), (9, K(OVER, (-12, 62, 66), (-30, 50)), 'out'), (10, K(SET, (-14, 58, 72), (-38, 62)), 'inout'),
        (12, K(PULL, (-18, 36, 62), (-10, 50)), 'inout'), (13, BACK, 'inout'), (14, G, 'out')], impact=6, impact2=9, support=sup(air_R=(3, 4, 13)),
        durations=[100, 90, 110, 110, 60, 45, 60, 100, 45, 60, 170, 90, 90, 90, 100], sheet=[0, 2, 5, 7, 8, 10],
        notes='6번에 찌르고, 검을 낮게 돌려 9번에 올려 벤다.')
    # 도약 내려베기: both feet leave the ground
    air = {'foot.L': foot((8, 14), 0, air=8), 'foot.R': foot((-9, 0), 30, air=8)}; air2 = {'foot.L': foot((8, 18), 0, air=10), 'foot.R': foot((-9, 16), 25, air=10)}
    out['leap'] = clip('도약 내려베기', [(0, G, 'linear'),
        (3, K(G, (-25, -2, 50), (-10, 40), pelvis=(-1, -4, 36), hip_turn=30, chest_turn=44, chest_lean=12), 'inout'),
        (5, K(G, (-25, 4, 92), (-4, 105), pelvis=(0, 4, 52), hip_turn=10, chest_turn=16, chest_lean=-6, **air), 'out'),
        (6, K(G, (-25, 16, 94), (0, 75), pelvis=(0, 14, 54), hip_turn=0, chest_turn=0, chest_lean=-8, **air2), 'inout'),
        (7, K(HIT, at(4, -40), (4, -40), pelvis=(-2, 26, 35), chest_lean=26), 'snap'), (8, K(OVER, (0, 72, 54), (4, -62), pelvis=(-2, 27, 34), chest_lean=28), 'out'),
        (9, K(SET, (-2, 70, 58), (6, -50), pelvis=(-2, 26, 35.5)), 'inout'), (11, K(PULL, (-14, 42, 60), (6, 10)), 'inout'), (13, BACK, 'inout'), (14, G, 'out')],
        support=sup(air_L=(4, 5, 6), air_R=(4, 5, 6, 12, 13)), durations=[100, 90, 100, 130, 90, 90, 110, 45, 60, 190, 100, 90, 80, 80, 100], sheet=[0, 3, 6, 7, 9, 12],
        notes='5~7번에 두 발이 뜨고, 머리 위에서 수직으로 내려 베며 8번에 착지한다.')
    # 낮게 숨겼다 올려베기 (기습, 선등)
    out['ambush'] = clip('낮게 숨겼다 올려베기', [(0, G, 'linear'),
        (3, K(COIL, (-26, -16, 34), (-30, -35), pelvis=(-2, -8, 34), chest_lean=14), 'inout'), (5, K(COIL, (-27, -20, 31), (-34, -40), pelvis=(-3, -11, 32), chest_lean=18), 'inout'),
        (6, K(STEP, (-16, 20, 30), (-20, -15), pelvis=(-1, 8, 35), chest_lean=16), 'in'), (7, K(HIT, at(-8, 15), (-8, 15), pelvis=(-2, 26, 35), chest_lean=26), 'snap'),
        (8, K(OVER, (-14, 60, 80), (-25, 70), pelvis=(-2, 28, 43), chest_lean=6), 'out'), (10, K(SET, (-15, 58, 82), (-28, 74), pelvis=(-2, 27, 42), chest_lean=8), 'inout'),
        (12, K(PULL, (-18, 36, 62), (-10, 50)), 'inout'), (13, BACK, 'inout'), (14, G, 'out')], support=sup(air_R=(6, 13)), durations=D_SKILL, sheet=[0, 5, 6, 7, 10, 12],
        notes='무릎을 깊이 접고 검을 몸 뒤 아래에 숨겼다가, 다리부터 펴며 아래에서 위로 가른다. 타격 뒤 몸이 솟는다.')
    # 강한 대각 내려베기 (선봉 불퇴, 관문의 맹장, 선봉 돌파)
    out['cleave'] = clip('강한 대각 내려베기', [(0, G, 'linear'), (2, LIFT, 'inout'),
        (4, K(COIL, (-25, -16, 86), (8, 120), pelvis=(-2, -10, 38)), 'inout'), (5, K(COIL, (-25, -17, 87), (8, 123), pelvis=(-2, -11, 37.5)), 'out'),
        (6, STEP, 'in'), (7, K(HIT, at(8, -25), (8, -25), pelvis=(-2, 27, 35), chest_lean=26), 'snap'),
        (8, K(OVER, (6, 62, 38), (45, -50), pelvis=(-2, 28, 34), chest_lean=30), 'out'), (10, K(SET, (2, 60, 42), (38, -42), pelvis=(-2, 27, 35.5), chest_lean=26), 'inout'),
        (12, PULL, 'inout'), (13, BACK, 'inout'), (14, G, 'out')], support=sup(air_R=(6, 13)), durations=D_SKILL, sheet=[0, 5, 6, 7, 10, 12],
        notes='평타와 같은 오른쪽 위에서 왼쪽 아래 방향이지만 더 높이 들고 더 낮게 내려앉으며 깊게 벤다.')
    # 낮은 수평 휩쓸기 (설중분단, 폭정)
    out['sweep'] = clip('낮은 수평 휩쓸기', [(0, G, 'linear'),
        (3, K(COIL, (-30, -8, 48), (-100, 0), pelvis=(-2, -9, 35)), 'inout'), (5, K(COIL, (-31, -10, 47), (-110, 0), pelvis=(-3, -11, 33)), 'inout'),
        (6, K(STEP, (-32, 28, 46), (-55, 0), pelvis=(-1, 8, 35)), 'in'), (7, K(HIT, at(20, 0), (20, 0), pelvis=(-2, 26, 34), chest_lean=24), 'snap'),
        (8, K(OVER, (8, 58, 45), (75, 0), pelvis=(-2, 27, 34)), 'out'), (10, K(SET, (16, 44, 46), (110, 0), pelvis=(-2, 26, 35), chest_turn=-60), 'inout'),
        (11, K(SET, (0, 58, 50), (60, 10)), 'inout'), (12, K(PULL, (-18, 38, 60), (0, 30)), 'inout'), (13, BACK, 'inout'), (14, G, 'out')], support=sup(air_R=(6, 13)), durations=D_SKILL, sheet=[0, 5, 6, 7, 10, 12],
        notes='두 무릎을 크게 접고 검을 몸 뒤로 뺐다가, 허리 높이에서 폭넓게 한 번 휩쓴다.')
    # 돌아 베기: one turn on a low hop, then the cut
    def C(theta, pz, air=0.0, fixed=False):
        fl, fr = ((8, 12), (-9, -12)) if fixed else (rot((8, 10), theta), rot((-9, -10), theta)); yaw = 0 if fixed else theta
        h = rot((-24, 16), theta); l = rot((16, 10), theta); p = rot((0, 2), theta)
        d = K(G, (h[0], h[1], 56), (-55 - theta, 4), pelvis=(p[0], p[1], pz), hip_turn=10 + theta, chest_turn=14 + theta, chest_lean=6,
              **{'hand.L': (l[0], l[1], 58), 'foot.L': foot(fl, 5 + yaw, air=air), 'foot.R': foot(fr, 45 + yaw, air=air)})
        if 'swordL' in G: l2 = rot((18, 14), theta); d['swordL'] = (l2[0], l2[1], 60); d['swordL_aim'] = (40 - theta, 30)      # the other weapon turns with the body
        return d
    step = K(STEP, (-27, 8, 86), (-14, 72))
    out['spin'] = posed('돌아 베기', [G, blend(G, C(30, 40, fixed=True), 0.6), C(45, 38, fixed=True), C(-40, 40, 3), C(-130, 41, 4), C(-220, 41, 4), C(-310, 40, 3),
                                    step, K(HIT, at(8, -25), (8, -25)), OVER, SET, blend(SET, PULL, 0.5), PULL, BACK, G], impact=9,
                        support=[('L', 'R')] * 3 + [()] * 4 + [('L',)] + [('L', 'R')] * 5 + [('L',), ('L', 'R')],
                        durations=[100, 100, 150, 50, 50, 55, 60, 60, 45, 60, 170, 90, 90, 90, 100], sheet=[0, 2, 4, 6, 8, 10],
                        notes='오른쪽으로 감았다가 4~7번에 낮게 뜬 채 한 바퀴 돌고, 그 힘으로 내딛으며 9번에 벤다.')
    return out, K, at
