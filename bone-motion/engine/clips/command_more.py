"""군령: 평타 A2, A3, B1, B2, B3 and 전법 S1..S6. Signals and direct strikes are different moves.

    A1 지목 (signal, in command.py)   A2 높이 들어 호령 (signal)   A3 직접 베기 (the sword really reaches the target)
    B1 좌수 지시 (signal)             B2 수평 지시 (signal)        B3 직접 찌르기 (reaches the target)
    S1 위무지세 (조조)       the commanding arm goes up overhead and comes down forward.
    S2 강동의 주인 (손권)    sword in front and free hand at the chest, then both open wide.
    S3 명문의 위세 (원소)    weapon held high at the side, the free hand sweeps up from outside to the front.
    S4 진격령   S5 수비령   S6 총공격령   (공용)
Nothing is struck in any of the skills.
"""
from clips.kit import *

REACH = 30.0

def build(mod):
    G, RISE, GATHER, GATHER2, STEP, POINT, OVER, HOLD, RETURN, BACK = (mod.GUARD, mod.A1_RISE, mod.A1_GATHER, mod.A1_GATHER2, mod.A1_STEP, mod.A1_POINT, mod.A1_OVER, mod.A1_HOLD, mod.A1_RETURN, mod.A1_BACK)
    def P(base, sword, aim, left=None, **kw):
        d = dict(base); d['sword'] = sword; d['sword_aim'] = aim
        if left: d['hand.L'] = left
        d.update(kw); return d
    DC = [100, 100, 100, 110, 120, 160, 50, 45, 70, 110, 210, 100, 90, 90, 100]; step = sup(air_R=(6, 13)); out = {}
    def signal(title, gather, point, over, notes, left=None, durations=None):
        return clip(title, [(0, G, 'linear'), (2, RISE, 'inout'), (4, gather, 'inout'), (5, gather, 'out'), (6, STEP, 'in'), (7, point, 'snap'), (8, over, 'out'), (10, point, 'inout'),
                            (12, RETURN, 'inout'), (13, BACK, 'inout'), (14, G, 'out')], impact=8, event='지시(피해 없음)', support=step, durations=durations or DC, sheet=[0, 5, 6, 7, 10, 12], notes=notes)
    out['a2'] = signal('A2 높이 들어 호령', P(GATHER, (-24, 2, 92), (-10, 84)), P(POINT, (-22, 30, 100), (-4, 72)), P(OVER, (-22, 32, 102), (-4, 70)),
                       '검을 머리 위로 높이 치켜들어 호령한다. 닿는 공격이 아니다.')
    out['b1'] = signal('B1 좌수 지시', P(GATHER, (-24, 4, 60), (-20, 70), (14, 10, 60)), P(POINT, (-26, 10, 58), (-24, 66), (10, 52, 76), chest_turn=24),
                       P(OVER, (-26, 10, 58), (-24, 66), (10, 55, 77), chest_turn=28), '검은 몸 옆에 세워 두고 빈 왼손을 뻗어 표적을 가리킨다. 닿는 공격이 아니다.')
    out['b2'] = signal('B2 수평 지시', P(GATHER, (-30, 0, 70), (-80, 10)), P(POINT, (-12, 56, 72), (10, 2)), P(OVER, (-4, 56, 72), (40, 0)),
                       '검을 오른쪽 바깥에서 수평으로 돌려 전선을 긋듯 정면을 가리킨다. 닿는 공격이 아니다.')
    far = {'foot.R': foot((-9, 40), 15)}
    def strike(title, gather, swing, turn, pitch, over, settle, notes):
        return clip(title, [(0, G, 'linear'), (2, RISE, 'inout'), (4, gather, 'inout'), (6, swing, 'in'),
            (7, P(POINT, reach_hand(REACH, turn, pitch), (turn, pitch), pelvis=(0, 26, 39), chest_lean=18, **far), 'snap'), (8, P(OVER, over[0], over[1], pelvis=(0, 27, 38.5), chest_lean=20, **far), 'out'),
            (9, P(HOLD, settle[0], settle[1], pelvis=(0, 25, 39.5), chest_lean=16, **far), 'inout'), (11, P(RETURN, (-16, 40, 60), (5, 10), pelvis=(0, 18, 41), **far), 'inout'),
            (13, BACK, 'inout'), (14, G, 'out')], impact=8, support=sup(air_R=(5, 6, 12, 13)), sheet=[0, 4, 6, 7, 9, 12], notes=notes)
    out['a3'] = strike('A3 직접 베기', P(GATHER, (-25, -8, 84), (8, 118)), P(STEP, (-27, 8, 86), (-10, 72)), 8, -25, ((4, 68, 48), (40, -40)), ((2, 66, 52), (32, -30)),
                       '신호가 아니라 직접 벤다. 크게 내딛으며 오른쪽 위에서 왼쪽 아래로 베고, 검끝이 표적에 닿는다.')
    out['b3'] = strike('B3 직접 찌르기', P(GATHER, (-24, -10, 54), (4, 4)), P(STEP, (-22, 8, 52), (5, 0)), 5, -3, (reach_hand(REACH, 5, -3, 6), (5, -3)), (reach_hand(REACH, 5, -3, -3), (5, -3)),
                       '직접 찌른다. 검을 허리 옆으로 당겼다가 크게 내딛으며 곧게 찌르고, 검끝이 표적에 닿는다.')

    def order(title, who, keys, durations=None, air_R=(), air_L=()):
        return clip(title, keys, impact=8, event='발동', support=sup(air_R=air_R, air_L=air_L), durations=durations or D_CAST, sheet=[0, 3, 6, 7, 10, 12], notes=who)
    def B(pelvis, lean, sword, aim, left, **kw): return P(G, sword, aim, left, pelvis=pelvis, chest_lean=lean, **kw)
    out['s1'] = order('S1 위무지세', '조조 전법. 무릎을 낮추고 상체를 뒤로 감아 왼팔을 머리 위까지 크게 올렸다가, 몸을 밀어 세우며 가슴과 팔을 전방 아래로 크게 내린다. 검도 함께 앞을 향한다.', [
        (0, G, 'linear'), (3, B((0, -4, 38), -6, (-26, 4, 60), (-20, 70), (22, 0, 80)), 'inout'), (5, B((0, -6, 36), -12, (-27, 2, 62), (-22, 74), (20, -8, 104)), 'inout'),
        (6, B((0, -6.5, 35.5), -13, (-27, 2, 62), (-22, 74), (20, -9, 105)), 'out'), (7, B((0, 6, 44), 14, (-18, 40, 66), (0, -5), (16, 44, 58), chest_turn=0), 'snap'),
        (8, B((0, 7, 43.6), 17, (-18, 43, 64), (0, -10), (16, 47, 54), chest_turn=0), 'out'), (10, B((0, 6, 44), 14, (-18, 40, 66), (0, -5), (16, 44, 58), chest_turn=0), 'inout'),
        (12, B((0, 2, 44.5), 5, (-24, 16, 58), (-20, 50), (18, 14, 52)), 'inout'), (14, G, 'inout')])
    out['s2'] = order('S2 강동의 주인', '손권 전법. 검을 몸 앞에 세우고 빈손을 가슴에 모으며 낮췄다가, 가슴을 펴며 검은 바깥으로 크게 열고 빈손은 아군을 감싸듯 넓은 호를 그린다.', [
        (0, G, 'linear'), (3, B((0, -2, 40), 8, (-8, 26, 60), (-4, 84), (8, 16, 62)), 'inout'), (5, B((0, -3, 36), 14, (-8, 28, 56), (-4, 86), (6, 14, 60)), 'inout'),
        (7, B((0, 3, 45), -8, (-36, 8, 72), (-55, 40), (34, 14, 70), chest_turn=4), 'snap'), (8, B((0, 4, 45.6), -10, (-37, 7, 74), (-58, 42), (36, 12, 72), chest_turn=4), 'out'),
        (10, B((0, 3, 45), -8, (-36, 8, 72), (-55, 40), (34, 14, 70), chest_turn=4), 'inout'), (12, B((0, 1, 44.5), 2, (-26, 10, 58), (-28, 62), (20, 10, 54)), 'inout'), (14, G, 'inout')])
    out['s3'] = order('S3 명문의 위세', '원소 전법. 넓게 버티고 어깨를 뒤로 열며 무기를 몸 옆에 높이 세운 뒤, 무릎을 펴고 가슴을 열어 빈손을 바깥에서 전방으로 넓게 쓸어 올린다.', [
        (0, G, 'linear'), (3, B((0, -2, 40), -2, (-27, 2, 70), (-8, 86), (26, -6, 50)), 'inout'), (5, B((0, -3, 37), 2, (-28, 0, 72), (-8, 88), (30, -8, 46)), 'inout'),
        (7, B((0, 3, 45.5), -8, (-28, 2, 78), (-8, 88), (22, 40, 82), chest_turn=6), 'snap'), (8, B((0, 4, 45.6), -10, (-28, 2, 79), (-8, 88), (20, 43, 86), chest_turn=4), 'out'),
        (10, B((0, 3, 45.5), -8, (-28, 2, 78), (-8, 88), (22, 40, 82), chest_turn=6), 'inout'), (12, B((0, 1, 44.5), 2, (-26, 6, 60), (-22, 70), (18, 12, 54)), 'inout'), (14, G, 'inout')])
    out['s4'] = dict(mod.CLIPS['a1'], title='S4 진격령', event='발동', durations=[100, 100, 110, 120, 140, 200, 55, 45, 80, 130, 260, 100, 90, 90, 100],
                     notes='공용 전법. 지목과 같은 동작을 더 길게 모으고 더 오래 버틴다. 닿는 공격이 아니다.')
    def guard(pz, sy): return B((0, 2, pz), 6, (-6, sy + 6, 58), (0, 88), (10, sy - 4, 56), hip_turn=4, chest_turn=4)
    out['s5'] = order('S5 수비령', '공용 전법. 무릎을 낮추고 검을 가슴 앞에 수직으로 세워 버틴다. 왼손은 검을 든 손목을 받친다. 닿는 공격이 아니다.', [
        (0, G, 'linear'), (3, B((0, -1, 41), 6, (-14, 20, 58), (-10, 80), (12, 14, 56)), 'inout'), (5, guard(35, 28), 'inout'), (7, guard(36.5, 32), 'snap'), (8, guard(37, 33), 'out'),
        (10, guard(36.5, 32), 'inout'), (12, B((0, 1, 42), 4, (-20, 14, 56), (-18, 72), (16, 10, 52)), 'inout'), (14, G, 'inout')])
    out['s6'] = clip('S6 총공격령', [(0, G, 'linear'), (2, P(RISE, (-24, 4, 92), (-90, 30)), 'inout'), (3, P(GATHER, (-26, 2, 98), (-180, 45)), 'linear'), (4, P(GATHER, (-26, 2, 98), (-270, 45)), 'linear'),
        (5, P(GATHER2, (-24, 0, 94), (-360, 50)), 'linear'), (6, P(STEP, (-20, 20, 90), (-360, 40)), 'in'), (7, P(POINT, (-10, 58, 80), (-355, 8)), 'snap'), (8, P(OVER, (-10, 62, 81), (-355, 5)), 'out'),
        (10, P(HOLD, (-10, 57, 80), (-355, 9)), 'inout'), (12, P(RETURN, (-18, 26, 60), (-360, 30)), 'inout'), (13, P(BACK, (-24, 10, 55), (-380, 58)), 'inout'), (14, P(G, G['sword'], (-386, 66)), 'out')],
        impact=8, event='발동', support=step, durations=[100, 100, 90, 80, 80, 100, 60, 45, 80, 130, 240, 100, 90, 90, 100], sheet=[0, 3, 5, 7, 10, 12],
        notes='공용 전법. 검을 머리 위에서 한 바퀴 크게 돌리고(3~6번) 내딛으며 정면을 가리킨다. 닿는 공격이 아니다.')

    # ---- skills that used to be a basic attack played slower: now their own moves (user review 2026-11-18) -------
    out['s4'] = clip('S4 진격령', [(0, G, 'linear'), (3, B((0, -5, 38), 8, (-22, -6, 56), (0, 10), (16, -4, 60)), 'inout'), (5, B((0, -7, 36), 10, (-23, -10, 56), (0, 6), (18, -10, 72)), 'inout'),
        (6, P(STEP, (-20, 10, 58), (2, 4), (20, 0, 88)), 'in'), (7, P(POINT, (-10, 58, 62), (4, 0), (16, 40, 84)), 'snap'), (8, P(OVER, (-10, 62, 62), (4, -2), (15, 44, 86)), 'out'),
        (10, P(HOLD, (-10, 57, 62), (4, 0), (16, 40, 84)), 'inout'), (12, RETURN, 'inout'), (13, BACK, 'inout'), (14, G, 'out')], impact=8, event='발동', support=step,
        durations=[100, 100, 110, 120, 140, 200, 55, 45, 80, 130, 260, 100, 90, 90, 100], sheet=[0, 3, 5, 7, 10, 12],
        notes='공용 전법. 검을 허리 뒤로 당기고 왼팔을 뒤로 뺐다가, 크게 내딛으며 검을 수평으로 내지르고 왼팔을 머리 위로 넘겨 앞을 가리킨다. 닿는 공격이 아니다.')
    return out
