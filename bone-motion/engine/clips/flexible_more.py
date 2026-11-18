"""사슬·채찍: 평타 A2, A3, B1, B2, B3 and 전법 S1..S6. The hand throws first; the end arrives one frame later.

    A2 올려 후리기   A3 내려 후리기   B1 가로 후리기   B2 두 번 후리기   B3 감아 당기기
    S1 금범적 (감녕)   a low entry, then a rough upward hook from below.
    S2 고육계 (황개)   the weapon drawn to the chest, then thrown wide open. Nothing is struck.
    S3 포박 (반장)     the loop is swung once overhead and thrown at the target.
    S4 선회 후리기   S5 내려쳐 꽂기   S6 연속 후리기   (공용)
"""
from clips.kit import *

REACH = 66.0      # six links of 11 px

def build(mod):
    G, COIL, SWING, HIT, OVER, SET, PULL, BACK = mod.GUARD, mod.A1_COIL, mod.A1_SWING, mod.A1_HIT, mod.A1_OVER, mod.A1_SETTLE, mod.A1_PULL, mod.A1_BACK
    def K(base, hand, aim, taut=0.0, **kw):
        d = dict(base); d['chain'] = hand; d['chain_aim'] = aim; d['chain_taut'] = taut; d.update(kw); return d
    def land(turn, pitch): return K(OVER, reach_hand(REACH, turn, pitch), (turn, pitch), 1.0)
    step = sup(air_R=(5, 6, 12, 13)); DF = [100, 90, 90, 100, 150, 45, 40, 50, 80, 170, 90, 90, 80, 80, 100]; out = {}
    def lash(title, coil, swing, throw, landing, settle, notes, durations=None, **kw):
        return clip(title, [(0, G, 'linear'), (4, coil, 'inout'), (6, swing, 'in'), (7, throw, 'snap'), (8, landing, 'out'), (9, settle, 'inout'), (11, PULL, 'inout'), (13, BACK, 'inout'), (14, G, 'out')],
                    impact=9, support=step, durations=durations or DF, sheet=[0, 4, 6, 7, 8, 12], notes=notes, **kw)
    rise = dict(coil=K(COIL, (-24, -10, 42), (-10, -150)), swing=K(SWING, (-21, 12, 36), (0, -100)), throw=K(HIT, (-8, 44, 38), (5, -25), 0.35), landing=land(4, 12), settle=K(SET, (-6, 36, 42), (6, 40), 0.4))
    down = dict(coil=COIL, swing=K(SWING, (-24, 6, 96), (0, 95)), throw=K(HIT, (-8, 44, 84), (4, 20), 0.35), landing=land(4, -25), settle=K(SET, (-6, 38, 66), (8, -60), 0.3))
    out['a2'] = lash('A2 올려 후리기', notes='사슬을 몸 뒤 아래로 늘어뜨렸다가 아래에서 위로 후려 올린다. 손은 8번에 던지고 끝은 9번에 닿는다.', **rise)
    out['a3'] = lash('A3 내려 후리기', notes='머리 위로 크게 돌려 위에서 아래로 내려친다.', **down)
    out['b1'] = lash('B1 가로 후리기', K(COIL, (-30, -8, 56), (-150, 5)), K(SWING, (-34, 14, 54), (-80, 5)), K(HIT, (-30, 38, 48), (-10, 2), 0.4), land(25, 0), K(SET, (-20, 40, 46), (70, -10), 0.4),
                     '오른쪽 바깥에서 가슴 높이로 가로로 후려친다. 끝이 표적을 지나 왼쪽으로 감긴다.')
    def twice(title, notes, durations):
        return clip(title, [(0, G, 'linear'), (2, COIL, 'inout'), (4, K(SWING, (-24, 10, 90), (-5, 80)), 'in'), (5, HIT, 'snap'), (6, OVER, 'out'), (7, K(SET, (-14, 36, 80), (0, 100), 0.2), 'inout'),
            (9, K(HIT, (-8, 44, 84), (4, 20), 0.35), 'snap'), (10, land(4, -25), 'out'), (11, K(SET, (-6, 38, 66), (8, -60), 0.3), 'inout'), (12, PULL, 'inout'), (13, BACK, 'inout'), (14, G, 'out')],
            impact=7, impact2=11, support=sup(air_R=(3, 4, 13)), durations=durations, sheet=[0, 2, 5, 6, 9, 10], notes=notes)
    out['b2'] = twice('B2 두 번 후리기', '7번에 한 번 닿고, 손을 위로 되감아 11번에 위에서 다시 내려친다.', [100, 90, 100, 110, 50, 45, 80, 100, 110, 45, 50, 150, 90, 90, 100])
    out['b3'] = clip('B3 감아 당기기', [(0, G, 'linear'), (4, COIL, 'inout'), (6, SWING, 'in'), (7, HIT, 'snap'), (8, OVER, 'out'),
        (9, K(OVER, (-12, 20, 54), (4.3, -4.4), 1.0, pelvis=(-2, 16, 39)), 'snap'), (10, K(SET, (-16, 8, 56), (6, -10), 0.8, pelvis=(-2, 12, 40)), 'out'),
        (12, PULL, 'inout'), (13, BACK, 'inout'), (14, G, 'out')], impact=9, support=step, durations=[100, 90, 90, 100, 150, 45, 40, 50, 90, 60, 170, 90, 90, 80, 100], sheet=[0, 4, 7, 8, 9, 10],
        notes='9번에 끝이 닿은 뒤, 사슬을 팽팽하게 유지한 채 몸 쪽으로 세게 당긴다(10~11번).')
    deep = dict(rise, coil=K(COIL, (-24, -12, 36), (-10, -150), pelvis=(-3, -11, 33), chest_lean=14), swing=K(SWING, (-21, 12, 34), (0, -100), pelvis=(-1, 6, 35), chest_lean=14),
                throw=K(HIT, (-8, 44, 36), (5, -25), 0.35, pelvis=(-2, 22, 35), chest_lean=24), settle=K(SET, (-8, 40, 70), (-10, 70), 0.5, pelvis=(-2, 22, 42), chest_lean=8))
    out['s1'] = lash('S1 금범적', notes='감녕 전법. 무릎과 상체를 크게 접어 낮게 들어갔다가, 골반과 가슴을 비틀어 풀며 아래에서 바깥 위로 거칠게 걸어 올린다. 도착 칸 이동은 게임이 한다.',
                     durations=[100, 100, 110, 120, 190, 55, 45, 50, 110, 200, 100, 90, 90, 90, 100], **deep)
    def open_(pz, hand, left, taut, lean): return K(G, hand, (-80, 10), taut, pelvis=(0, 2, pz), hip_turn=6, chest_turn=6, chest_lean=lean, **{'hand.L': left})
    out['s2'] = clip('S2 고육계', [(0, G, 'linear'), (3, K(G, (-10, 18, 54), (-10, -60), 0.0, pelvis=(0, -2, 36), chest_lean=18, **{'hand.L': (10, 18, 54)}), 'inout'),
        (5, K(G, (-10, 18, 50), (-10, -60), 0.0, pelvis=(0, -2, 33), chest_lean=22, **{'hand.L': (10, 18, 50)}), 'inout'), (7, open_(43, (-36, 6, 70), (34, 8, 70), 0.7, -8), 'snap'),
        (8, open_(44, (-37, 5, 72), (35, 7, 72), 0.9, -10), 'out'), (10, open_(43, (-36, 6, 70), (34, 8, 70), 0.6, -8), 'inout'), (12, K(G, (-27, 8, 60), (-20, -60), 0.2), 'inout'), (14, G, 'inout')],
        impact=8, event='발동', durations=D_CAST, sheet=[0, 3, 5, 7, 10, 12], notes='황개 전법. 무기를 가슴 가까이 당겨 깊이 웅크렸다가, 양발로 딛고 가슴을 펴며 쇠채찍을 몸 바깥으로 크게 연다. 닿는 공격이 아니다.')
    out['s3'] = clip('S3 포박', [(0, G, 'linear'), (2, K(COIL, (-20, -6, 92), (-90, 40), 0.6), 'inout'), (3, K(COIL, (-20, -8, 94), (-180, 50), 0.7), 'linear'), (4, K(COIL, (-20, -8, 94), (-270, 40), 0.7), 'linear'),
        (5, K(COIL, (-22, -10, 92), (-360, 60), 0.5), 'linear'), (6, K(SWING, (-24, 10, 90), (-365, 80)), 'in'), (7, K(HIT, (-8, 46, 64), (-355, 25), 0.35), 'snap'),
        (8, K(OVER, reach_hand(REACH, 4.3, -4.4), (-355.7, -4.4), 1.0), 'out'), (10, K(OVER, reach_hand(REACH, 4.3, -4.4), (-355.7, -4.4), 1.0), 'inout'),
        (12, K(PULL, PULL['chain'], (-352, -60)), 'inout'), (13, K(BACK, BACK['chain'], (-350, -70)), 'inout'), (14, G, 'out')], impact=9, support=sup(air_R=(6, 13)),
        durations=[100, 100, 90, 80, 80, 90, 110, 50, 60, 130, 200, 100, 90, 90, 100], sheet=[0, 3, 5, 7, 8, 10],
        notes='반장 전법. 어깨 위에서 고리를 한 바퀴 크게 돌리고(3~6번) 표적 쪽으로 던진다. 9번에 닿고 그대로 붙든다.')
    def Wh(turn, taut, hand=(-18, 22, 72), pitch=8): return K(G, hand, (turn, pitch), taut, pelvis=(0, 6, 40), hip_turn=10, chest_turn=14, chest_lean=6, **{'hand.L': (14, 16, 58)})
    out['s4'] = clip('S4 선회 후리기', [(0, G, 'linear'), (2, Wh(-60, 0.5, (-18, 10, 80), 20), 'inout'), (3, Wh(-130, 0.9), 'linear'), (4, Wh(-200, 0.9), 'linear'), (5, Wh(-270, 0.9), 'linear'),
        (6, Wh(-320, 0.95), 'linear'), (7, Wh(-340, 1.0, reach_hand(REACH, 20, -5), -5), 'linear'), (8, Wh(-400, 0.9), 'linear'), (9, Wh(-470, 0.8), 'linear'), (10, Wh(-540, 0.6), 'linear'),
        (12, K(G, (-27, 8, 62), (-372, -60), 0.2), 'inout'), (14, K(G, G['chain'], (-372, -76), 0.0), 'inout')], impact=8,
        durations=[100, 100, 110, 70, 70, 70, 60, 50, 60, 70, 90, 130, 110, 100, 100], sheet=[0, 3, 5, 7, 9, 12],
        notes='공용 전법. 사슬을 머리 높이에서 수평으로 돌린다. 한 바퀴째 8번에 끝이 정면을 지나며 친다. 두 발은 제자리.')
    out['s5'] = lash('S5 내려쳐 꽂기', notes='공용 전법. 머리 위로 크게 돌려 오래 멈췄다가 위에서 내려친다.', durations=[100, 100, 110, 120, 200, 55, 45, 50, 110, 200, 100, 90, 90, 90, 100], **down)
    out['s6'] = twice('S6 연속 후리기', '공용 전법. 7번과 11번에 두 번 친다. 평타보다 준비와 버팀이 길다.', [100, 100, 120, 150, 55, 45, 90, 110, 130, 45, 60, 200, 90, 90, 100])

    # ---- skills that used to be a basic attack played slower: now their own moves (user review 2026-11-18) -------
    fa = {'foot.L': foot((8, 14), 0, air=8), 'foot.R': foot((-9, 0), 30, air=8)}; fb = {'foot.L': foot((8, 16), 0, air=10), 'foot.R': foot((-9, 18), 25, air=10)}
    out['s5'] = clip('S5 도약 내려 후리기', [(0, G, 'linear'), (3, K(COIL, COIL['chain'], COIL['chain_aim'], pelvis=(-2, -8, 36), chest_lean=10), 'inout'),
        (5, K(SWING, (-24, 6, 100), (0, 95), pelvis=(-1, 4, 52), chest_lean=-6, **fa), 'out'), (6, K(SWING, (-22, 20, 102), (0, 70), pelvis=(-2, 14, 54), chest_lean=-8, **fb), 'inout'),
        (7, K(HIT, (-8, 44, 84), (4, 20), 0.35), 'snap'), (8, land(4, -25), 'out'), (9, K(SET, (-6, 38, 66), (8, -60), 0.3), 'inout'), (11, PULL, 'inout'), (13, BACK, 'inout'), (14, G, 'out')],
        impact=9, support=sup(air_L=(4, 5, 6), air_R=(4, 5, 6, 12, 13)), durations=[100, 100, 110, 130, 100, 100, 120, 50, 110, 200, 100, 90, 90, 90, 100], sheet=[0, 3, 6, 7, 8, 11],
        notes='공용 전법. 5~7번에 뛰어올라 가장 높은 곳에서 사슬을 머리 위로 돌리고, 착지하며 위에서 내려친다. 끝은 9번에 닿는다.')
    out['s6'] = clip('S6 올려치고 내려치기', [(0, G, 'linear'), (2, rise['coil'], 'inout'), (4, rise['swing'], 'in'), (5, rise['throw'], 'snap'), (6, rise['landing'], 'out'),
        (7, K(SET, (-14, 36, 80), (0, 100), 0.2), 'inout'), (9, down['throw'], 'snap'), (10, down['landing'], 'out'), (11, down['settle'], 'inout'), (12, PULL, 'inout'), (13, BACK, 'inout'), (14, G, 'out')],
        impact=7, impact2=11, support=sup(air_R=(3, 4, 13)), durations=[100, 100, 120, 150, 55, 45, 90, 110, 130, 45, 60, 200, 90, 90, 100], sheet=[0, 2, 5, 6, 9, 10],
        notes='공용 전법. 7번에 아래에서 위로 걸어 올리고, 손을 머리 위로 넘겨 11번에 위에서 내려친다.')
    return out
