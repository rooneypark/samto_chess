"""중무기: 평타 A2, A3, B1, B2, B3 and 전법 S1..S6. Weight first: slow up, fast down, a bounce, a slow heave back.

    A2 가로 후려치기   A3 올려치기   B1 밀어치기   B2 두 번 찍기   B3 크게 돌려 내려찍기
    S1 호치 (허저)        the mace is dragged to the chest, the body compresses, then opens wide. Nothing is struck.
    S2 대부 강타 (서황)   a long lift overhead and a near-vertical chop.
    S3 대회전   S4 지면 강타   S5 올려쳐 올리기   S6 연속 강타   (공용)
"""
from clips.kit import *
from samto_motion import unit

REACH = 70.0      # the head is 70 px beyond the left (rear) hand

def build(mod):
    G, LIFT, TOP, TOP2, STEP, HIT, BOUNCE, SET, HEAVE, BACK = (mod.GUARD, mod.A1_LIFT, mod.A1_TOP, mod.A1_TOP2, mod.A1_STEP, mod.A1_HIT, mod.A1_BOUNCE, mod.A1_SETTLE, mod.A1_HEAVE, mod.A1_BACK)
    def W(base, rear, axis, front=None, **kw):
        d = dict(base); d['rear'] = rear; d['axis'] = axis
        if front is not None: d['front'] = front
        d.update(kw); return d
    def hit(axis, over=0.0, strike=STRIKE):
        u = unit(axis); return tuple(strike[i] + (over - REACH) * u[i] for i in range(3))
    DH = [110, 110, 120, 130, 130, 140, 200, 45, 50, 80, 220, 110, 110, 100, 100]; step = sup(air_L=(7, 13)); out = {}

    side = (0.1, 0.995, 0.0)
    out['a2'] = clip('A2 가로 후려치기', [(0, G, 'linear'), (3, W(LIFT, (-4, 18, 58), (-0.75, 0.3, 0.59), 30), 'inout'),
        (5, W(TOP, (-8, 14, 58), (-0.93, -0.1, 0.35), 30, pelvis=(0, -7, 42)), 'out'), (6, W(TOP, (-8, 13, 58), (-0.92, -0.2, 0.33), 30, pelvis=(0, -7.5, 41.5)), 'inout'),
        (7, W(STEP, (-12, 24, 52), (-0.6, 0.78, 0.15), 22), 'in'), (8, W(HIT, hit(side), side, 18), 'snap'), (9, W(BOUNCE, (-2, 36, 46), (0.75, 0.66, 0.0), 18), 'out'),
        (10, W(SET, (0, 36, 46), (0.82, 0.57, -0.05), 14), 'inout'), (12, HEAVE, 'inout'), (13, BACK, 'inout'), (14, G, 'out')], impact=9, support=step, durations=DH, sheet=[0, 6, 7, 8, 10, 12],
        notes='무기를 오른쪽 바깥으로 눕혀 뺐다가 가슴 높이에서 가로로 후려친다. 친 뒤 왼쪽으로 끌려간다.')
    up = (0.1, 0.99, 0.08)
    out['a3'] = clip('A3 올려치기', [(0, G, 'linear'), (3, W(LIFT, (0, 14, 52), (-0.45, 0.1, 0.2), 30, pelvis=(0, -3, 41)), 'inout'),
        (5, W(TOP, (-2, 12, 50), (-0.55, -0.45, -0.6), 30, pelvis=(0, -7, 38), chest_lean=10), 'out'), (6, W(TOP, (-2, 11, 49), (-0.55, -0.5, -0.62), 30, pelvis=(0, -7.5, 37), chest_lean=12), 'inout'),
        (7, W(STEP, (-12, 22, 44), (-0.2, 0.75, -0.5), 12, pelvis=(0, 2, 38)), 'in'), (8, W(HIT, hit(up), up, 16, pelvis=(0, 5, 36), chest_lean=26), 'snap'),
        (9, W(BOUNCE, (-6, 30, 58), (0.0, 0.6, 0.8), 20, pelvis=(0, 5, 41), chest_lean=6), 'out'), (10, W(SET, (-6, 28, 62), (-0.05, 0.5, 0.86), 22, pelvis=(0, 4, 41), chest_lean=4), 'inout'),
        (12, HEAVE, 'inout'), (13, BACK, 'inout'), (14, G, 'out')], impact=9, support=step, durations=DH, sheet=[0, 6, 7, 8, 10, 12],
        notes='무기 머리를 몸 뒤 아래로 떨어뜨렸다가, 무릎을 펴며 아래에서 위로 쳐올린다. 친 뒤 무기가 머리 위로 올라간다.')
    out['b1'] = clip('B1 짧게 찍기', [(0, G, 'linear'), (3, LIFT, 'inout'), (5, W(LIFT, LIFT['rear'], LIFT['axis'], pelvis=(0, -4, 44)), 'out'), (6, STEP, 'in'), (7, HIT, 'snap'),
        (8, BOUNCE, 'out'), (9, SET, 'inout'), (11, HEAVE, 'inout'), (13, BACK, 'inout'), (14, G, 'out')], impact=8, support=sup(air_L=(6, 12, 13)), sheet=[0, 5, 6, 7, 9, 11],
        notes='머리 위까지 들지 않고 어깨 높이에서 짧게 내려찍는다. 준비가 짧은 기본 견제다.')
    hp = HIT['axis']
    out['b2'] = clip('B2 두 번 찍기', [(0, G, 'linear'), (2, LIFT, 'inout'), (4, TOP, 'out'), (5, STEP, 'in'), (6, HIT, 'snap'), (7, BOUNCE, 'out'),
        (9, W(STEP, (-10, 26, 70), (-0.1, 0.6, 0.79), 18, pelvis=(0, 3, 41), **{'foot.L': HIT['foot.L']}), 'inout'), (10, HIT, 'snap'), (11, BOUNCE, 'out'), (12, HEAVE, 'inout'),
        (13, BACK, 'inout'), (14, G, 'out')], impact=7, impact2=11, support=sup(air_L=(5, 13)),
        durations=[110, 110, 120, 130, 170, 45, 45, 80, 110, 150, 45, 60, 180, 130, 100], sheet=[0, 4, 6, 9, 10, 12],
        notes='7번에 찍고, 튀어 오른 무기를 반만 들어 11번에 다시 찍는다. 발은 첫 디딤 그대로 둔다.')
    out['b3'] = clip('B3 크게 돌려 내려찍기', [(0, G, 'linear'), (2, W(LIFT, (0, 14, 52), (-0.5, 0.1, 0.1), 30), 'inout'),
        (4, W(TOP, (-4, 10, 52), (-0.55, -0.45, -0.55), 30, pelvis=(0, -6, 41)), 'inout'), (5, W(TOP, (-12, 6, 66), (-0.5, -0.75, 0.3), 28), 'inout'), (6, TOP2, 'out'),
        (7, STEP, 'in'), (8, HIT, 'snap'), (9, BOUNCE, 'out'), (10, SET, 'inout'), (12, HEAVE, 'inout'), (13, BACK, 'inout'), (14, G, 'out')], impact=9, support=step,
        durations=[110, 100, 100, 110, 110, 110, 190, 45, 50, 80, 220, 110, 110, 100, 100], sheet=[0, 4, 6, 7, 8, 10],
        notes='무기 머리를 몸 뒤 아래로 떨어뜨려 뒤에서 위로 크게 한 바퀴 돌린 뒤 내려찍는다.')

    # S1 호치 (허저): drag to the chest, compress, open
    def held(pz, rear, axis, front, lean, right=None):
        kw = dict(pelvis=(0, 0, pz), hip_turn=6, chest_turn=6, chest_lean=lean)
        return W(G, rear, axis, front, **kw)
    out['s1'] = clip('S1 호치', [(0, G, 'linear'), (3, held(40, (6, 20, 54), (-0.5, 0.2, 0.84), 30, 8), 'inout'), (5, held(33, (6, 22, 46), (-0.6, 0.25, 0.76), 28, 20), 'inout'),
        (6, held(32, (6, 22, 45), (-0.62, 0.25, 0.74), 28, 22), 'out'), (7, held(43, (-10, 24, 66), (-0.75, 0.1, 0.65), 30, -8), 'snap'), (8, held(44.2, (-11, 24, 68), (-0.77, 0.08, 0.63), 30, -10), 'out'),
        (10, held(43, (-10, 24, 66), (-0.75, 0.1, 0.65), 30, -8), 'inout'), (12, held(42, (4, 18, 52), (-0.45, 0.2, 0.87), 32, 4), 'inout'), (14, G, 'inout')], impact=8, event='발동',
        durations=D_CAST, sheet=[0, 3, 6, 7, 10, 12], notes='허저 전법. 철퇴를 가슴 앞으로 끌어와 깊이 웅크렸다가, 지면을 밀며 무기를 몸 바깥으로 벌리고 가슴을 편다. 닿는 공격이 아니다.')
    chop = (0.2, 0.93, -0.3)
    out['s2'] = clip('S2 대부 강타', [(0, G, 'linear'), (3, LIFT, 'inout'), (5, W(TOP, TOP['rear'], TOP['axis'], pelvis=(0, -8, 40), chest_lean=-10), 'out'),
        (6, W(TOP2, TOP2['rear'], TOP2['axis'], pelvis=(0, -8.5, 39), chest_lean=-12), 'inout'), (7, STEP, 'in'), (8, W(HIT, hit(chop), chop, 16, pelvis=(0, 5, 35), chest_lean=26), 'snap'),
        (9, W(BOUNCE, hit(chop, 0, (0, 100, 49)), chop, 16, pelvis=(0, 5, 36), chest_lean=24), 'out'), (10, W(SET, hit(chop), chop, 16, pelvis=(0, 5, 34.5), chest_lean=27), 'inout'),
        (12, HEAVE, 'inout'), (13, BACK, 'inout'), (14, G, 'out')], impact=9, support=step, durations=[110, 110, 120, 130, 140, 160, 240, 45, 50, 90, 240, 110, 110, 100, 100], sheet=[0, 6, 7, 8, 10, 12],
        notes='서황 전법. 도끼를 머리 위까지 길게 들어 올려 멈췄다가, 앞발을 박고 골반을 낮추며 가파르게 내려찍는다.')
    # S3 대회전: one full turn with the weapon out level
    def C(theta, pz, air=0.0, fixed=False):
        r = rot((-7, 30.35), theta); a = rot((0.1, 0.995), theta); p = rot((0, 4), theta)
        fl, fr = ((8, 12), (-9, -12)) if fixed else (rot((8, 12), theta), rot((-9, -12), theta)); yaw = 0 if fixed else theta
        return W(G, (r[0], r[1], 45 + (pz - 37)), (a[0], a[1], 0.0), 18, pelvis=(p[0], p[1], pz), hip_turn=theta, chest_turn=theta, chest_lean=16,
                 **{'foot.L': foot(fl, 5 + yaw, air=air), 'foot.R': foot(fr, 45 + yaw, air=air)})
    out['s3'] = posed('S3 대회전', [G, LIFT, C(45, 38, fixed=True), C(62, 37, fixed=True), C(66, 36.5, fixed=True), C(64, 36.5, fixed=True),
                                  C(25, 38, 3), C(0, 37, 1.5), C(-70, 38.5, 3), C(-140, 39, 4), C(-205, 39, 4), C(-265, 38.5, 3), C(-315, 39, 2), BACK, G],
                      impact=8, support=[('L', 'R')] * 6 + [()] * 7 + [('R',), ('L', 'R')], durations=[110, 110, 120, 130, 150, 200, 55, 45, 55, 60, 65, 75, 95, 110, 100], sheet=[0, 4, 6, 7, 9, 11],
                      notes='공용 전법. 2~6번에 무기를 눕혀 오른쪽으로 감고, 7~14번에 낮게 뜬 채 한 바퀴 돈다. 8번에 무기 머리가 정면을 지나며 친다.')
    ground = (0.0, 100.0, 6.0); slam = (0.0, 0.87, -0.5)
    air = {'foot.L': foot((8, 14), 5, air=8), 'foot.R': foot((-9, -10), 45, air=8)}; air2 = {'foot.L': foot((8, 22), 5, air=10), 'foot.R': foot((-9, -10), 45, air=9)}
    out['s4'] = clip('S4 지면 강타', [(0, G, 'linear'), (3, W(LIFT, LIFT['rear'], LIFT['axis'], pelvis=(0, -3, 37), chest_lean=2), 'inout'),
        (5, W(TOP, (-12, 8, 86), (-0.35, -0.45, 0.82), 26, pelvis=(0, 0, 52), chest_lean=-8, **air), 'out'), (6, W(TOP2, (-12, 12, 88), (-0.3, -0.3, 0.9), 24, pelvis=(0, 6, 54), chest_lean=-10, **air2), 'inout'),
        (7, W(HIT, hit(slam, 0, ground), slam, 20, pelvis=(0, 11, 34), chest_lean=30, **{'foot.L': foot((7, 30), 4)}), 'snap'),
        (8, W(BOUNCE, hit((0, 0.9, -0.43), 0, (0, 100, 14)), (0, 0.9, -0.43), 20, pelvis=(0, 8.5, 35.5), chest_lean=26, **{'foot.L': foot((7, 30), 4)}), 'out'),
        (10, W(SET, hit(slam, 0, ground), slam, 20, pelvis=(0, 10.5, 34.5), chest_lean=29, **{'foot.L': foot((7, 30), 4)}), 'inout'),
        (12, W(HEAVE, (7, 32, 47), (-0.1, 0.8, 0.3), 14, pelvis=(0, 7, 40), **{'foot.L': foot((7, 30), 4)}), 'inout'), (13, BACK, 'inout'), (14, G, 'out')],
        impact=8, support=sup(air_L=(4, 5, 6, 13), air_R=(4, 5, 6)), durations=[110, 110, 120, 140, 100, 100, 130, 45, 60, 100, 240, 110, 110, 100, 100], sheet=[0, 3, 6, 7, 10, 12],
        notes='공용 전법. 5~7번에 뛰어올라 8번에 앞 칸 바닥을 내려찍는다. 이 전법만 타격점이 가슴 높이가 아니라 지면이다.')
    out['s5'] = dict(out['a3'], title='S5 올려쳐 올리기', durations=[110, 110, 120, 130, 140, 160, 230, 45, 60, 110, 240, 110, 110, 100, 100],
                     notes='공용 전법. 올려치기를 더 길게 모았다가 친다. 친 뒤 무기를 머리 위에서 오래 버틴다.')
    out['s6'] = dict(out['b2'], title='S6 연속 강타', durations=[110, 110, 130, 150, 190, 45, 50, 90, 120, 170, 45, 70, 220, 130, 100], notes='공용 전법. 7번과 11번에 두 번 내려찍는다. 평타보다 준비와 버팀이 길다.')

    # ---- skills that used to be a basic attack played slower: now their own moves (user review 2026-11-18) -------
    hl = {'foot.L': HIT['foot.L']}
    out['s5'] = clip('S5 후려치고 내려찍기', [(0, G, 'linear'), (2, W(LIFT, (-4, 18, 58), (-0.75, 0.3, 0.59), 30), 'inout'), (4, W(TOP, (-8, 14, 58), (-0.93, -0.1, 0.35), 30, pelvis=(0, -7, 42)), 'out'),
        (5, W(STEP, (-12, 24, 52), (-0.6, 0.78, 0.15), 22), 'in'), (6, W(HIT, hit(side), side, 18), 'snap'), (7, W(BOUNCE, (-2, 36, 46), (0.75, 0.66, 0.0), 14), 'out'),
        (8, W(SET, (-6, 30, 60), (0.2, 0.6, 0.77), 16, pelvis=(0, 3, 40)), 'inout'), (9, W(STEP, (-10, 26, 70), (-0.1, 0.6, 0.79), 18, pelvis=(0, 3, 41), **hl), 'inout'),
        (10, HIT, 'snap'), (11, BOUNCE, 'out'), (12, HEAVE, 'inout'), (13, BACK, 'inout'), (14, G, 'out')], impact=7, impact2=11, support=sup(air_L=(5, 13)),
        durations=[110, 110, 130, 150, 170, 45, 50, 90, 110, 160, 45, 70, 220, 120, 100], sheet=[0, 4, 6, 8, 10, 12],
        notes='공용 전법. 7번에 가로로 후려치고, 그 관성으로 무기를 머리 위로 끌어올려 11번에 내려찍는다. 서로 다른 두 방향의 타격이다.')
    out['s6'] = clip('S6 도약 강타', [(0, G, 'linear'), (3, W(LIFT, LIFT['rear'], LIFT['axis'], pelvis=(0, -3, 37), chest_lean=2), 'inout'),
        (5, W(TOP, (-12, 8, 86), (-0.35, -0.45, 0.82), 26, pelvis=(0, 0, 52), chest_lean=-8, **air), 'out'), (6, W(TOP2, (-12, 12, 88), (-0.3, -0.3, 0.9), 24, pelvis=(0, 6, 54), chest_lean=-10, **air2), 'inout'),
        (7, HIT, 'snap'), (8, BOUNCE, 'out'), (10, SET, 'inout'), (12, HEAVE, 'inout'), (13, BACK, 'inout'), (14, G, 'out')], impact=8, support=sup(air_L=(4, 5, 6, 13), air_R=(4, 5, 6)),
        durations=[110, 110, 120, 140, 100, 100, 130, 45, 60, 100, 240, 110, 110, 100, 100], sheet=[0, 3, 6, 7, 10, 12],
        notes='공용 전법. 5~7번에 뛰어올라 8번에 표적의 가슴 높이를 내려찍는다(S4는 바닥, 이것은 표적).')
    return out
