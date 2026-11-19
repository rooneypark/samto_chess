"""창·방패: 평타 A2, A3, B1, B2, B3 and 전법 S1..S6. The shield stays between the body and the target.

    A2 방패 밀고 찌르기   A3 어깨 위 내리꽂기   B1 방패 치기   B2 가로 휘두르기   B3 올려치기   (B set reworked 2026-11-19)
    S1 굳건한 방어 (의용보병)   wide and low behind the shield, spear upright at the side. Nothing is struck.
    S2 사수 (조홍)              one step forward and the shield is planted. Nothing is struck.
    S3 돌파 찌르기   S4 도약 내리꽂기   S5 이연 찌르기   S6 돌려 찌르기   (공용)
"""
from clips.kit import *

REACH = 64.0      # tip is 64 px ahead of the spear hand

def build(mod):
    G, COIL, STEP, HIT, OVER, SET, PULL, BACK = mod.GUARD, mod.A1_COIL, mod.A1_STEP, mod.A1_HIT, mod.A1_OVER, mod.A1_SETTLE, mod.A1_PULL, mod.A1_BACK
    def S(base, spear, aim, **kw):
        d = dict(base); d['spear'] = spear; d['spear_aim'] = aim; d.update(kw); return d
    def at(turn, pitch, over=0.0): return reach_hand(REACH, turn, pitch, over)
    step = sup(air_L=(5, 6, 12, 13)); out = {}

    out['a2'] = clip('A2 방패 밀고 찌르기', [(0, G, 'linear'), (3, S(COIL, (-22, -18, 54), (4, 6), shield=(8, 22, 62)), 'inout'),
        (5, S(STEP, (-22, -10, 54), (5, 4), shield=(8, 44, 62), shield_aim=(0, 0), pelvis=(0, 2, 40)), 'snap'), (6, S(STEP, (-21, -4, 54), (8, -2), shield=(10, 34, 60)), 'inout'),
        (7, HIT, 'snap'), (8, OVER, 'out'), (9, SET, 'inout'), (11, PULL, 'inout'), (13, BACK, 'inout'), (14, G, 'out')], support=sup(air_L=(4, 5, 6, 12, 13)),
        notes='6번에 방패를 앞으로 밀어 길을 열고, 그 뒤에서 8번에 찌른다.')
    hi = (20, -28)
    out['a3'] = clip('A3 어깨 위 내리꽂기', [(0, G, 'linear'), (2, S(G, (-24, 0, 70), (-4, 30)), 'inout'), (4, S(COIL, (-27, -12, 88), (6, -20)), 'inout'),
        (6, S(STEP, (-24, 6, 88), (10, -28)), 'in'), (7, S(HIT, at(*hi), hi), 'snap'), (8, S(OVER, at(*hi, 6), hi), 'out'), (9, S(SET, at(*hi, -3), hi), 'inout'),
        (11, S(PULL, (-19, 12, 64), (6, -6)), 'inout'), (13, BACK, 'inout'), (14, G, 'out')], support=step,
        notes='창을 어깨 위로 들어 올려 방패 너머에서 아래로 꽂는다.')
    lo = (15, 6)
    out['b1'] = clip('B1 낮은 찌르기', [(0, G, 'linear'), (4, S(COIL, (-22, -18, 40), (4, -2), pelvis=(-2, -10, 35)), 'inout'), (6, S(STEP, (-21, -4, 40), (6, 2), pelvis=(-1, 3, 36)), 'in'),
        (7, S(HIT, at(*lo), lo, pelvis=(0, 13, 34), chest_lean=26), 'snap'), (8, S(OVER, at(*lo, 6), lo, pelvis=(0, 15, 34), chest_lean=28), 'out'),
        (9, S(SET, at(*lo, -3), lo, pelvis=(0, 12, 35), chest_lean=24), 'inout'), (11, PULL, 'inout'), (13, BACK, 'inout'), (14, G, 'out')], support=step,
        notes='방패 뒤에 낮게 웅크려 아래에서 살짝 올려 찌른다.')
    mid = (15, -8)
    def twice(title, first_over, impact, impact2=None, notes='', durations=None):
        return clip(title, [(0, G, 'linear'), (3, COIL, 'inout'), (4, STEP, 'in'), (5, S(HIT, at(*mid, first_over), mid, pelvis=(0, 9, 39)), 'snap'),
            (7, S(PULL, (-21, -8, 53), (5, 2), pelvis=(-1, 4, 39)), 'inout'), (9, HIT, 'snap'), (10, OVER, 'out'), (11, SET, 'inout'), (12, PULL, 'inout'), (13, BACK, 'inout'), (14, G, 'out')],
            impact=impact, impact2=impact2, support=sup(air_L=(4, 13)), durations=durations or [100, 90, 100, 120, 50, 45, 90, 110, 110, 40, 60, 150, 90, 90, 100], sheet=[0, 3, 5, 7, 9, 11], notes=notes)
    out['b2'] = twice('B2 이단 찌르기', -22, 10, notes='6번은 표적 22px 앞에서 멈추는 속임 찌르기, 10번이 실제 타격이다.')
    deep = [(0, G, 'linear'), (4, S(COIL, (-23, -22, 54), (4, 2), pelvis=(-3, -13, 38)), 'inout'), (6, STEP, 'in'),
            (7, S(HIT, at(*mid), mid, pelvis=(0, 16, 35), chest_lean=26, shield=(10, 42, 56)), 'snap'), (8, S(OVER, at(*mid, 8), mid, pelvis=(0, 18, 34.5), chest_lean=28, shield=(10, 44, 56)), 'out'),
            (9, S(SET, at(*mid, 2), mid, pelvis=(0, 15, 35.5), chest_lean=24), 'inout'), (11, PULL, 'inout'), (13, BACK, 'inout'), (14, G, 'out')]
    out['b3'] = clip('B3 깊은 돌진 찌르기', deep, support=step, notes='더 멀리 물러났다가 방패를 앞세워 깊이 들어가 찌른다. 끝에서 8px 더 민다.')

    def hold(title, who, keys, air_L=()):
        return clip(title, keys, impact=8, event='발동', support=sup(air_L=air_L), durations=D_CAST, sheet=[0, 3, 5, 7, 10, 12], notes=who)
    def wall(pz, sy, lean): return S(G, (-25, 2, 57), (-5, 85), shield=(0, sy, 58), shield_aim=(0, 0), pelvis=(0, 5, pz), chest_lean=lean, hip_turn=6, chest_turn=4)
    out['s1'] = hold('S1 굳건한 방어', '의용보병 전법. 방패를 몸 정면으로 당기고 무릎과 골반을 낮춘 뒤, 창은 몸 옆에 세우고 방패에 가슴을 싣는다. 두 발은 제자리. 닿는 공격이 아니다.', [
        (0, G, 'linear'), (3, S(G, (-24, 2, 58), (-4, 80), shield=(6, 26, 60), pelvis=(0, 0, 40)), 'inout'),
        (5, S(G, (-25, 2, 56), (-5, 84), shield=(2, 30, 56), pelvis=(0, 2, 33), chest_lean=16, hip_turn=10, chest_turn=10), 'inout'),
        (7, wall(34, 36, 20), 'snap'), (8, wall(34.6, 38, 21), 'out'), (10, wall(34, 36, 20), 'inout'), (12, S(G, (-23, 0, 54), (-5, 60), shield=(8, 26, 60), pelvis=(0, 1, 41)), 'inout'), (14, G, 'inout')])
    def plant(pz, sy): return S(HIT, (-25, 10, 56), (-5, 85), shield=(0, sy, 56), shield_aim=(0, 0), pelvis=(0, 12, pz), chest_lean=24)
    out['s2'] = hold('S2 사수', '조홍 전법. 한 걸음 내딛어 앞발에 무게를 싣고 방패를 앞에 단단히 세운다. 창은 몸 옆에 세운다. 닿는 공격이 아니다.', [
        (0, G, 'linear'), (3, S(COIL, (-24, -6, 58), (-4, 70), shield=(14, 16, 62)), 'inout'), (5, S(STEP, (-24, 2, 58), (-5, 82), shield=(4, 34, 60)), 'in'),
        (6, plant(33.5, 43), 'snap'), (7, plant(32.5, 46), 'out'), (10, plant(33, 45), 'inout'), (12, S(PULL, (-22, 6, 54), (-4, 60)), 'inout'), (13, BACK, 'inout'), (14, G, 'out')], air_L=(4, 5, 13))
    out['s3'] = clip('S3 돌파 찌르기', deep, support=step, durations=D_SKILL, sheet=[0, 4, 6, 7, 9, 12], notes='공용 전법. 깊이 물러나 힘을 모았다가 방패를 앞세워 한 번에 깊이 찌르고 버틴다.')
    air = {'foot.L': foot((8, 16), 6, air=8), 'foot.R': foot((-9, -10), 48, air=8)}; air2 = {'foot.L': foot((8, 24), 6, air=10), 'foot.R': foot((-9, -10), 48, air=9)}
    out['s4'] = clip('S4 도약 내리꽂기', [(0, G, 'linear'), (3, S(G, (-24, -4, 60), (-4, 30), pelvis=(-1, -4, 36), chest_lean=12), 'inout'),
        (5, S(G, (-28, 0, 90), (4, -10), pelvis=(0, 2, 52), chest_lean=-4, **air), 'out'), (6, S(G, (-28, 8, 92), (8, -25), pelvis=(0, 8, 54), chest_lean=-6, **air2), 'inout'),
        (7, S(HIT, at(*hi), hi, pelvis=(0, 13, 35), chest_lean=26), 'snap'), (8, S(OVER, at(*hi, 6), hi, pelvis=(0, 15, 34), chest_lean=28), 'out'),
        (10, S(SET, at(*hi, 2), hi, pelvis=(0, 13, 35.5), chest_lean=25), 'inout'), (12, S(PULL, (-19, 12, 64), (6, -6)), 'inout'), (13, BACK, 'inout'), (14, G, 'out')],
        support=sup(air_L=(4, 5, 6, 13), air_R=(4, 5, 6)), durations=D_SKILL, sheet=[0, 3, 6, 7, 10, 12], notes='공용 전법. 5~7번에 두 발이 뜨고, 창을 위에서 내리꽂으며 8번에 착지한다.')
    out['s5'] = twice('S5 이연 찌르기', 0, 6, 10, notes='공용 전법. 6번에 찌르고 반만 거둔 뒤 10번에 다시 찌른다.', durations=[100, 100, 110, 150, 50, 45, 80, 110, 110, 45, 60, 170, 90, 90, 100])
    def C(theta, pz, air=0.0, fixed=False):
        h = rot((-16.4, 38.8), theta); sh = rot((10, 30), theta); p = rot((0, 8), theta)
        fl, fr = ((8, 14), (-9, -12)) if fixed else (rot((8, 14), theta), rot((-9, -12), theta)); yaw = 0 if fixed else theta
        return S(G, (h[0], h[1], 54 + (pz - 38)), (15 - theta, -8), shield=(sh[0], sh[1], 58), shield_aim=(-theta, 0), pelvis=(p[0], p[1], pz), hip_turn=10 + theta, chest_turn=8 + theta, chest_lean=12,
                 **{'foot.L': foot(fl, 6 + yaw, air=air), 'foot.R': foot(fr, 48 + yaw, air=air)})
    out['s6'] = posed('S6 돌려 찌르기', [G, blend(G, C(25, 40, fixed=True), 0.6), C(50, 38.5, fixed=True), C(68, 37, fixed=True), C(72, 36.5, fixed=True), C(70, 36.5, fixed=True),
                                      C(28, 39, 3), C(0, 38, 1.5), C(-70, 39.5, 3), C(-140, 40, 4), C(-205, 40, 4), C(-265, 39.5, 3), C(-315, 40, 2), blend(C(14, 41, 1), G, 0.55), G],
                      impact=8, support=[('L', 'R')] * 6 + [()] * 8 + [('L', 'R')], durations=[100, 100, 110, 120, 140, 180, 50, 45, 50, 55, 60, 70, 90, 100, 100], sheet=[0, 4, 6, 7, 9, 11],
                      notes='공용 전법. 2~6번에 상체를 감고, 7~14번에 낮게 뜬 채 한 바퀴 돈다. 8번에 창끝이 정면을 지나며 친다. 방패도 몸과 함께 돈다.')

    # ---- 2026-11-19: the B set is no longer three more thrusts ------------------------------------------------------------
    # variety.py: all six basic attacks were thrusts, 1 to 8 px apart. The A set keeps the thrusts (straight, behind a shield
    # push, over the shoulder). The B set is now what else a shield-and-spear soldier does:
    #     B1 방패 치기       the shield itself is driven into the target with the whole body; the spear stays upright
    #     B2 가로 휘두르기   the body winds to the right and the short spear is swung round level to the front
    #     B3 올려치기        the tip drops low, scoops up through the target and finishes high
    # B1 is an exception to the common strike point: a shield on the forearm reaches 66 px, not 100 (the game's approach
    # step covers the rest for a unit above or below; beside the target the shield rim is what touches).
    up = (-6, 72)
    def bash(pelvis, sh, lean, **kw): return S(HIT, (-24, pelvis[1] - 6, 54), up, shield=sh, shield_aim=(0, 0), pelvis=pelvis, chest_lean=lean, **kw)
    out['b1'] = clip('B1 방패 치기', [(0, G, 'linear'), (3, S(COIL, (-24, -10, 54), up, shield=(10, 12, 60), shield_aim=(0, 5), pelvis=(-1, -6, 41)), 'inout'),
        (5, S(COIL, (-24, -14, 53), up, shield=(9, 6, 58), shield_aim=(0, 5), pelvis=(-2, -10, 38.5), chest_lean=6), 'inout'),
        (6, S(STEP, (-23, -4, 54), up, shield=(8, 30, 58), shield_aim=(0, 0)), 'in'),
        (7, bash((0, 17, 37), (4, 62, 54), 22), 'snap'), (8, bash((0, 19.5, 36.5), (4, 66, 53.5), 25), 'out'), (9, bash((0, 16, 37.5), (5, 58, 55), 20), 'inout'),
        (11, PULL, 'inout'), (13, BACK, 'inout'), (14, G, 'out')], support=step, durations=[100, 100, 110, 110, 150, 150, 45, 40, 60, 200, 100, 90, 80, 80, 100],
        notes='방패를 가슴 앞으로 당겨 웅크렸다가(4~6번) 한 발 내딛으며 방패로 들이받는다(8번). 창은 몸 옆에 세운 채다. 방패가 닿는 공격이라 창끝 타격점과 다르다(방패가 66px까지 나간다).')
    out['b2'] = posed('B2 가로 휘두르기', [G, blend(G, C(25, 40, fixed=True), 0.6), C(48, 38.5, fixed=True), C(66, 37, fixed=True), C(72, 36.5, fixed=True), C(71, 36.5, fixed=True),
                                        C(36, 37.5, fixed=True), C(0, 38, fixed=True), C(-10, 37.5, fixed=True), C(-7, 38, fixed=True), C(-4, 38.5, fixed=True),
                                        blend(C(4, 39.5, fixed=True), G, 0.3), blend(C(10, 41, fixed=True), G, 0.6), blend(C(12, 42, fixed=True), G, 0.85), G],
                      impact=8, support=[('L', 'R')] * 15, durations=[100, 90, 100, 110, 130, 160, 55, 45, 60, 180, 100, 90, 90, 90, 100], sheet=[0, 3, 5, 6, 7, 9],
                      notes='두 발은 제자리. 2~6번에 상체를 오른쪽으로 크게 감고, 7~8번에 창을 수평으로 옆에서 앞으로 휘둘러 친다. 방패도 몸과 함께 돈다.')
    rise = (15, 10)
    out['b3'] = clip('B3 올려치기', [(0, G, 'linear'), (3, S(COIL, (-24, -10, 50), (6, -34), pelvis=(-1, -6, 37), chest_lean=12), 'inout'),
        (5, S(COIL, (-24, -18, 46), (4, -30), pelvis=(-2, -10, 34), chest_lean=16), 'inout'), (6, S(STEP, (-21, -4, 42), (8, -10), pelvis=(-1, 3, 36)), 'in'),
        (7, S(HIT, at(*rise), rise, pelvis=(0, 13, 36), chest_lean=22), 'snap'), (8, S(OVER, (-15, 44, 62), (15, 34), pelvis=(0, 15, 38.5), chest_lean=14), 'out'),
        (9, S(SET, (-15.5, 42, 64), (15, 28), pelvis=(0, 13, 39), chest_lean=12), 'inout'), (11, PULL, 'inout'), (13, BACK, 'inout'), (14, G, 'out')], support=step,
        durations=[100, 100, 110, 120, 130, 160, 50, 45, 80, 180, 100, 90, 90, 90, 100],
        notes='창끝을 앞쪽 낮게 떨궜다가(4~6번) 아래에서 위로 쳐올린다. 8번에 표적을 지나 9번에 높이 올라가 멈춘다.')

    # ---- skills that used to be a basic attack played slower: now their own moves (user review 2026-11-18) -------
    out['s3'] = clip('S3 방패 올려치고 내리꽂기', [(0, G, 'linear'), (3, S(COIL, (-22, -18, 54), (4, 6), shield=(8, 22, 62)), 'inout'),
        (5, S(STEP, (-24, -6, 70), (5, -5), shield=(8, 42, 76), shield_aim=(0, 20), pelvis=(0, 2, 41)), 'snap'), (6, S(STEP, (-26, 4, 88), (14, -26), shield=(10, 36, 66)), 'inout'),
        (7, S(HIT, at(*hi), hi), 'snap'), (8, S(OVER, at(*hi, 6), hi), 'out'), (10, S(SET, at(*hi, 2), hi), 'inout'), (12, S(PULL, (-19, 12, 64), (6, -6)), 'inout'), (13, BACK, 'inout'), (14, G, 'out')],
        impact=8, support=sup(air_L=(4, 5, 6, 13)), durations=D_SKILL, sheet=[0, 3, 5, 6, 7, 10], notes='공용 전법. 6번에 방패를 앞 위로 올려쳐 상대 무기를 걷어내고, 그 위로 창을 들어 8번에 내리꽂는다.')
    back = S(PULL, (-21, -8, 53), (5, 2), pelvis=(-1, 4, 39))
    out['s5'] = clip('S5 삼연 찌르기', [(0, G, 'linear'), (2, COIL, 'inout'), (3, STEP, 'in'), (4, S(HIT, at(*mid), mid, pelvis=(0, 9, 39)), 'snap'), (5, back, 'inout'),
        (7, S(HIT, at(*lo), lo, pelvis=(0, 12, 35), chest_lean=24), 'snap'), (8, back, 'inout'), (10, HIT, 'snap'), (11, OVER, 'out'), (12, SET, 'inout'), (13, BACK, 'inout'), (14, G, 'out')],
        impact=5, impact2=8, support=sup(air_L=(3, 13)), durations=[100, 100, 120, 150, 45, 90, 80, 45, 90, 90, 45, 70, 200, 90, 100], sheet=[0, 2, 4, 7, 10, 12],
        notes='공용 전법. 5번에 가운데, 8번에 낮게, 11번에 다시 가운데를 찌른다. 방패는 끝까지 앞에 둔다.')
    return out
