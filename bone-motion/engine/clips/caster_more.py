"""책사·지원: 평타 A1, A2, A3, B1, B2, B3 and 전법 S2..S6 (S1 대계 is in caster.py). Nothing touches the target.

평타 is a small cast: the fan or the free hand sends something out. 전법 is a large cast with a step and a hold.
Eleven heroes use this type, so the six skills are six kinds of motion:
    S1 대계 (앞 위로 펼치기)      제갈량
    S2 내려 부르기                사마의 낙뢰, 장각
    S3 두 손 펼쳐 지원            화타, 순욱, 노숙
    S4 지목                       곽가 십승십패, 초선
    S5 눌러 결속                  방통 연환계
    S6 휩쓸어 펼치기              육손, 군영참모
The prop differs by hero (부채, 죽간, 홀, 지팡이, 횃불, 두루마리); the hand positions are the same.
"""
from clips.kit import *

def build(mod):
    G, GATHER, DEEP, STEP, RELEASE, OVER, HOLD, RETURN, BACK = (mod.GUARD, mod.S1_GATHER, mod.S1_DEEP, mod.S1_STEP, mod.S1_RELEASE, mod.S1_OVER, mod.S1_HOLD, mod.S1_RETURN, mod.S1_BACK)
    def F(base, rear, aim, left=None, **kw):
        d = dict(base); d['rear'] = rear; d['aim'] = aim
        if left: d['hand.L'] = left
        d.update(kw); return d
    low = dict(pelvis=(0, -4, 40), hip_turn=16, chest_turn=28, chest_lean=0); lower = dict(pelvis=(0, -5, 39), hip_turn=18, chest_turn=32, chest_lean=-2)
    out_ = dict(pelvis=(0, 5, 41.2), hip_turn=0, chest_turn=-8, chest_lean=8); far = dict(pelvis=(0, 6, 41.4), hip_turn=-2, chest_turn=-11, chest_lean=10)
    DG = [100, 90, 90, 110, 120, 150, 55, 45, 80, 160, 100, 90, 90, 90, 100]; out = {}
    def gesture(title, coil, fire, over, notes):
        return clip(title, [(0, G, 'linear'), (3, F(G, *coil, **low), 'inout'), (5, F(G, *coil, **lower), 'out'), (7, F(G, *fire, **out_), 'snap'), (8, F(G, *over, **far), 'out'),
                            (9, F(G, *fire, **out_), 'inout'), (11, F(G, (-16, 22, 62), (-10, 55), (10, 12, 46), pelvis=(0, 2, 42.3)), 'inout'), (14, G, 'inout')],
                    impact=8, event='발사', durations=DG, sheet=[0, 5, 7, 8, 9, 11], notes=notes)
    out['a1'] = gesture('A1 부채 튕기기', ((-10, 14, 58), (-40, 70), (10, 10, 48)), ((-10, 40, 66), (5, 10), (10, 12, 46)), ((-9, 42, 64), (5, 0), (10, 12, 46)),
                        '부채를 가슴으로 당겼다가 앞으로 짧게 튕긴다. 두 발은 제자리, 체중만 뒤에서 앞으로 넘어간다.')
    out['a2'] = gesture('A2 빈손 밀기', ((-18, 8, 60), (-30, 60), (6, 6, 54)), ((-20, 6, 58), (-40, 50), (8, 38, 62)), ((-20, 6, 58), (-42, 48), (8, 41, 62)),
                        '부채는 몸 옆에 두고 빈 왼손바닥을 앞으로 밀어 낸다.')
    out['b1'] = gesture('B1 올려 튕기기', ((-14, 16, 40), (0, -50), (10, 10, 46)), ((-12, 38, 74), (0, 60), (10, 12, 46)), ((-12, 38, 78), (-5, 75), (10, 12, 46)),
                        '부채를 낮게 내렸다가 아래에서 위로 튕겨 올린다.')
    out['b2'] = gesture('B2 내려 긋기', ((-16, 10, 84), (-10, 80), (10, 10, 48)), ((-10, 40, 52), (5, -30), (10, 12, 46)), ((-9, 40, 48), (5, -45), (10, 12, 46)),
                        '부채를 머리 높이로 들었다가 위에서 아래로 긋는다.')
    feet = [('L', 'R')] * 6 + [('R',)] + [('L', 'R')] * 6 + [('R',), ('L', 'R')]
    def cast(title, gather, deep, stepping, release, over, hold, notes, durations=None, body=None, event='발동'):
        body = body or {}
        return clip(title, [(0, G, 'linear'), (4, F(GATHER, *gather), 'inout'), (5, F(DEEP, *deep), 'out'), (6, F(STEP, *stepping), 'in'), (7, F(RELEASE, *release, **body), 'snap'),
                            (8, F(OVER, *over, **body), 'out'), (10, F(HOLD, *hold, **body), 'inout'), (12, RETURN, 'inout'), (13, BACK, 'inout'), (14, G, 'out')],
                    impact=8, event=event, support=feet, durations=durations or mod.CLIPS['s1']['durations'], sheet=[0, 5, 6, 7, 10, 12], notes=notes)
    sweep = (((0, 10, 62), (60, 40), (10, 8, 46)), ((2, 8, 62), (70, 40), (10, 6, 46)), ((-8, 26, 64), (30, 20), (10, 16, 48)),
             ((-16, 46, 64), (-30, 5), (14, 26, 50)), ((-20, 44, 62), (-55, 0), (14, 28, 50)), ((-18, 44, 63), (-45, 3), (14, 26, 50)))
    out['a3'] = cast('A3 휘둘러 방출', *sweep, notes='부채를 왼쪽 가슴 앞으로 감았다가 왼발을 내딛으며 오른쪽으로 크게 휘두른다. 평타 중 가장 큰 동작이다.',
                     durations=[100, 100, 100, 110, 130, 150, 50, 45, 70, 110, 170, 100, 90, 90, 100], event='발사')
    out['b3'] = cast('B3 두 손 모아 밀기', ((-6, 10, 54), (0, 60), (6, 10, 54)), ((-6, 8, 52), (0, 62), (6, 8, 52)), ((-6, 22, 58), (0, 40), (6, 22, 58)),
                     ((-6, 48, 64), (0, 20), (8, 46, 62)), ((-6, 51, 64), (0, 15), (8, 49, 62)), ((-6, 47, 64), (0, 22), (8, 45, 62)),
                     notes='두 손을 가슴 앞에 모았다가 왼발을 내딛으며 함께 앞으로 민다.', durations=[100, 100, 100, 110, 130, 150, 50, 45, 70, 110, 170, 100, 90, 90, 100], event='발사')
    up = dict(pelvis=(0, -4, 43), chest_lean=-8)
    out['s2'] = clip('S2 내려 부르기', [(0, G, 'linear'), (4, F(GATHER, (-18, 4, 90), (-10, 84), (10, 10, 50), **up), 'inout'), (5, F(DEEP, (-18, 3, 92), (-10, 86), (10, 9, 50), pelvis=(0, -5, 43.5), chest_lean=-10), 'out'),
        (6, F(STEP, (-14, 24, 84), (0, 30), (10, 18, 50)), 'in'), (7, F(RELEASE, (-10, 46, 50), (5, -35), (12, 28, 48), pelvis=(0, 12, 38), chest_lean=20), 'snap'),
        (8, F(OVER, (-9, 47, 46), (5, -45), (12, 30, 46), pelvis=(0, 13, 37), chest_lean=23), 'out'), (10, F(HOLD, (-10, 46, 50), (5, -35), (12, 28, 48), pelvis=(0, 12, 38), chest_lean=20), 'inout'),
        (12, RETURN, 'inout'), (13, BACK, 'inout'), (14, G, 'out')], impact=8, event='발동', support=feet, durations=mod.CLIPS['s1']['durations'], sheet=[0, 5, 6, 7, 10, 12],
        notes='사마의 낙뢰, 장각. 부채(지팡이)를 머리 위로 높이 들어 멈췄다가, 내딛으며 몸을 낮추고 위에서 아래로 내리친다.')
    def spread(pz, r, l, lean): return F(G, r, (-50, 50), l, pelvis=(0, 2, pz), hip_turn=4, chest_turn=4, chest_lean=lean)
    out['s3'] = clip('S3 두 손 펼쳐 지원', [(0, G, 'linear'), (3, F(G, (-6, 14, 52), (-10, 70), (6, 14, 52), pelvis=(0, -2, 39), chest_lean=12), 'inout'),
        (5, F(G, (-6, 14, 48), (-10, 70), (6, 14, 48), pelvis=(0, -2, 36), chest_lean=16), 'inout'), (7, spread(41.6, (-30, 8, 74), (28, 8, 72), -8), 'snap'), (8, spread(42, (-31, 7, 76), (29, 7, 74), -10), 'out'),
        (10, spread(41.6, (-30, 8, 74), (28, 8, 72), -8), 'inout'), (12, F(G, (-18, 14, 64), (-16, 60), (12, 10, 50), pelvis=(0, 1, 42.5)), 'inout'), (14, G, 'inout')],
        impact=8, event='발동', durations=D_CAST, sheet=[0, 3, 5, 7, 10, 12], notes='화타, 순욱, 노숙. 두 손을 가슴 앞 낮은 곳에 모았다가 일어서며 좌우 위로 넓게 펼친다. 두 발은 제자리.')
    out['s4'] = cast('S4 지목', ((-4, 12, 60), (-30, 60), (12, 4, 46)), ((-4, 11, 60), (-34, 62), (12, 2, 46)), ((-6, 28, 66), (-10, 30), (12, 2, 46)),
                     ((-8, 50, 70), (4, -5), (12, 4, 46)), ((-8, 53, 70), (4, -8), (12, 2, 46)), ((-8, 49, 70), (4, -4), (12, 4, 46)),
                     notes='곽가 십승십패, 초선. 부채를 가슴에 붙였다가 내딛으며 표적 한 점을 날카롭게 가리키고 오래 버틴다. 왼손은 뒤로 뺀다.')
    press = dict(pelvis=(0, 12, 34), chest_lean=26)
    out['s5'] = cast('S5 눌러 결속', ((-12, 12, 70), (-10, 70), (10, 10, 60)), ((-12, 10, 72), (-10, 74), (10, 8, 62)), ((-10, 26, 60), (0, 0), (10, 22, 54)),
                     ((-10, 44, 36), (5, -50), (10, 38, 34)), ((-10, 45, 33), (5, -55), (10, 39, 31)), ((-10, 44, 36), (5, -50), (10, 38, 34)), body=press,
                     notes='방통 연환계. 손을 살짝 들었다가 내딛으며 몸을 깊이 낮추고, 부채(지팡이) 끝과 빈손을 전방 낮게 눌러 그대로 쥐고 버틴다.')
    out['s6'] = cast('S6 휩쓸어 펼치기', *sweep, notes='육손, 군영참모. 휘둘러 방출과 같은 동작을 더 길게 모았다가 크게 휩쓸고 오래 버틴다.')

    # ---- skills that used to be a basic attack played slower: now their own moves (user review 2026-11-18) -------
    out['s6'] = clip('S6 원 그려 펼치기', [(0, G, 'linear'), (2, F(G, (-24, 8, 82), (-90, 40), (10, 10, 50), pelvis=(0, -2, 41)), 'inout'), (3, F(G, (-26, 6, 86), (-180, 50), (10, 10, 52), pelvis=(0, -3, 41)), 'linear'),
        (4, F(G, (-28, 8, 88), (-270, 78), (10, 10, 52), pelvis=(0, -4, 40.5)), 'linear'), (5, F(DEEP, (-10, 12, 66), (-360, 60), (8, 12, 60)), 'out'), (6, F(STEP, (-8, 26, 64), (-360, 20), (8, 26, 60)), 'in'),
        (7, F(RELEASE, (-14, 46, 58), (-370, -10), (12, 44, 56)), 'snap'), (8, F(OVER, (-16, 48, 54), (-375, -20), (14, 46, 52)), 'out'), (10, F(HOLD, (-14, 46, 58), (-370, -10), (12, 44, 56)), 'inout'),
        (12, F(RETURN, RETURN['rear'], (-351, 46)), 'inout'), (13, F(BACK, BACK['rear'], (-350, 55)), 'inout'), (14, F(G, G['rear'], (-374, 62)), 'out')], impact=8, event='발동', support=feet,
        durations=[100, 100, 90, 80, 80, 150, 55, 45, 80, 130, 240, 100, 90, 90, 100], sheet=[0, 3, 5, 7, 10, 12],
        notes='육손, 군영참모. 부채(횃불)로 머리 위에 원을 한 번 그리고(3~5번) 낮게 웅크렸다가, 내딛으며 두 손을 앞 아래로 넓게 펼친다.')
    return out
