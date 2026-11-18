"""기마 창 and 기마 월도·화극: 평타 A2, A3, B1, B2, B3 and 전법 S1..S6.

From the saddle the weapon has one safe corridor: down the horse's right side, past the right of its neck. Every
strike here lands through that corridor (the proven A1 hit), so the moves differ in what the HORSE does and in how
the rider winds up: the horse sinks, stamps, gallops, brakes, or rears and comes down with the blow.

    기마 창                                    기마 월도·화극
    A2 높이 들어 내리찍기                      A2 올려베기 (from low outside)
    A3 깊이 들어가 찌르기                      A3 깊이 들어가 베기
    B1 짧게 찌르기   B2 이단 찌르기            B1 짧게 베기   B2 이단 베기
    B3 앞발 굴러 찌르기                        B3 앞발 굴러 베기
    S1 용맹돌진 (조운)  horse sinks in front    S1 청룡참 (관우)  horse rears, the blow lands with the fore hooves
    S2 서량철기 (마초)  gallop, then the hit    S2 급습 (장료)    low entry, fore hooves brake, rising cut
    S3 백마의종 (공손찬) entry and braking hit  S3 무쌍 (여포)    wide level sweep from far outside
    S4 솟구쳐 내리찍기 (공용, horse rears)      S4 질주 일격 (공용, gallop)
    S5 이연 찌르기   S6 높이 들어 내리꽂기      S5 이연 베기   S6 깊은 내려베기
"""
from clips.kit import *
from clips.cycles import _leg

ALL = ('FL', 'FR', 'HL', 'HR')

def build(mod, kind):
    spear = kind == 'spear'; verb = '찌르기' if spear else '베기'
    G, LIFT, HIT, OVER, SET, DRAW, BACK, COIL = mod.GUARD, mod.A1_LIFT, mod.A1_HIT, mod.A1_OVER, mod.A1_SETTLE, mod.A1_DRAW, mod.A1_BACK, mod.A1_COIL
    P2 = mod.A1_COUCH if spear else mod.A1_RAISE; PRE = mod.A1_DRIVE if spear else mod.A1_TOP
    def M(base, **kw): d = dict(base); d.update(kw); return d
    def feet(air=()): return tuple(k for k in ALL if k not in air)
    base_sup = [feet()] * 6 + [feet(('FR',))] + [feet()] * 5 + [feet(('FR',))] * 2 + [feet()]
    DM = [110, 100, 100, 110, 130, 160, 50, 40, 60, 190, 100, 90, 90, 90, 100]
    DS = [110, 110, 110, 120, 150, 220, 55, 45, 70, 130, 240, 100, 90, 90, 100]
    def a1_like(title, notes, pre=None, coil=None, p2=None, hit=None, over=None, settle=None, durations=None, **kw):
        return clip(title, [(0, G, 'linear'), (2, LIFT, 'inout'), (4, p2 or P2, 'inout'), (5, coil or COIL, 'out'), (6, pre or PRE, 'in'), (7, hit or HIT, 'snap'), (8, over or OVER, 'out'),
                            (9, settle or SET, 'inout'), (11, DRAW, 'inout'), (12, BACK, 'inout'), (14, G, 'out')], impact=8, support=base_sup, durations=durations or DM, sheet=[0, 5, 6, 7, 9, 12], notes=notes, **kw)
    out = {}

    # ---- the rider's alternative wind-ups (weapon only; one hand on the shaft until the hit) ----------------------
    if spear:
        high = M(PRE, main=(-30, 10, 118), axis=(0.1, 0.9, 0.42), chest_lean=0)
        high_coil = M(COIL, main=(-32, -2, 120), axis=(0.05, 0.6, 0.8), chest_lean=-10)
        out['a2'] = a1_like('A2 높이 들어 내리찍기', '창을 어깨 위로 높이 들어 올렸다가 위에서 아래로 내리찍는다.', pre=high, coil=high_coil)
    else:
        low = M(PRE, main=(-34, 2, 96), axis=(-0.05, -0.6, -0.8), support_on=0.0, chest_lean=8, chest_side=-4)
        low_coil = M(COIL, main=(-34, -2, 98), axis=(-0.05, -0.75, -0.66), support_on=0.0, chest_lean=4, chest_side=-4)
        low_p2 = M(P2, main=(-34, 4, 100), axis=(-0.03, -0.35, -0.94), support_on=0.0, chest_side=-4)
        out['a2'] = a1_like('A2 올려베기', '무기를 말 오른쪽 바깥 뒤 아래로 늘어뜨렸다가(한 손), 뒤에서 앞으로 쳐올리며 두 손으로 받쳐 벤다.', pre=low, coil=low_coil, p2=low_p2)

    deep_coil = M(COIL, h_root=(0, -10, 60.2), h_pitch=4.8, neck=8)
    out['a3'] = a1_like('A3 깊이 들어가 ' + verb, '말이 엉덩이를 더 깊이 낮추며 뒤로 실렸다가 나간다. 준비가 길고 끝에서 오래 버틴다.', coil=deep_coil,
                        durations=[110, 100, 100, 110, 140, 200, 50, 40, 60, 220, 100, 90, 90, 90, 100])
    out['b1'] = clip('B1 짧게 ' + verb, [(0, G, 'linear'), (2, LIFT, 'inout'), (4, P2, 'inout'), (5, PRE, 'in'), (6, HIT, 'snap'), (7, OVER, 'out'), (8, SET, 'inout'), (10, DRAW, 'inout'), (11, BACK, 'inout'), (14, G, 'inout')],
                     impact=7, support=[feet()] * 5 + [feet(('FR',))] + [feet()] * 5 + [feet(('FR',))] * 3 + [feet()], durations=[100, 90, 90, 110, 90, 50, 40, 60, 150, 90, 90, 90, 90, 90, 100],
                     sheet=[0, 3, 5, 6, 8, 11], notes='깊이 감는 준비를 건너뛰고 바로 친다. 타격은 7번.')
    half = M(blend(SET, PRE, 0.35), support_on=0.0)      # the support hand lets go for the half lift and takes the shaft again on the hit
    def twice(title, notes, durations):
        return clip(title, [(0, G, 'linear'), (1, LIFT, 'inout'), (2, P2, 'inout'), (3, COIL, 'inout'), (4, PRE, 'in'), (5, HIT, 'snap'), (6, OVER, 'out'), (8, half, 'inout'), (9, HIT, 'snap'), (10, OVER, 'out'), (11, SET, 'inout'),
                            (12, DRAW, 'inout'), (13, BACK, 'inout'), (14, G, 'out')], impact=6, impact2=10,
                    support=[feet()] * 4 + [feet(('FR',))] + [feet()] * 2 + [feet(('FR',))] * 2 + [feet()] * 3 + [feet(('FR',))] * 2 + [feet()],
                    durations=durations, sheet=[0, 3, 5, 8, 9, 11], notes=notes)
    out['b2'] = twice('B2 이단 ' + verb, '6번에 치고, 반만 거두며 말이 오른 앞발을 다시 들었다가 10번에 한 번 더 친다.', [110, 100, 110, 140, 50, 40, 70, 100, 110, 40, 60, 170, 90, 90, 100])
    stamp = lambda b, fl: M(b, FL=fl)
    out['b3'] = clip('B3 앞발 굴러 ' + verb, [(0, G, 'linear'), (2, stamp(LIFT, (14, 29, 5)), 'inout'), (3, stamp(P2, (14, 31, 9)), 'inout'), (5, stamp(COIL, (14, 30, 0)), 'snap'),
        (6, stamp(PRE, (14, 30, 0)), 'in'), (7, stamp(HIT, (14, 30, 0)), 'snap'), (8, stamp(OVER, (14, 30, 0)), 'out'), (9, stamp(SET, (14, 30, 0)), 'inout'),
        (11, stamp(DRAW, (14, 31, 6)), 'inout'), (12, BACK, 'inout'), (14, G, 'out')], impact=8,
        support=[feet()] + [feet(('FL',))] * 4 + [feet()] + [feet(('FR',))] + [feet()] * 3 + [feet(('FL',))] * 2 + [feet(('FR',))] * 2 + [feet()], durations=DM, sheet=[0, 3, 5, 6, 7, 9],
        notes='준비하는 동안 말이 왼 앞발을 들었다가 굴러 딛고(6번), 이어서 오른 앞발을 딛으며 친다(8번). 두 번의 발굽 소리.')

    # ---- horse choreography for the skills ---------------------------------------------------------------------------
    def rear(pitch_deg, root, fl, fr, weapon, lean=-8, **kw):
        return M(P2, h_root=root, h_pitch=pitch_deg, neck=10, head=6, FL=fl, FR=fr, seat=(0, 0, 2), hip_turn=4, hip_lean=-4, chest_turn=10, chest_lean=lean, chest_side=-4, **weapon, **kw)
    up = dict(main=(-37, -10, 124), axis=(-0.05, -0.25, 0.97)) if spear else dict(main=(-30, -12, 126), axis=(-0.1, -0.5, 0.86), support_on=0.0)
    up['hand.L'] = (8, -6, 98)      # the rein hand rides up and back with the horse
    rearing = clip('솟구쳐 내리찍기', [(0, G, 'linear'), (2, M(LIFT, h_root=(0, -4, 61.5), h_pitch=4), 'inout'),
        (4, rear(18, (0, -9, 65), (14, 27, 18), (-14, 29, 22), up), 'out'), (5, rear(26, (0, -11, 67.5), (14, 25, 27), (-14, 27, 31), up, lean=-12), 'inout'),
        (6, rear(27, (0, -11.5, 68), (14, 25, 28), (-14, 28, 30), up, lean=-13), 'inout'), (7, HIT, 'snap'), (8, OVER, 'out'), (10, SET, 'inout'), (12, DRAW, 'inout'), (13, BACK, 'inout'), (14, G, 'out')],
        impact=8, support=[feet()] * 3 + [feet(('FL', 'FR'))] * 4 + [feet()] * 5 + [feet(('FR',))] * 2 + [feet()],
        durations=[110, 110, 120, 120, 130, 150, 220, 45, 70, 130, 240, 100, 100, 90, 100], sheet=[0, 4, 6, 7, 8, 10],
        notes='말이 뒷다리로 버티고 앞발 둘을 높이 든다(4~7번). 기수는 안장을 따라 올라가 무기를 머리 위로 치켜든다. 앞발이 땅에 닿는 8번에 내려친다.')
    def gallop(i, n=7):
        s = (i * 1.5 / n) % 1.0; p = dict(P2); bounce = -2.0 * __import__('math').cos(4 * __import__('math').pi * s)
        p['h_root'] = (0, 1, 61 + bounce); p['h_pitch'] = 2.5 * __import__('math').sin(4 * __import__('math').pi * s); p['neck'] = -6; p['hip_lean'] = 10; p['chest_lean'] = (P2['chest_lean'] + 14)
        for name, off, by, bx in (('FL', 0.0, 28, 14), ('HR', 0.03, -29, -16), ('FR', 0.5, 28, -14), ('HL', 0.53, -29, 16)):
            fy, air, _ = _leg((s + off) % 1.0, 12.0, 10.0, 0.42); p[name] = (bx, by + fy, air)
        return p
    charge = posed('질주 일격', [G] + [gallop(i) for i in range(1, 8)] + [PRE, HIT, OVER, SET, DRAW, BACK, G], impact=10,
                   support=[feet()] + [()] * 7 + [feet(('FR',))] + [feet()] * 3 + [feet()] + [feet(('FR',))] + [feet()],
                   durations=[100, 55, 55, 55, 55, 55, 55, 60, 60, 45, 70, 200, 100, 100, 100], sheet=[0, 2, 5, 8, 9, 11],
                   notes='2~8번은 제자리 질주(게임이 유닛을 옮긴다). 9번에 오른 앞발을 들고 10번에 딛으며 친다.')
    brake_hit = M(HIT, h_pitch=2.5, neck=6, head=4); brake_over = M(OVER, h_pitch=3.5, neck=8, head=5)
    def braking(title, notes, pre=None, coil=None, p2=None):
        lowp2 = M(p2 or P2, h_root=(0, -6, 60), h_pitch=3, hip_lean=10, chest_lean=(p2 or P2)['chest_lean'] + 10)
        return a1_like(title, notes, pre=pre, coil=M(coil or COIL, h_root=(0, -8, 59.6), h_pitch=4), p2=lowp2, hit=brake_hit, over=brake_over, durations=DS)
    deep = a1_like('깊은 일격', '', coil=M(COIL, h_root=(0, -9, 58.6), h_pitch=-2.5, neck=-6, hip_lean=14), p2=M(P2, h_root=(0, -6, 59.2), h_pitch=-3, neck=-8, hip_lean=12), durations=DS)

    if spear:
        out['s1'] = dict(deep, title='S1 용맹돌진', notes='조운 전법. 창을 겨드랑이 밑으로 낮추고, 말이 앞무릎을 굽혀 앞으로 힘을 모으며 기수도 낮게 숙인다. 깊게 한 번 관통하고 낮은 끝점에서 버틴다.')
        out['s2'] = dict(charge, title='S2 서량철기', notes='마초 전법. 창을 말 목 옆으로 낮추고 질주한다. ' + charge['notes'])
        out['s3'] = braking('S3 백마의종', '공손찬 전법. 말 뒷다리가 눌리고 기수는 안장에 붙어 숙인 채 들어가, 도착 순간 말이 앞을 들어 제동하며 찌른다.')
        out['s4'] = dict(rearing, title='S4 솟구쳐 내리찍기', notes='공용 전법. ' + rearing['notes'])
        out['s5'] = twice('S5 이연 찌르기', '공용 전법. 6번과 10번에 두 번 찌른다. 평타보다 준비와 버팀이 길다.', [110, 110, 130, 180, 55, 45, 80, 110, 130, 45, 70, 220, 90, 90, 100])
        out['s6'] = dict(out['a2'], title='S6 높이 들어 내리꽂기', durations=DS, notes='공용 전법. 창을 높이 들어 오래 멈췄다가 내리꽂고 버틴다.')
    else:
        out['s1'] = dict(rearing, title='S1 청룡참', notes='관우 전법. ' + rearing['notes'])
        out['s2'] = braking('S2 급습', '장료 전법. 월도를 말 옆 낮게 빼고 숙인 채 들어가, 도착 순간 앞발굽으로 제동하며 아래에서 표적 중심까지 올려 벤다.', pre=low, coil=low_coil, p2=low_p2)
        side = M(PRE, main=(-22, 34, 104), axis=(-0.82, 0.3, -0.48), support_on=0.0, chest_turn=14, chest_lean=18, chest_side=-6)
        side_coil = M(COIL, main=(-24, 16, 106), axis=(-0.75, -0.25, -0.6), support_on=0.0, chest_turn=36, chest_lean=6, chest_side=-6)
        out['s3'] = a1_like('S3 무쌍', '여포 전법. 화극을 오른쪽 바깥 뒤로 크게 빼고 말은 낮게 버틴다. 골반·가슴·어깨를 차례로 풀어 바깥에서 정면까지 넓게 휩쓴다. 말 목을 넘지 않도록 정면에서 멈춘다.',
                            pre=side, coil=M(side_coil, h_root=(0, -8, 60.4), h_pitch=4), durations=DS)
        out['s4'] = dict(charge, title='S4 질주 일격', notes='공용 전법. ' + charge['notes'])
        out['s5'] = twice('S5 이연 베기', '공용 전법. 6번과 10번에 두 번 벤다. 평타보다 준비와 버팀이 길다.', [110, 110, 130, 180, 55, 45, 80, 110, 130, 45, 70, 220, 90, 90, 100])
        out['s6'] = dict(out['a3'], title='S6 깊은 내려베기', durations=DS, notes='공용 전법. 말이 깊이 물러났다가 나가며 크게 내려 베고 오래 버틴다.')

    # ---- skills that used to be a basic attack played slower: now their own moves (user review 2026-11-18) -------
    def thrice(title, notes):
        return clip(title, [(0, G, 'linear'), (1, LIFT, 'inout'), (2, P2, 'inout'), (3, COIL, 'inout'), (4, PRE, 'in'), (5, HIT, 'snap'), (6, OVER, 'out'), (7, half, 'inout'), (8, HIT, 'snap'),
                            (9, OVER, 'out'), (10, half, 'inout'), (11, HIT, 'snap'), (12, OVER, 'out'), (13, BACK, 'inout'), (14, G, 'out')], impact=6, impact2=9,
                    support=[feet()] * 4 + [feet(('FR',))] + [feet()] * 2 + [feet(('FR',))] + [feet()] * 2 + [feet(('FR',))] + [feet()] * 2 + [feet(('FR',))] + [feet()],
                    durations=[110, 110, 130, 170, 55, 45, 70, 110, 45, 70, 110, 45, 220, 110, 100], sheet=[0, 3, 5, 8, 11, 12], notes=notes)
    grand = posed('질주 솟구쳐 내려치기', [G] + [gallop(i) for i in range(1, 5)] + [rear(16, (0, -8, 64.5), (14, 27, 16), (-14, 29, 20), up), rear(25, (0, -11, 67.5), (14, 25, 26), (-14, 27, 30), up, lean=-12),
                  rear(27, (0, -11.5, 68), (14, 25, 28), (-14, 28, 30), up, lean=-13), HIT, OVER, SET, SET, DRAW, BACK, G], impact=9,
                  support=[feet()] + [()] * 4 + [feet(('FL', 'FR'))] * 3 + [feet()] * 5 + [feet(('FR',))] + [feet()],
                  durations=[100, 55, 55, 55, 55, 110, 130, 200, 45, 70, 130, 220, 100, 100, 100], sheet=[0, 3, 6, 7, 8, 10],
                  notes='2~5번은 제자리 질주, 6~8번에 말이 솟아오르고, 앞발이 땅에 닿는 9번에 내려친다. 질주와 솟구침을 이은 가장 큰 전법이다.')
    out['s5'] = thrice('S5 삼연 ' + verb, '공용 전법. 6번, 9번, 12번에 세 번 친다. 칠 때마다 말이 오른 앞발을 다시 구른다.')
    out['s6'] = dict(grand, title='S6 질주 솟구쳐 내려치기', notes='공용 전법. ' + grand['notes'])
    return out
