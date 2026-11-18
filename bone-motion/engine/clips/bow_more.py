"""궁: 평타 A2, A3, B1, B2, B3 and 전법 S1..S6. Draw, hold, loose and arrival are separate frames in every shot.

    A2 높이 들어 쏘기   A3 낮춰 쏘기   B1 비껴 서서 쏘기   B2 속사 두 발   B3 깊게 당겨 쏘기
    S1 백발백중 (황충)       wide and low, bow higher than usual, a long hold, one exact shot.
    S2 집중 사격 (의용궁병)  bow at eye level, the longest aim of all.
    S3 신속 (하후연)         no wind-up to speak of: the bow comes forward and the arrow is gone.
    S4 삼연사 (태사자)       three shots in three directions.
    S5 궁요희 (손상향)       compress low with a deep draw, then let the body open with the shot.
    S6 도약 사격 (공용)      a jump and a shot downward from the top.
"""
import math
from clips.kit import *
from samto_motion import sub, length

def build(mod):
    G, NOCK, RAISE, DRAW, HOLD, LOOSE, ARRIVE, FOLLOW, LOWER = (mod.GUARD, mod.A1_NOCK, mod.A1_RAISE, mod.A1_DRAW, mod.A1_HOLD, mod.A1_LOOSE, mod.A1_ARRIVE, mod.A1_FOLLOW, mod.A1_LOWER)
    ARROW, DRAWN = mod.WEAPON.arrow, 5 + mod.WEAPON.draw
    def line(bow, target=STRIKE):
        v = sub(target, bow); n = length(v); return (math.degrees(math.atan2(v[0], v[1])), math.degrees(math.asin(v[2] / n))), n - ARROW
    def B(base, bow, aim, **kw):
        d = dict(base); d['bow'] = bow; d['bow_aim'] = aim; d.update(kw); return d
    def loosed(base, bow, aim, fly, **kw):
        a = direction(*aim); nock = tuple(bow[i] - a[i] * DRAWN for i in range(3))
        return B(base, bow, aim, arrow_fly=fly, **{'hand.R': (nock[0] - 4, nock[1] - 8, nock[2] + 2)}, **kw)
    def shot(title, bow, notes, body=None, loose=8, durations=None, target=STRIKE, lower=None, **kw):
        aim, fly = line(bow, target); body = body or {}; n1, n2 = (2, loose - 4) if loose >= 8 else (1, 2)
        keys = [(0, G, 'linear'), (n1, NOCK, 'inout'), (n2, RAISE, 'inout'), (loose - 2, B(DRAW, bow, aim, **body), 'out'), (loose - 1, B(HOLD, bow, aim, **body), 'inout'),
                (loose, loosed(LOOSE, bow, aim, -30.0, **body), 'snap'), (loose + 1, loosed(ARRIVE, bow, aim, fly, **body), 'linear'), (loose + 2, B(FOLLOW, bow, aim), 'out'), (12, lower or LOWER, 'inout'), (14, G, 'inout')]
        return clip(title, keys, impact=loose + 1, event='발사', arrive=loose + 2, durations=durations or [100, 100, 100, 110, 120, 130, 150, 170, 45, 120, 150, 110, 100, 100, 100],
                    sheet=[0, 2, loose - 1, loose, loose + 1, 12], notes=notes, **kw)
    out = {}
    out['a2'] = shot('A2 높이 들어 쏘기', (0, 46, 71), '활을 눈높이까지 높이 들어 위에서 아래로 쏜다.', body=dict(pelvis=(-1, -8, 44), chest_lean=-6))
    out['a3'] = shot('A3 낮춰 쏘기', (0, 46, 52), '무릎을 깊이 굽혀 몸을 낮추고 낮은 선으로 쏜다.', body=dict(pelvis=(-1, -8, 33), chest_lean=6))
    out['b1'] = shot('B1 비껴 서서 쏘기', (12, 44, 66), '활을 든 왼팔을 바깥으로 벌려 중심선 밖에서 사선으로 쏜다. 정면·후면에서 조준선이 비스듬히 보인다.', body=dict(pelvis=(4, -8, 42.5)))
    out['b3'] = shot('B3 깊게 당겨 쏘기', (0, 48, 66), '뒷발에 더 실리며 오래 당겨 멈췄다가 쏜다. 쏜 뒤 몸이 뒤로 밀린다.', body=dict(pelvis=(-1, -11, 41), chest_lean=-8),
                     durations=[100, 100, 100, 110, 120, 140, 170, 260, 45, 120, 160, 110, 100, 100, 100])
    # 속사: two arrows
    bow = (0, 48, 66); aim, fly = line(bow)
    def pair(title, notes, durations):
        return clip(title, [(0, G, 'linear'), (2, NOCK, 'inout'), (4, B(DRAW, bow, aim), 'out'), (5, loosed(LOOSE, bow, aim, -30.0), 'snap'), (6, loosed(ARRIVE, bow, aim, fly), 'linear'),
            (7, B(NOCK, (13, 25, 63), aim, draw=0.05), 'inout'), (8, B(DRAW, bow, aim), 'out'), (9, loosed(LOOSE, bow, aim, -30.0), 'snap'), (10, loosed(ARRIVE, bow, aim, fly), 'linear'),
            (11, B(FOLLOW, bow, aim), 'out'), (13, LOWER, 'inout'), (14, G, 'inout')], impact=6, impact2=10, event='발사', arrive=7, durations=durations, sheet=[0, 4, 5, 6, 9, 10], notes=notes)
    out['b2'] = pair('B2 속사 두 발', '6번과 10번에 한 발씩 쏜다(도달은 7번, 11번). 활은 내리지 않고 그 자리에서 다시 메긴다.', [100, 100, 100, 110, 130, 45, 90, 110, 120, 45, 100, 130, 100, 100, 100])

    wide = {'foot.L': foot((10, 18), 10), 'foot.R': foot((-11, -16), 60)}
    out['s1'] = shot('S1 백발백중', (0, 48, 68), '황충 전법. 활을 평타보다 높이 들고 뒷다리에 실린 채 등으로 깊게 당겨 한 호흡 멈춘 뒤 정확히 한 발 쏜다.',
                     body=dict(pelvis=(-1, -9, 39), chest_lean=-6), durations=[100, 100, 110, 120, 130, 150, 180, 320, 45, 130, 220, 110, 100, 100, 100])
    out['s2'] = shot('S2 집중 사격', (0, 50, 70), '의용궁병 전법. 눈높이로 활을 들고 활팔을 멀리 뻗어, 시위를 팽팽히 당긴 채 가장 오래 조준한 뒤 쏜다.',
                     body=dict(pelvis=(-1, -7, 41.5), chest_lean=-3), durations=[100, 100, 110, 120, 130, 150, 200, 380, 45, 130, 200, 110, 100, 100, 100])
    out['s3'] = shot('S3 신속', (0, 48, 66), '하후연 전법. 준비가 거의 없다. 활을 앞으로 내보내며 당김 손이 바로 시위에 붙고 6번에 쏜다.', loose=5, lower=B(LOWER, LOWER['bow'], LOWER['bow_aim']),
                     durations=[90, 80, 70, 70, 90, 45, 100, 130, 130, 120, 110, 100, 100, 100, 100])
    # 삼연사: three directions
    left, mid, right = (-18.0, 98.0, 45.0), STRIKE, (18.0, 98.0, 45.0); b3 = (0, 46, 66)
    def one(i, target):
        a, f = line(b3, target); body = dict(pelvis=(0, -6, 38), chest_lean=-2)
        return [(i, B(DRAW, b3, a, **body), 'out'), (i + 1, loosed(LOOSE, b3, a, -30.0, **body), 'snap'), (i + 2, loosed(ARRIVE, b3, a, f, **body), 'linear')]
    out['s4'] = clip('S4 삼연사', [(0, G, 'linear'), (2, NOCK, 'inout')] + one(3, left) + one(6, mid) + one(9, right) + [(12, B(FOLLOW, b3, line(b3, right)[0]), 'out'), (13, LOWER, 'inout'), (14, G, 'inout')],
        impact=5, impact2=8, event='발사', arrive=9, durations=[100, 100, 110, 150, 45, 110, 150, 45, 110, 150, 45, 110, 150, 110, 100], sheet=[0, 3, 4, 7, 10, 12],
        notes='태사자 전법. 낮고 넓게 버틴 채 5번, 8번, 11번에 왼쪽, 정면, 오른쪽으로 한 발씩 쏜다. 실제 표적 방향은 게임이 정하고, 여기서는 세 방향을 예시로 보였다.')
    out['s5'] = shot('S5 궁요희', (0, 46, 62), '손상향 전법. 무릎을 낮추고 등과 가슴을 열어 평타보다 깊게 당겨 힘을 모은 모습을 한 박자 보여 준 뒤, 몸을 펴며 쏜다.',
                     body=dict(pelvis=(-1, -9, 35), chest_lean=-4), durations=[100, 100, 110, 120, 130, 150, 180, 300, 45, 130, 200, 110, 100, 100, 100])
    air = {'foot.L': foot((8, 14), 10, air=10), 'foot.R': foot((-9, -12), 60, air=10)}
    top = (0, 46, 82); a6, f6 = line(top)
    out['s6'] = clip('S6 도약 사격', [(0, G, 'linear'), (2, B(NOCK, NOCK['bow'], NOCK['bow_aim'], pelvis=(0, -1, 40)), 'inout'), (4, B(RAISE, (10, 30, 78), (0, -20), draw=0.1, pelvis=(0, 0, 50), **air), 'out'),
        (6, B(DRAW, top, a6, pelvis=(-1, -2, 56), **air), 'out'), (7, B(HOLD, top, a6, pelvis=(-1, -2, 57), **air), 'inout'), (8, loosed(LOOSE, top, a6, -30.0, pelvis=(-1, -4, 55), **air), 'snap'),
        (9, loosed(ARRIVE, top, a6, f6, pelvis=(-1, -4, 50), **{'foot.L': foot((8, 14), 10, air=5), 'foot.R': foot((-9, -12), 60, air=5)}), 'linear'),
        (10, B(FOLLOW, (3, 46, 62), (0, -22), pelvis=(0, -2, 35)), 'out'), (12, LOWER, 'inout'), (14, G, 'inout')], impact=9, event='발사', arrive=10,
        support=[('L', 'R')] * 3 + [()] * 7 + [('L', 'R')] * 5, durations=[100, 100, 110, 100, 100, 110, 120, 150, 45, 110, 170, 110, 100, 100, 100], sheet=[0, 2, 5, 7, 8, 10],
        notes='공용 전법. 뛰어올라 가장 높은 곳에서 당겨 멈추고 아래로 쏜다. 4~10번에 두 발이 뜬다.')
    return out
