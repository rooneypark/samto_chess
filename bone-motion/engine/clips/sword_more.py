"""한손 검·단도: 평타 A2, A3, B1, B2, B3 and 전법 S1..S6.

Nine heroes use this type, so the six skills are six kinds of motion and each hero's skill uses the closest one:
    S1 낮게 숨겼다 올려베기   악진 선등, 위연 기습
    S2 강한 대각 내려베기     요화 선봉 불퇴, 화웅 관문의 맹장, 안량 선봉 돌파
    S3 낮은 수평 휩쓸기       정봉 설중분단, 동탁 폭정
    S4 검으로 지시            주유 화공 (nothing is struck)
    S5 막아서기               주창 호위 (nothing is struck)
    S6 돌아 베기              공용
"""
from clips.kit import *
from clips.blades import blade_set

def build(mod):
    moves, K, at = blade_set(mod, 'sword', 34.0); G, STEP, HIT, PULL, BACK = mod.GUARD, mod.A1_STEP, mod.A1_HIT, mod.A1_PULL, mod.A1_BACK
    def named(m, title, **kw): d = dict(moves[m]); d['title'] = title; d.update(kw); return d
    out = {'a2': named('rise', 'A2 올려베기'), 'a3': named('thrust', 'A3 전진 찌르기'), 'b1': named('level', 'B1 수평 베기'),
           'b2': named('double', 'B2 찌르고 올려베기'), 'b3': named('leap', 'B3 도약 내려베기'),
           's1': named('ambush', 'S1 낮게 숨겼다 올려베기'), 's2': named('cleave', 'S2 막고 받아치기'), 's3': named('sweep', 'S3 낮은 수평 휩쓸기'),
           's6': named('spin', 'S6 돌아 베기')}
    for k, who in (('s1', '악진 선등, 위연 기습.'), ('s2', '요화 선봉 불퇴, 화웅 관문의 맹장, 안량 선봉 돌파.'), ('s3', '정봉 설중분단, 동탁 폭정.'), ('s6', '공용 전법.')):
        out[k]['notes'] = who + ' ' + out[k]['notes']

    # S4 검으로 지시 (주유 화공): gather at the chest, raise overhead, bring the sword down pointing at the zone
    out['s4'] = clip('S4 검으로 지시', [(0, G, 'linear'),
        (3, K(G, (-8, 20, 62), (-30, 60), pelvis=(0, -4, 40), chest_lean=10, **{'hand.L': (10, 22, 58)}), 'inout'),
        (5, K(G, (-24, 6, 96), (-12, 82), pelvis=(0, -2, 45), chest_lean=-6, **{'hand.L': (14, 18, 60)}), 'inout'),
        (6, K(G, (-24, 5, 98), (-12, 84), pelvis=(0, -2, 45.5), chest_lean=-7, **{'hand.L': (14, 18, 60)}), 'out'),
        (7, K(STEP, (-16, 36, 86), (0, 30)), 'in'), (8, K(HIT, (-10, 62, 72), (5, -12), pelvis=(-2, 22, 40), chest_lean=12), 'snap'),
        (9, K(HIT, (-9, 65, 70), (5, -18), pelvis=(-2, 23, 39.5), chest_lean=14), 'out'), (11, K(HIT, (-10, 62, 72), (5, -12), pelvis=(-2, 22, 40), chest_lean=12), 'inout'),
        (12, K(PULL, (-16, 40, 60), (5, 20)), 'inout'), (13, BACK, 'inout'), (14, G, 'out')], impact=9, event='발동', support=sup(air_R=(7, 13)),
        durations=D_CAST, sheet=[0, 3, 6, 8, 11, 12], notes='주유 화공. 검을 가슴에 모았다가 머리 위로 올려 멈추고, 내딛으며 범위를 향해 내려 가리킨다. 닿는 공격이 아니다.')

    # S5 막아서기 (주창 호위): side step, sword upright in front of the chest, the free hand opens toward the ally
    def wall(pz, hand, left, lean=10): return K(G, hand, (0, 87), pelvis=(5, 2, pz), hip_turn=0, chest_turn=0, chest_lean=lean, **{'hand.L': left, 'foot.L': foot((22, 8), -8)})
    out['s5'] = clip('S5 막아서기', [(0, G, 'linear'),
        (3, K(G, (-12, 22, 58), (-5, 80), pelvis=(3, 0, 41), hip_turn=10, chest_turn=12, **{'hand.L': (20, 14, 58), 'foot.L': foot((18, 8), 0, air=6)}), 'inout'),
        (5, wall(36, (-6, 28, 58), (30, 10, 62)), 'in'), (7, wall(37.5, (-6, 30, 62), (36, 4, 66), 6), 'snap'), (8, wall(38.2, (-6, 31, 63), (37, 3, 67), 5), 'out'),
        (10, wall(37.5, (-6, 30, 62), (36, 4, 66), 6), 'inout'),
        (12, K(G, (-14, 20, 56), (-12, 70), pelvis=(3, 1, 41), **{'hand.L': (20, 14, 58), 'foot.L': foot((22, 8), -8)}), 'inout'),
        (13, K(G, (-22, 10, 54), (-20, 62), pelvis=(1, 0, 43), **{'foot.L': foot((12, 10), 4, air=4)}), 'inout'), (14, G, 'out')], impact=8, event='발동',
        support=sup(air_L=(1, 2, 3, 4, 13)), durations=D_CAST, sheet=[0, 3, 5, 7, 10, 12],
        notes='주창 호위. 왼발을 옆으로 넓게 딛고 낮게 앉아, 검을 가슴 앞에 세우고 빈손을 아군 쪽으로 연다. 닿는 공격이 아니다.')
    return out
