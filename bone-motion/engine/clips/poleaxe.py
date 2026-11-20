"""긴자루 도끼 (서황). A two-handed pole axe, 151 px, swung: no thrusts.

Second version (2026-11-19). The first version put the long axe on the 중무기 clips (clips/heavy.py), which were built
around a 78 px mace held with the LEFT hand at the very end of the shaft. A pole axe held at mid-shaft has 60 to 80 px of
shaft trailing behind the hands, and on those hand paths that shaft runs through the belly: the numeric check failed 11 of
14 clips, and neither turning the weapon nor sliding the hands fixed it without pushing the head off the canvas.

A pole weapon is carried on one side of the body, rear hand at the hip, the shaft passing BESIDE the torso. That is exactly
how the 보행 창 clips are built (clips/foot_spear.py: RIGHT hand rear at the hip, LEFT hand forward, the shaft never
crosses the body), and that set now has real swings. So the pole axe uses the spearman's body mechanics and only the swings:

    A1 세로 내려치기     both hands raise the axe straight up overhead and bring it down          (foot_spear B2)
    A2 가로 휘두르기     the upper body winds to the right, the axe swings round level             (foot_spear B1)
    A3 올려치기          the head drops low in front and scoops up through the target             (foot_spear B3)
    S2 대부 강타         서황's skill: a leap, the axe over the shoulder, landing on the blow      (foot_spear A3)
    S3 대회전            one full turn with the axe level (spare, no hero uses it yet)            (foot_spear S6)

The grip: carried, the rear hand is 40 px from the butt (the drawing shows 23, but with the shaft upright that puts the
butt in the ground on this body); in the blow it slides to 57 px, which puts the axe head exactly where the spear point
was, so every strike lands on the common hit point. The front hand keeps its distance from the rear hand.
"""
import clips.foot_spear as spear
from samto_motion import Spear, length, sub

TITLE = '긴자루 도끼'
BODY = spear.BODY
TOTAL, CARRY = 151.0, 40.0
REACH = spear.WEAPON.total - spear.WEAPON.rear_socket      # 94: the spear point's distance beyond the rear hand
BLOW = TOTAL - REACH                                       # 57: the grip that puts the axe head where the spear point was
WEAPON = Spear(total=TOTAL, rear_socket=CARRY, collar=TOTAL - 40.0, head='head')

def convert(p, guard=spear.GUARD):
    w = min(1.0, length(sub(p['rear'], guard['rear'])) / 14.0)      # 0 in the guard, 1 once the rear hand has left it
    q = dict(p); q['socket'] = CARRY + (BLOW - CARRY) * w
    q['front'] = q['socket'] + (p['front'] - spear.WEAPON.rear_socket)      # the front hand keeps its distance from the rear hand
    return q

GUARD = convert(spear.GUARD)

def _clip(c, title, notes=None):
    out = dict(c, title=title)
    if 'poses' in c: out['poses'] = [convert(p) for p in c['poses']]
    else: out['keys'] = [(i, convert(p), ease) for i, p, ease in c['keys']]
    if notes: out['notes'] = notes
    return out

S = getattr(spear, 'RAW', spear.CLIPS)
CLIPS = {
 'idle': _clip(S['idle'], S['idle']['title']), 'move': _clip(S['move'], S['move']['title']),
 'a1': _clip(S['b2'], 'A1 세로 내려치기', '두 손으로 도끼를 머리 위로 곧게 세웠다가(4~6번) 위에서 아래로 내려친다. 타격은 8번, 끝에서 도끼머리가 낮게 꽂힌다.'),
 'a2': _clip(S['b1'], 'A2 가로 휘두르기', '두 발은 제자리. 2~6번에 상체를 오른쪽으로 크게 감아 도끼를 수평으로 눕히고, 7~8번에 옆에서 앞으로 휘둘러 친다.'),
 'a3': _clip(S['b3'], 'A3 올려치기', '도끼머리를 앞쪽 낮게 떨궜다가(4~6번) 아래에서 위로 쳐올린다. 8번에 표적을 지나 9번에 높이 올라가 멈춘다.'),
 's2': _clip(S['a3'], 'S2 대부 강타', '서황 전법. 깊이 앉았다가 5~7번에 두 발이 뜨고, 도끼를 오른 어깨 위로 넘겼다가 착지(8번)와 함께 내려찍는다.'),
 's3': _clip(S['s6'], 'S3 대회전', '공용 전법. 2~6번에 상체를 오른쪽으로 감고, 7~14번에 낮게 뜬 채 한 바퀴 돌며 8번에 도끼날이 정면을 지난다.'),
}

RAW = dict(CLIPS)      # as written; families built from this one start from RAW (snappy.py)
CLIPS = __import__('snappy').upgrade(__import__('sys').modules[__name__])
