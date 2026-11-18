"""보행 창: the rest of the set. 평타 A2, A3, B1, B2, B3 and 전법 S1..S6.

평타 (basic attacks) stay basic: one clear idea each, no spins. Every hit lands on the common strike point.
    A1 정면 직창 (in foot_spear.py)   A2 상단 내리꽂기   A3 도약 내려찍기 (the finisher of the A combo)
    B1 비껴 디뎌 찌르기               B2 이단 찌르기     B3 감아 찌르기 (stance switch, the finisher of the B combo)

전법 (skills) follow the skills of the heroes who use this type (통합가이드 12절):
    S1 장판의 함성 (장비)   a shout: side step, spear planted, fist raised. Nothing is struck.
    S2 불굴 (하후돈)        a brace: spear held across the body, deep knees, then pushed out. Nothing is struck.
    S3 북벌의 창 (강유)     from below the guard line up into the chest: one big rising thrust.
    S4 백의도강 (여몽)      spear hidden low, then a long flat lunge that stays low.
    S5 추격 (문추)          a full thrust, half a withdrawal, and a second faster thrust.
    S6 선풍창 (공용)        wind up, then one full turn with the spear level; the blade strikes as it passes the front.
"""
import math
from samto_motion import blend

STRIKE = (0.0, 100.0, 45.0); REACH = 94.0        # tip is 94 px ahead of the rear hand's socket

def direction(turn, pitch):
    t, e = math.radians(turn), math.radians(pitch)
    return (math.sin(t) * math.cos(e), math.cos(t) * math.cos(e), math.sin(e))

def thrust(turn, pitch, over=0.0):
    """Where the rear hand must be for the tip to sit on the strike point (plus `over` px beyond it along the shaft)."""
    d = direction(turn, pitch); return tuple(STRIKE[i] + (over - REACH) * d[i] for i in range(3))

def feet(L=(9, 14), R=(-9, -12), la=0.0, ra=0.0, lh=0.0, rh=0.0, ly=8, ry=50):
    return {'foot.L': dict(at=L, yaw=ly, heel=lh, air=la), 'foot.R': dict(at=R, yaw=ry, heel=rh, air=ra)}

def sup(air_L=(), air_R=()):
    return [tuple(s for s, a in (('L', air_L), ('R', air_R)) if i not in a) for i in range(15)]

def build(pose, GUARD):
    def P(pelvis, hip, chest, rear, aim, front=62.0, hl=4.0, cl=8.0, f=None, **kw):
        d = dict(pelvis=pelvis, hip_turn=hip, hip_lean=hl, chest_turn=chest, chest_lean=cl, rear=rear, aim=aim, front=front); d.update(f or feet()); d.update(kw)
        return pose(**d)
    PULL = P((-1, 3, 40), 20, 36, (-18, -2, 46), (8, 10), 62, hl=6, cl=11, f=feet(L=(7, 28), ly=5, rh=1))
    BACK = P((0, 1, 43), 27, 46, (-19, -4, 45), (6, 30), 64, f=feet(L=(8, 19), la=4, ly=7))
    D = [100, 90, 90, 100, 150, 45, 40, 55, 70, 170, 90, 90, 80, 80, 100]
    out = {}

    # ---- A2 상단 내리꽂기: the rear hand comes up beside the chest and the thrust goes in from shoulder height -------
    hit = dict(f=feet(L=(7, 28), ly=5, rh=5))
    out['a2'] = dict(title='A2 상단 내리꽂기', impact=8, keys=[
        (0, GUARD, 'linear'),
        (3, P((-1, -5, 41), 36, 58, (-21, -12, 62), (6, -4), 74, cl=2), 'inout'),
        (5, P((-2, -10, 39.5), 44, 70, (-22, -22, 64), (8, -6), 80, hl=0, cl=0, f=feet(lh=3)), 'inout'),
        (6, P((-1, 2, 40.5), 22, 42, (-20, -6, 63), (9, -8), 66, f=feet(L=(8, 22), la=6, ly=6, rh=2)), 'in'),
        (7, P((0, 10, 38), 4, 8, thrust(10.7, -10), (10.7, -10), 52, hl=10, cl=24, **hit), 'snap'),
        (8, P((0, 13, 37.5), 2, 5, thrust(10.7, -10, 6), (10.7, -10), 52, hl=11, cl=27, f=feet(L=(7, 28), ly=5, rh=6)), 'out'),
        (9, P((0, 9, 38.5), 6, 10, thrust(10.7, -10, -3), (10.7, -10), 54, hl=9, cl=21, f=feet(L=(7, 28), ly=5, rh=4)), 'inout'),
        (11, PULL, 'inout'), (13, BACK, 'inout'), (14, GUARD, 'out')],
        support=sup(air_L=(6, 12, 13)), durations=D, sheet=[0, 5, 6, 7, 9, 12])

    # ---- A3 도약 내려찍기: sink, jump with the spear over the right shoulder, land on the hit ------------------------
    out['a3'] = dict(title='A3 도약 내려찍기', impact=8, keys=[
        (0, GUARD, 'linear'),
        (3, P((-1, -4, 36), 34, 52, (-21, -8, 44), (2, 30), 56, cl=12), 'inout'),
        (5, P((0, 0, 52), 20, 36, (-23, -4, 84), (-6, 62), 42, hl=0, cl=-6, f=feet(L=(8, 12), R=(-9, -10), la=8, ra=8)), 'out'),
        (6, P((0, 6, 55), 14, 24, (-23, 3, 85), (-2, 40), 40, hl=2, cl=-8, f=feet(L=(8, 18), R=(-9, -10), la=10, ra=9)), 'inout'),
        (7, P((0, 12, 36), 4, 6, thrust(14, -15), (14, -15), 56, hl=12, cl=26, f=feet(L=(7, 28), ly=5, rh=4)), 'snap'),
        (8, P((0, 13, 34.5), 2, 4, thrust(14, -15, 5), (14, -15), 56, hl=13, cl=29, f=feet(L=(7, 28), ly=5, rh=5)), 'out'),
        (9, P((0, 11, 36.5), 6, 8, thrust(14, -15, -2), (14, -15), 56, hl=11, cl=24, f=feet(L=(7, 28), ly=5, rh=3)), 'inout'),
        (11, P((-1, 4, 40), 20, 36, (-19, 0, 50), (8, 8), 62, hl=6, cl=11, f=feet(L=(7, 28), ly=5, rh=1)), 'inout'),
        (13, BACK, 'inout'), (14, GUARD, 'out')],
        support=sup(air_L=(4, 5, 6, 12, 13), air_R=(4, 5, 6)), durations=[100, 90, 100, 130, 90, 90, 110, 45, 60, 190, 100, 90, 80, 80, 100], sheet=[0, 3, 6, 7, 9, 12],
        notes='Both feet leave the ground on frames 5-7 and land on the hit (frame 8).')

    # ---- B1 비껴 디뎌 찌르기: step out to the left and thrust back in across the line ---------------------------------
    side = dict(f=feet(L=(18, 26), ly=-6, rh=5))
    def from_left(over): d = direction(5.0, -1.0); return tuple(STRIKE[i] + (over - REACH) * d[i] for i in range(3))
    out['b1'] = dict(title='B1 비껴 디뎌 찌르기', impact=8, keys=[
        (0, GUARD, 'linear'),
        (4, P((-3, -9, 39), 46, 72, (-23, -20, 45), (2, 6), 78, hl=0, cl=2, f=feet(lh=3)), 'inout'),
        (6, P((3, 0, 40), 26, 46, (-17, -8, 45), (2, 3), 68, f=feet(L=(15, 20), la=6, ly=0, rh=2)), 'in'),
        (7, P((10, 9, 37), 4, 8, from_left(0), (5.0, -1.0), 50, hl=10, cl=22, **side), 'snap'),
        (8, P((11, 12, 36.5), 2, 5, from_left(6), (5.0, -1.0), 50, hl=11, cl=25, f=feet(L=(18, 26), ly=-6, rh=6)), 'out'),
        (9, P((10, 8, 38), 6, 10, from_left(-3), (5.0, -1.0), 52, hl=9, cl=19, f=feet(L=(18, 26), ly=-6, rh=4)), 'inout'),
        (11, P((5, 3, 40), 20, 36, (-13, -2, 46), (2, 10), 62, hl=6, cl=11, f=feet(L=(18, 26), ly=-6, rh=1)), 'inout'),
        (13, P((1, 1, 43), 27, 46, (-18, -4, 45), (4, 30), 64, f=feet(L=(11, 18), la=4, ly=4)), 'inout'), (14, GUARD, 'out')],
        support=sup(air_L=(5, 6, 12, 13)), durations=D, sheet=[0, 4, 6, 7, 9, 12],
        notes='The left foot steps 9 px out to the side: in the front and rear views the whole body moves off the centre line.')

    # ---- B2 이단 찌르기: a short jab that stops short, then the real thrust ------------------------------------------
    out['b2'] = dict(title='B2 이단 찌르기', impact=10, keys=[
        (0, GUARD, 'linear'),
        (3, P((-2, -8, 39.5), 40, 64, (-21, -18, 45), (6, 3), 76, hl=0, cl=2, f=feet(lh=3)), 'inout'),
        (4, P((-1, 0, 40.5), 24, 44, (-19, -8, 45.5), (8, 2), 68, f=feet(L=(8, 20), la=5, ly=6, rh=2)), 'in'),
        (5, P((0, 5, 38.5), 12, 22, thrust(10.7, -0.9, -24), (10.7, -0.9), 62, hl=8, cl=16, f=feet(L=(7, 24), ly=5, rh=3)), 'snap'),
        (7, P((-1, -2, 38), 34, 56, (-20, -16, 45), (8, 2), 74, hl=2, cl=6, f=feet(L=(7, 24), ly=5)), 'inout'),
        (8, P((-1, 3, 39), 20, 38, (-19, -8, 45.5), (9, 1), 66, f=feet(L=(7, 28), la=4, ly=5, rh=3)), 'in'),
        (9, P((0, 11, 36.5), 2, 4, thrust(10.7, -0.9), (10.7, -0.9), 50, hl=11, cl=25, f=feet(L=(7, 31), ly=5, rh=6)), 'snap'),
        (10, P((0, 14, 36), 0, 2, thrust(10.7, -0.9, 7), (10.7, -0.9), 50, hl=12, cl=28, f=feet(L=(7, 31), ly=5, rh=7)), 'out'),
        (11, P((0, 10, 37.5), 6, 10, thrust(10.7, -0.9, -3), (10.7, -0.9), 52, hl=9, cl=20, f=feet(L=(7, 31), ly=5, rh=4)), 'inout'),
        (12, P((-1, 4, 40), 20, 36, (-18, -2, 46), (8, 10), 62, hl=6, cl=11, f=feet(L=(7, 31), ly=5, rh=1)), 'inout'),
        (13, BACK, 'inout'), (14, GUARD, 'out')],
        support=sup(air_L=(4, 8, 13)), durations=[100, 90, 100, 120, 50, 45, 90, 110, 50, 40, 60, 150, 90, 90, 100], sheet=[0, 3, 5, 7, 9, 11],
        notes='Frame 6 is a feint that stops 24 px short of the target. The hit is frame 10.')

    # ---- B3 감아 찌르기: the tip circles the guard, the RIGHT foot passes through and the thrust lands square --------
    out['b3'] = dict(title='B3 감아 찌르기', impact=9, keys=[
        (0, GUARD, 'linear'),
        (2, P((-1, -3, 42), 34, 54, (-20, -10, 46), (16, 20), 70, cl=5), 'inout'),
        (4, P((-2, -6, 40.5), 38, 60, (-21, -14, 46), (-4, 2), 74, cl=4, f=feet(rh=2)), 'inout'),
        (5, P((-2, -6, 40), 38, 60, (-21, -14, 45), (10, -10), 74, cl=4, f=feet(rh=3)), 'inout'),
        (6, P((-1, -4, 40), 34, 54, (-21, -12, 45), (16, 6), 74, cl=5, f=feet(rh=4)), 'inout'),
        (7, P((0, 8, 41), 8, 20, (-19, 2, 46), (12, 2), 62, cl=10, f=feet(R=(-8, 14), ra=7, ry=20, lh=2)), 'in'),
        (8, P((0, 22, 37), -18, -22, thrust(10.7, -0.9), (10.7, -0.9), 48, hl=10, cl=20, f=feet(R=(-8, 40), ry=8, lh=6)), 'snap'),
        (9, P((0, 25, 36.5), -20, -26, thrust(10.7, -0.9, 7), (10.7, -0.9), 48, hl=11, cl=23, f=feet(R=(-8, 40), ry=8, lh=7)), 'out'),
        (10, P((0, 21, 37.5), -16, -20, thrust(10.7, -0.9, -3), (10.7, -0.9), 50, hl=9, cl=18, f=feet(R=(-8, 40), ry=8, lh=5)), 'inout'),
        (12, P((0, 18, 38), 4, 10, (-18, 10, 46), (8, 10), 60, hl=6, cl=10, f=feet(R=(-8, 40), ry=8, lh=2)), 'inout'),
        (13, P((0, 6, 42), 20, 36, (-19, -2, 45), (6, 28), 64, f=feet(R=(-9, 12), ra=6, ry=35)), 'inout'), (14, GUARD, 'out')],
        support=sup(air_R=(7, 13)), durations=[100, 90, 90, 90, 80, 80, 110, 60, 45, 60, 180, 90, 90, 90, 100], sheet=[0, 4, 6, 7, 8, 10],
        notes='The tip draws one circle on frames 3-7. The right foot steps past the left, so the body finishes square to the target.')

    # ---- S1 장판의 함성 (장비): nothing is struck ------------------------------------------------------------------
    def roar(pz, cl, fist, lean=0.0): return P((5, 2, pz), 0, -4, (-25, 4, 64), (-6, 86), 62, hl=lean, cl=cl, f=feet(L=(22, 6), ly=-10), front_on=0.0, **{'hand.L': fist})
    out['s1'] = dict(title='S1 장판의 함성', impact=8, event='발동', keys=[
        (0, GUARD, 'linear'),
        (3, P((0, -2, 43), 20, 30, (-24, 2, 60), (-3, 86), 62, cl=0, front_on=0.0, **{'hand.L': (14, 14, 56)}), 'inout'),
        (5, P((4, 0, 41), 8, 10, (-24, 4, 62), (-4, 86), 62, cl=-4, f=feet(L=(20, 6), la=7, ly=-10), front_on=0.0, **{'hand.L': (22, 8, 60)}), 'inout'),
        (6, P((5, 1, 36.5), 2, 0, (-25, 4, 61), (-5, 86), 62, cl=4, f=feet(L=(22, 6), ly=-10), front_on=0.0, **{'hand.L': (31, 10, 60)}), 'in'),
        (7, roar(38.5, -12, (30, 4, 92)), 'snap'), (8, roar(39.2, -15, (31, 3, 95)), 'out'), (10, roar(38.3, -11, (30, 4, 91)), 'inout'),
        (12, P((3, 1, 41), 12, 16, (-22, 0, 54), (-4, 70), 62, cl=2, f=feet(L=(22, 6), ly=-10), front_on=0.0, **{'hand.L': (18, 12, 60)}), 'inout'),
        (13, P((1, 0, 43), 26, 44, (-19, -5, 46), (-4, 55), 62, f=feet(L=(11, 12), la=4)), 'inout'), (14, GUARD, 'out')],
        support=sup(air_L=(4, 5, 13)), durations=[100, 100, 110, 120, 110, 100, 60, 50, 90, 150, 220, 110, 100, 90, 100], sheet=[0, 3, 5, 6, 8, 12],
        notes='The left hand lets go of the shaft on frame 2 (the spear is planted upright beside the body) and takes it again on frame 14. '
              'The left foot steps to the side, not forward.')

    # ---- S2 불굴 (하후돈): the spear is a bar held across the body ---------------------------------------------------
    def bar(pz, py, rear, aim, cl): return P((0, py, pz), 6, 6, rear, aim, 86, hl=6, cl=cl)
    out['s2'] = dict(title='S2 불굴', impact=8, event='발동', keys=[
        (0, GUARD, 'linear'),
        (3, P((0, -2, 40), 12, 14, (-24, 20, 56), (80, 10), 86, cl=6), 'inout'),
        (5, bar(32, -3, (-24, 22, 46), (84, 6), 14), 'inout'), (6, bar(31, -3, (-24, 22, 45), (84, 6), 15), 'out'),
        (7, bar(41, 4, (-24, 34, 66), (86, 8), 2), 'snap'), (8, bar(42.2, 5, (-24, 37, 68), (86, 8), 0), 'out'), (10, bar(41, 4, (-24, 34, 66), (86, 8), 2), 'inout'),
        (12, P((0, 0, 42), 20, 34, (-21, 12, 52), (40, 30), 70, cl=6), 'inout'), (14, GUARD, 'inout')],
        support=sup(), durations=[100, 100, 110, 120, 120, 130, 200, 50, 80, 150, 220, 110, 100, 100, 100], sheet=[0, 3, 6, 7, 10, 12],
        notes='Both feet stay planted for the whole clip.')

    # ---- S3 북벌의 창 (강유): from under the guard line up into the chest ---------------------------------------------
    out['s3'] = dict(title='S3 북벌의 창', impact=8, keys=[
        (0, GUARD, 'linear'),
        (3, P((-1, -6, 35), 40, 62, (-21, -12, 38), (6, -14), 62, cl=14), 'inout'),
        (5, P((-2, -12, 32), 46, 72, (-22, -22, 36), (7, -10), 64, hl=0, cl=14, f=feet(lh=4)), 'inout'),
        (6, P((-1, 0, 34), 26, 44, (-20, -10, 34), (9, 2), 60, cl=16, f=feet(L=(8, 24), la=6, ly=6, rh=2)), 'in'),
        (7, P((0, 13, 36), 8, 26, thrust(10.7, 8), (10.7, 8), 57, hl=10, cl=30, f=feet(L=(7, 30), ly=5, rh=6)), 'snap'),
        (8, P((0, 16, 37.5), 6, 22, thrust(10.7, 8, 7), (10.7, 8), 57, hl=10, cl=28, f=feet(L=(7, 30), ly=5, rh=7)), 'out'),
        (10, P((0, 14, 37), 8, 24, thrust(10.7, 8, 3), (10.7, 8), 57, hl=10, cl=29, f=feet(L=(7, 30), ly=5, rh=6)), 'inout'),
        (12, P((-1, 4, 40), 20, 36, (-18, -2, 44), (8, 8), 62, hl=6, cl=11, f=feet(L=(7, 30), ly=5, rh=1)), 'inout'),
        (13, BACK, 'inout'), (14, GUARD, 'out')],
        support=sup(air_L=(6, 13)), durations=[100, 100, 110, 120, 130, 200, 55, 45, 80, 130, 220, 100, 90, 90, 100], sheet=[0, 5, 6, 7, 10, 12])

    # ---- S4 백의도강 (여몽): hidden low, then a long flat lunge that never stands up -------------------------------------
    out['s4'] = dict(title='S4 백의도강', impact=8, event='타격(도착)', keys=[
        (0, GUARD, 'linear'),
        (3, P((-2, -6, 34), 50, 78, (-22, -16, 36), (-12, -12), 58, cl=22), 'inout'),
        (5, P((-3, -10, 30), 56, 86, (-23, -22, 34), (-10, -8), 60, hl=2, cl=26, f=feet(lh=4)), 'inout'),
        (6, P((-1, 4, 31), 20, 34, (-20, -6, 34), (8, 0), 64, cl=26, f=feet(L=(8, 28), la=5, ly=6, rh=3)), 'in'),
        (7, P((0, 16, 31), 0, 0, thrust(10.7, 3), (10.7, 3), 50, hl=14, cl=36, f=feet(L=(7, 36), ly=5, rh=7)), 'snap'),
        (8, P((0, 18, 30.5), -2, -3, thrust(10.7, 3, 8), (10.7, 3), 50, hl=15, cl=38, f=feet(L=(7, 36), ly=5, rh=8)), 'out'),
        (10, P((0, 16, 31), 0, 0, thrust(10.7, 3, 4), (10.7, 3), 50, hl=14, cl=36, f=feet(L=(7, 36), ly=5, rh=7)), 'inout'),
        (12, P((-1, 8, 35), 24, 40, (-19, 0, 40), (8, 4), 62, hl=8, cl=16, f=feet(L=(7, 36), ly=5, rh=2)), 'inout'),
        (13, P((0, 2, 42), 27, 46, (-19, -4, 45), (6, 30), 64, f=feet(L=(8, 22), la=5, ly=7)), 'inout'), (14, GUARD, 'out')],
        support=sup(air_L=(6, 13)), durations=[100, 100, 110, 130, 140, 190, 50, 40, 80, 130, 220, 100, 90, 90, 100], sheet=[0, 5, 6, 7, 10, 12],
        notes='The engine moves the unit to the arrival tile; the clip is the strike on arrival.')

    # ---- S5 추격 (문추): thrust, half a withdrawal, thrust again ---------------------------------------------------------
    h = dict(f=feet(L=(7, 28), ly=5, rh=5))
    out['s5'] = dict(title='S5 추격', impact=6, impact2=10, keys=[
        (0, GUARD, 'linear'),
        (3, P((-2, -12, 37), 46, 72, (-22, -22, 44), (6, 4), 80, hl=0, cl=2, f=feet(lh=3)), 'inout'),
        (4, P((-1, 1, 40), 24, 46, (-19, -8, 45), (7, 3), 68, f=feet(L=(8, 22), la=6, ly=6, rh=2)), 'in'),
        (5, P((0, 9, 37), 6, 12, thrust(10.7, -0.9), (10.7, -0.9), 50, hl=10, cl=22, **h), 'snap'),
        (6, P((0, 11, 36.5), 4, 9, thrust(10.7, -0.9, 5), (10.7, -0.9), 50, hl=11, cl=24, f=feet(L=(7, 28), ly=5, rh=6)), 'out'),
        (8, P((-1, 2, 38), 30, 50, (-19, -10, 45), (9, 2), 66, hl=4, cl=10, f=feet(L=(7, 28), ly=5)), 'inout'),
        (9, P((0, 12, 36.5), 2, 4, thrust(10.7, -0.9, 3), (10.7, -0.9), 50, hl=11, cl=26, f=feet(L=(7, 28), ly=5, rh=7)), 'snap'),
        (10, P((0, 14, 36), 0, 2, thrust(10.7, -0.9, 9), (10.7, -0.9), 50, hl=12, cl=28, f=feet(L=(7, 28), ly=5, rh=8)), 'out'),
        (11, P((0, 10, 37.5), 6, 10, thrust(10.7, -0.9, 2), (10.7, -0.9), 52, hl=9, cl=20, f=feet(L=(7, 28), ly=5, rh=4)), 'inout'),
        (12, PULL, 'inout'), (13, BACK, 'inout'), (14, GUARD, 'out')],
        support=sup(air_L=(4, 13)), durations=[100, 100, 110, 150, 50, 45, 70, 110, 110, 45, 60, 170, 90, 90, 100], sheet=[0, 3, 5, 8, 9, 11],
        notes='First hit frame 6. Second hit frame 10 is conditional (target below half health): the engine plays frames 9-11 only then.')

    # ---- S6 선풍창 (공용): one full turn with the spear level -----------------------------------------------------------
    def spun(theta, pz=39.0, air=0.0, fixed_feet=False, lean=8.0):
        """The strike pose turned by theta degrees about the vertical axis (theta > 0 turns to the character's right)."""
        c, s = math.cos(math.radians(theta)), math.sin(math.radians(theta)); rot = lambda v: (v[0] * c - v[1] * s, v[0] * s + v[1] * c)
        rx, ry, rz = thrust(10.7, -5.0); px, py = rot((0, 6)); hx, hy = rot((rx, ry))
        fl, fr = ((9, 14), (-9, -12)) if fixed_feet else (rot((9, 14)), rot((-9, -12)))
        yaw = 0 if fixed_feet else theta
        return P((px, py, pz), 10 + theta, 14 + theta, (hx, hy, rz + (pz - 39.0)), (10.7 - theta, -5.0), 56, hl=4, cl=lean,
                 f=feet(L=fl, R=fr, la=air, ra=air, ly=8 + yaw, ry=40 + yaw))
    frames = [GUARD, blend(GUARD, spun(25, 40, fixed_feet=True), 0.6), spun(50, 38.5, fixed_feet=True), spun(70, 37, fixed_feet=True), spun(75, 36.5, fixed_feet=True),
              spun(72, 36.5, fixed_feet=True), spun(28, 39, air=3), spun(0, 38, air=1.5, lean=12), spun(-70, 39.5, air=3), spun(-140, 40, air=4),
              spun(-205, 40, air=4), spun(-265, 39.5, air=3), spun(-315, 40, air=2), blend(spun(14, 41, air=1), GUARD, 0.55), GUARD]      # -346 degrees is the same facing as +14
    out['s6'] = dict(title='S6 선풍창', impact=8, poses=frames, support=[('L', 'R')] * 6 + [()] * 8 + [('L', 'R')],
                     durations=[100, 100, 110, 120, 140, 180, 50, 45, 50, 55, 60, 70, 90, 100, 100], sheet=[0, 4, 6, 7, 9, 11],
                     notes='Frames 2-6 wind the upper body up to the right with the feet planted. Frames 7-14 are one full turn on a low hop: '
                           'the blade passes the front and strikes on frame 8, then the turn carries on round to the guard.')
    notes = {   # shown to the reviewer under the clip
        'a2': '오른손이 가슴 옆까지 올라와 어깨 높이에서 아래로 꽂는다.',
        'a3': '5~7번 프레임에 두 발이 뜨고, 타격(8번)과 함께 착지한다.',
        'b1': '왼발을 옆으로 9px 내딛는다. 정면·후면에서 몸 전체가 중심선 밖으로 비껴난다.',
        'b2': '6번 프레임은 표적 24px 앞에서 멈추는 속임 찌르기다. 실제 타격은 10번.',
        'b3': '3~7번 프레임에 창끝이 원을 한 번 그린다. 오른발이 왼발을 지나 앞으로 나가 몸이 표적과 정면으로 마주 선다.',
        's1': '장비 전법. 2번 프레임에 왼손이 자루를 놓고(창은 몸 옆에 세움) 14번에 다시 잡는다. 왼발은 앞이 아니라 옆으로 딛는다. 닿는 공격이 아니다.',
        's2': '하후돈 전법. 창을 몸 앞에 가로로 받치고 깊이 앉았다가 밀어 세운다. 두 발은 끝까지 제자리. 닿는 공격이 아니다.',
        's3': '강유 전법. 방어선 아래 낮은 곳에서 가슴 높이로 솟구치는 큰 찌르기 한 번.',
        's4': '여몽 전법. 창을 낮게 숨겼다가 낮은 자세 그대로 길게 찌른다. 도착 칸 이동은 게임이 하고, 이 클립은 도착 순간의 타격이다.',
        's5': '문추 전법. 1타는 6번 프레임. 2타(10번)는 조건부라서 조건이 맞을 때만 게임이 9~11번을 재생한다.',
        's6': '공용 전법. 2~6번은 발을 딛고 상체를 오른쪽으로 감는다. 7~14번은 낮게 뜬 채 한 바퀴 돌며, 8번에 창날이 정면을 지나면서 친다.',
    }
    for k, v in notes.items(): out[k]['notes'] = v
    return out
