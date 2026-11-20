"""기마 장창 (마초, 공손찬): the 195 px spear held long, swings for the three attacks, nothing cut. How and why: clips/mounted_long.py.

    A2 세로 내려치기        the spear straight up over the head, the horse lifts its front hooves, down it comes  (mounted_spear A2)
    B1 올려치기             the point hangs low and is swept up through the target                              (mounted_spear B1)
    A3 두 손 돌려치기       both hands together above the head, the spear makes one full turn (B3, the stamping strike, came out
                            1.3 px from A2 once the hands stay back, so it is not used)
    S2 서량철기 (마초), S3 백마의종 (공손찬): their skills, with the hands staying back so the point lands on the hit point
"""
import os
import clips.mounted_spear as ms
from clips import mounted_long

TITLE = '기마 장창'
BODY = ms.BODY
TOTAL = float(os.environ.get('SAMTO_TOTAL', 170.0))      # 마초 196, 공손찬 194
GRIP = float(os.environ.get('SAMTO_GRIP', 40.0))      # the main hand, from the butt: held as long as 여포's halberd (the spear bone holds at 50)
PULL = float(os.environ.get('SAMTO_PULL', 26.0))      # 34 leaves the right hand 5 px short on the way back
CANVAS_SHIFT = {'front': (0, 11), 'left': (28, 11), 'rear': (0, 13)}      # side view: the rider sits back on the canvas, the blow goes forward
WEAPON, convert, _clip, _spin, _golf, _twin, _musou = mounted_long.build_all(ms, TOTAL, PULL, CANVAS_SHIFT, grip=GRIP, cut=14.0)
def rig(neutral): return __import__('cavalry').CavalryRig(neutral, WEAPON)
GUARD = convert(ms.GUARD)

M = getattr(ms, 'RAW', ms.CLIPS)
CLIPS = {
 'idle': _clip(M['idle'], M['idle']['title']), 'move': _clip(M['move'], M['move']['title']),
 'a2': _clip(M['a2'], 'A2 세로 내려치기', M['a2'].get('notes')),
 'b1': dict(_golf, title='B1 올려치기', notes='한 손, 손 위치는 그대로, 고개는 앞을 본다. 몸을 오른쪽으로 감으며 날을 오른쪽 뒤 땅까지 내리고(5~6번), 한 번에 휘둘러 땅을 스치며 올라와 8번에 표적을 쳐올린다. 팔을 편 채 반대쪽 어깨 위까지 넘긴다(9~11번).'),
 'b2': dict(_twin, title='B2 좌우 내려치기', notes='한 손, 손 위치는 그대로. 오른 어깨 뒤로 넘겼다가 6번에 말 오른쪽으로 내려치고, 그대로 앞을 가로질러 왼쪽 위로 쳐올렸다가(8~9번) 10번에 말 왼쪽으로 내려친다.'),
 's2': _clip(M['s2'], 'S2 서량철기', M['s2'].get('notes')),
 's3': _clip(M['s3'], 'S3 백마의종', M['s3'].get('notes')),
 'a3': dict(_spin, title='A3 두 손 돌려치기', notes='두 손을 모아 자루 가운데를 잡고 머리 위에서 창을 한 바퀴 돌린다. 창끝이 오른쪽, 앞(8번, 타격), 왼쪽, 뒤를 차례로 지난다.'),
}

RAW = dict(CLIPS)      # as written; families built from this one start from RAW (snappy.py)
CLIPS = __import__('snappy').upgrade(__import__('sys').modules[__name__])
