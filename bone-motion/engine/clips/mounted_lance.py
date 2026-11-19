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
TOTAL = 195.0      # 마초 196, 공손찬 194
PULL = float(os.environ.get('SAMTO_PULL', 26.0))      # 34 leaves the right hand 5 px short on the way back
CANVAS_SHIFT = {'front': (0, 14), 'left': (10, 12), 'rear': (0, 16)}
WEAPON, convert, _clip, _spin = mounted_long.build(ms, TOTAL, PULL, CANVAS_SHIFT)
def rig(neutral): return __import__('cavalry').CavalryRig(neutral, WEAPON)
GUARD = convert(ms.GUARD)

M = ms.CLIPS
CLIPS = {
 'idle': _clip(M['idle'], M['idle']['title']), 'move': _clip(M['move'], M['move']['title']),
 'a2': _clip(M['a2'], 'A2 세로 내려치기', M['a2'].get('notes')),
 'b1': _clip(M['b1'], 'B1 올려치기', M['b1'].get('notes')),
 's2': _clip(M['s2'], 'S2 서량철기', M['s2'].get('notes')),
 's3': _clip(M['s3'], 'S3 백마의종', M['s3'].get('notes')),
 'a3': dict(_spin, title='A3 두 손 돌려치기', notes='두 손을 모아 자루 가운데를 잡고 머리 위에서 창을 한 바퀴 돌린다. 창끝이 오른쪽, 앞(8번, 타격), 왼쪽, 뒤를 차례로 지난다.'),
}
