"""기마 장화극 (여포): the 202 px halberd held long, swings only, nothing cut. How and why: clips/mounted_long.py.

    A1 사선 베기        from behind the right shoulder diagonally down through the target       (mounted_blade A1)
    A2 쳐올리기         a golf swing beside the horse: back and up, down so the head scrapes the ground, up through the target.
                        One hand, the grip never moves (user: no turning the pole round, no re-gripping in an attack)
    B2 이단 베기        two cuts, the second after a half lift (mounted_blade B2). The stamping chop B3 was 8.95 px from A1: too alike.
                        (A wide level swing was tried and dropped: a 202 px pole held long and swung level reaches 190 px
                        to the side, and the front and rear views are 128 px wide each way. It only fits held short.)
    S3 무쌍             여포's skill: both hands together above the head, the halberd makes one full turn in a tilted disc;
                        the head passes right, front (the blow), left and back - a blow to all four sides
"""
import os
import clips.mounted_blade as mb
from clips import mounted_long

TITLE = '기마 장화극'
BODY = mb.BODY
TOTAL = float(os.environ.get('SAMTO_TOTAL', 175.0))
GRIP = float(os.environ.get('SAMTO_GRIP', 42.0))      # the main hand, from the butt: as near the end as the checks allow (the glaive bone holds at 55)
PULL = float(os.environ.get('SAMTO_PULL', 34.0))      # how far the hands stay back at the blow; the other 20 px they slip up the shaft
CANVAS_SHIFT = {'front': (0, 11), 'left': (34, 12), 'rear': (0, 15)}      # side view: the rider sits back on the canvas, the blow goes forward      # where the sprite sits on the 256 canvas for this weapon (fit_canvas.py sets the same per hero)
WEAPON, convert, _clip, _spin, _golf, _twin, _musou = mounted_long.build_all(mb, TOTAL, PULL, CANVAS_SHIFT, grip=GRIP, cut=14.0)
def rig(neutral): return __import__('cavalry').CavalryRig(neutral, WEAPON)
GUARD = convert(mb.GUARD)

M = getattr(mb, 'RAW', mb.CLIPS)
CLIPS = {
 'idle': _clip(M['idle'], M['idle']['title']), 'move': _clip(M['move'], M['move']['title']),
 'a1': _clip(M['a1'], 'A1 사선 베기', '오른 어깨 뒤로 넘겼다가(5~6번) 비스듬히 내려벤다. 8번에 날이 표적에 닿고, 손은 몸 가까이에 남는다.'),
 'a2': dict(_golf, title='A2 쳐올리기', notes='한 손, 손 위치는 그대로, 고개는 앞을 본다. 몸을 오른쪽으로 감으며 날을 오른쪽 뒤 땅까지 내리고(5~6번), 한 번에 휘둘러 땅을 스치며 올라와 8번에 표적을 쳐올린다. 팔을 편 채 반대쪽 어깨 위까지 넘긴다(9~11번).'),
 'b2': dict(_twin, title='B2 좌우 내려베기', notes='한 손, 손 위치는 그대로. 오른 어깨 뒤로 넘겼다가 6번에 말 오른쪽으로 내려베고, 그대로 앞을 가로질러 왼쪽 위로 쳐올렸다가(8~9번) 10번에 말 왼쪽으로 내려벤다.'),
 's3': dict(_musou, title='S3 무쌍', notes='여포 전법. 두 손을 모아 자루 가운데를 잡고 머리 위에서 화극을 한 바퀴 돌린다. 날이 오른쪽, 앞(8번, 타격), 왼쪽, 뒤를 지난 뒤, 12번에 앞쪽 땅에 내리꽂는다.'),
}

RAW = dict(CLIPS)      # as written; families built from this one start from RAW (snappy.py)
CLIPS = __import__('snappy').upgrade(__import__('sys').modules[__name__])
