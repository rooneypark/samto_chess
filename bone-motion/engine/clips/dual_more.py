"""쌍무기: 평타 A2, A3, B1, B2, B3 and 전법 S1..S6. Both hands must really do something.

    A2 올려베기 (우)            A3 교차 베기: both blades come down through the target and cross
    B1 수평 베기 (우)           B2 찌르고 올려베기 (우)       B3 도약 내려베기
    S1 인의 (유비)     low gather, then both swords open wide. Nothing is struck.
    S2 악래 (전위)     both weapons crossed in front of the chest, then spread into two wide arcs. Nothing is struck.
    S3 소패왕 (손책)   compress, then burst open with the two weapons at different heights. Nothing is struck.
    S4 낮게 숨겼다 올려베기   S5 강한 대각 내려베기   S6 돌아 베기   (공용)
Every basic attack uses both swords (the left guards low, cuts back, thrusts second, or comes down with the right).
In the three shared skills the right sword cuts and the left keeps its guard.
"""
from clips.kit import *
from clips.blades import blade_set

def build(mod):
    moves, K, at = blade_set(mod, 'swordR', 30.0); G, LIFT, COIL, STEP, HIT, OVER, SET, PULL, BACK = (mod.GUARD, mod.A1_LIFT, mod.A1_COIL, mod.A1_STEP, mod.A1_HIT, mod.A1_OVER, mod.A1_SETTLE, mod.A1_PULL, mod.A1_BACK)
    def named(m, title, who=''): d = dict(moves[m]); d['title'] = title; d['notes'] = (who + ' ' if who else '') + d['notes'] + ' 왼 검은 가슴 앞에서 받친다.'; return d
    out = {'a2': named('rise', 'A2 올려베기'), 'b1': named('level', 'B1 수평 베기'), 'b2': named('double', 'B2 찌르고 올려베기'), 'b3': named('leap', 'B3 도약 내려베기'),
           's4': named('ambush', 'S4 낮게 숨겼다 올려베기', '공용 전법.'), 's5': named('cleave', 'S5 강한 대각 내려베기', '공용 전법.'), 's6': named('spin', 'S6 돌아 베기', '공용 전법.')}
    def B(base, r, ra, l, la, **kw):
        d = dict(base); d.update(swordR=r, swordR_aim=ra, swordL=l, swordL_aim=la); d.update(kw); return d

    # A3 교차 베기: the body squares up so both hands reach, and the two blades meet on the target
    sq = dict(hip_turn=-5, chest_turn=0, chest_lean=18)
    out['a3'] = clip('A3 교차 베기', [(0, G, 'linear'),
        (2, B(LIFT, (-27, -4, 72), (-12, 86), (24, 6, 70), (14, 84)), 'inout'), (4, B(COIL, (-26, -8, 86), (16, 112), (26, -2, 84), (-14, 110), chest_turn=30), 'inout'),
        (6, B(STEP, (-27, 10, 86), (-10, 72), (26, 12, 84), (10, 72), chest_turn=10), 'in'),
        (7, B(HIT, reach_hand(30, 15, -10), (15, -10), reach_hand(30, -15, -10), (-15, -10), pelvis=(0, 30, 37), **sq), 'snap'),
        (8, B(OVER, (3, 60, 44), (44, -40), (-3, 58, 46), (-44, -40), pelvis=(0, 31, 36.5), **sq), 'out'),
        (9, B(SET, (1, 58, 46), (38, -34), (-1, 56, 48), (-38, -34), pelvis=(0, 29, 37.5), **sq), 'inout'),
        (11, B(PULL, (-16, 40, 58), (-6, 30), (16, 34, 58), (8, 40), chest_turn=-4), 'inout'), (13, BACK, 'inout'), (14, G, 'out')],
        support=sup(air_R=(5, 6, 12, 13)), notes='두 검을 양 어깨 위로 들었다가 몸을 정면으로 돌리며 함께 내려 벤다. 두 날이 표적에서 만나고 교차해 지나간다.')

    # Skills where nothing is struck: gather, then open
    def opening(title, who, low, high, lean_low, lean_high, pz_low, pz_high, heel=0):
        (lr, lra, ll, lla), (hr, hra, hl, hla) = low, high
        lowp = lambda dz=0: B(G, lr, lra, ll, lla, pelvis=(0, -2, pz_low - dz), hip_turn=6, chest_turn=6, chest_lean=lean_low)
        feet = {'foot.L': foot((8, 12), 5, heel=heel), 'foot.R': foot((-9, -12), 45, heel=heel)}
        highp = lambda dz=0: B(G, hr, hra, hl, hla, pelvis=(0, 2, pz_high + dz), hip_turn=4, chest_turn=4, chest_lean=lean_high, **feet)
        return clip(title, [(0, G, 'linear'), (3, lowp(-2), 'inout'), (5, lowp(), 'inout'), (6, lowp(1), 'out'), (7, highp(), 'snap'), (8, highp(1.2), 'out'), (10, highp(), 'inout'),
                            (12, B(G, (-25, 10, 60), (-24, 62), (19, 18, 60), (22, 56), pelvis=(0, 1, 42.5)), 'inout'), (14, G, 'inout')],
                    impact=8, event='발동', durations=D_CAST, sheet=[0, 3, 6, 7, 10, 12], notes=who)
    out['s1'] = opening('S1 인의', '유비 전법. 무릎과 가슴을 깊게 낮춰 두 검을 몸 앞 낮은 곳에 모았다가, 허리부터 일어서며 좌우로 크게 연다. 닿는 공격이 아니다.',
                        ((-10, 24, 34), (10, -20), (10, 24, 34), (-10, -20)), ((-36, 10, 74), (-50, 45), (36, 10, 74), (50, 45)), 22, -8, 33, 43)
    out['s2'] = opening('S2 악래', '전위 전법. 두 무기를 가슴 앞에서 교차했다가(오른손이 앞), 지면을 밀며 각각 넓은 바깥 호로 벌린다. 닿는 공격이 아니다.',
                        ((6, 30, 60), (30, 60), (-6, 22, 56), (-30, 60)), ((-38, 8, 56), (-70, 20), (38, 8, 56), (70, 20)), 14, -6, 34, 40)
    out['s3'] = opening('S3 소패왕', '손책 전법. 두 무기를 가슴 앞에 모으며 몸을 압축했다가, 바닥을 밀어 서로 다른 높이의 바깥 위로 폭발하듯 벌린다. 닿는 공격이 아니다.',
                        ((-12, 20, 50), (0, 80), (12, 22, 50), (0, 80)), ((-34, 6, 92), (-35, 65), (38, 14, 58), (65, 15)), 16, -10, 32, 45, heel=5)

    # ---- both hands in the basic attacks too (user review 2026-11-18: the left sword only stood guard) ---------------
    lh = lambda turn, pitch, over=0.0: reach_hand(30, turn, pitch, over)
    square = dict(pelvis=(0, 30, 37), hip_turn=-5, chest_turn=0, chest_lean=18)
    # A2: the right sword cuts upward while the left drops into a low guard in front of the lead leg
    out['a2'] = clip('A2 올려베기·하단 막기', [(0, G, 'linear'), (2, B(LIFT, (-16, 10, 44), (20, -25), (20, 22, 62), (20, 50)), 'inout'), (4, B(COIL, (-19, 0, 43), (25, -45), (16, 28, 66), (10, 60)), 'inout'),
        (6, B(STEP, (-12, 28, 41), (10, -25), (18, 30, 54), (0, 10)), 'in'), (7, B(HIT, at(-6, 5), (-6, 5), (16, 44, 40), (-10, -35)), 'snap'),
        (8, B(OVER, (-12, 62, 66), (-30, 50), (17, 45, 37), (-12, -40)), 'out'), (9, B(SET, (-14, 58, 72), (-38, 62), (16, 44, 40), (-10, -35)), 'inout'),
        (11, B(PULL, (-18, 36, 62), (-10, 50), (16, 30, 56), (10, 40)), 'inout'), (13, BACK, 'inout'), (14, G, 'out')], support=sup(air_R=(5, 6, 12, 13)),
        notes='오른 검이 아래에서 위로 올려 베는 동안, 왼 검은 앞다리 앞으로 내려가 아래를 막는다.')
    # B1: right level cut, then the left sword cuts back along the same line
    out['b1'] = clip('B1 좌우 연속 베기', [(0, G, 'linear'), (2, B(LIFT, (-30, 2, 58), (-40, 30), (20, 20, 60), (22, 54)), 'inout'), (4, B(COIL, (-32, -6, 56), (-80, 8), (22, 24, 60), (40, 40)), 'inout'),
        (5, B(STEP, (-30, 30, 50), (-45, 2), (26, 26, 56), (70, 10)), 'in'), (6, B(HIT, at(20, 0), (20, 0), (30, 30, 50), (80, 5)), 'snap'),
        (7, B(OVER, (6, 60, 45), (70, -2), (30, 40, 48), (60, 2), **square), 'out'), (8, B(OVER, (-4, 56, 50), (60, 20), lh(-20, 0), (-20, 0), **square), 'snap'),
        (9, B(SET, (-10, 50, 54), (40, 30), (-4, 64, 45), (-70, -2), **square), 'out'), (10, B(SET, (-12, 48, 56), (30, 36), (-8, 58, 46), (-85, -4), **square), 'inout'),
        (12, B(PULL, (-16, 40, 58), (-6, 30), (16, 34, 58), (8, 40), chest_turn=-4), 'inout'), (13, BACK, 'inout'), (14, G, 'out')], impact=7, impact2=9,
        support=sup(air_R=(5, 13)), durations=[100, 90, 90, 100, 130, 50, 45, 70, 45, 60, 170, 90, 90, 90, 100], sheet=[0, 4, 6, 7, 8, 10],
        notes='7번에 오른 검이 가로로 베고, 몸을 정면으로 돌리며 9번에 왼 검이 반대 방향으로 되벤다.')
    # B2: right thrust, left thrust
    out['b2'] = clip('B2 좌우 연속 찌르기', [(0, G, 'linear'), (2, B(COIL, (-23, -14, 52), (4, 2), (19, 18, 58), (22, 54)), 'inout'), (4, B(STEP, (-21, 6, 50), (5, 0), (20, 16, 54), (10, 20)), 'in'),
        (5, B(HIT, at(5, -3), (5, -3), (22, 16, 52), (5, 5)), 'snap'), (6, B(OVER, at(5, -3, 5), (5, -3), (22, 20, 50), (0, 0)), 'out'),
        (8, B(SET, (-12, 46, 50), (10, 10), (14, 44, 47), (-4, -2), **square), 'in'), (9, B(SET, (-16, 40, 54), (10, 30), lh(-5, -3), (-5, -3), **square), 'snap'),
        (10, B(SET, (-16, 40, 54), (10, 30), lh(-5, -3, 3), (-5, -3), pelvis=(0, 31, 36.5), hip_turn=-5, chest_turn=4, chest_lean=20), 'out'),
        (11, B(SET, (-16, 40, 54), (10, 30), lh(-5, -3, -3), (-5, -3), **square), 'inout'), (12, B(PULL, (-16, 40, 58), (-6, 30), (16, 34, 58), (8, 40), chest_turn=-4), 'inout'),
        (13, BACK, 'inout'), (14, G, 'out')], impact=6, impact2=10, support=sup(air_R=(3, 4, 13)), durations=[100, 90, 110, 110, 60, 45, 60, 80, 90, 45, 60, 170, 90, 90, 100], sheet=[0, 2, 5, 8, 9, 11],
        notes='6번에 오른 검으로 찌르고, 몸을 정면으로 돌리며 10번에 왼 검으로 찌른다.')
    # B3: both swords overhead in the air, both come down
    air = {'foot.L': foot((8, 14), 0, air=8), 'foot.R': foot((-9, 0), 30, air=8)}; air2 = {'foot.L': foot((8, 18), 0, air=10), 'foot.R': foot((-9, 16), 25, air=10)}
    out['b3'] = clip('B3 도약 쌍검 내려베기', [(0, G, 'linear'),
        (3, B(G, (-25, -2, 50), (-10, 40), (22, 4, 50), (10, 40), pelvis=(-1, -4, 36), hip_turn=20, chest_turn=24, chest_lean=12), 'inout'),
        (5, B(G, (-25, 4, 92), (-4, 105), (25, 6, 90), (4, 105), pelvis=(0, 4, 52), hip_turn=6, chest_turn=8, chest_lean=-6, **air), 'out'),
        (6, B(G, (-25, 16, 94), (0, 75), (25, 16, 92), (0, 75), pelvis=(0, 14, 54), hip_turn=0, chest_turn=0, chest_lean=-8, **air2), 'inout'),
        (7, B(HIT, reach_hand(30, 12, -40), (12, -40), lh(-12, -40), (-12, -40), pelvis=(0, 30, 35), hip_turn=-5, chest_turn=0, chest_lean=24), 'snap'),
        (8, B(OVER, (2, 66, 50), (20, -62), (-2, 64, 52), (-20, -62), pelvis=(0, 31, 34), hip_turn=-5, chest_turn=0, chest_lean=27), 'out'),
        (9, B(SET, (0, 64, 54), (16, -50), (-1, 62, 56), (-16, -50), pelvis=(0, 30, 35.5), hip_turn=-5, chest_turn=0, chest_lean=22), 'inout'),
        (11, B(PULL, (-16, 40, 58), (-6, 30), (16, 34, 58), (8, 40), chest_turn=-4), 'inout'), (13, BACK, 'inout'), (14, G, 'out')],
        support=sup(air_L=(4, 5, 6), air_R=(4, 5, 6, 12, 13)), durations=[100, 90, 100, 130, 90, 90, 110, 45, 60, 190, 100, 90, 80, 80, 100], sheet=[0, 3, 6, 7, 9, 12],
        notes='5~7번에 두 발이 뜨고, 두 검을 머리 위에서 함께 내려 벤다. 8번에 착지하며 타격.')
    return out
