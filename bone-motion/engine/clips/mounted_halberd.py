"""기마 장화극 (여포): the 202 px halberd held long, swings only, nothing cut. How and why: clips/mounted_long.py.

    A1 사선 베기        from behind the right shoulder diagonally down through the target       (mounted_blade A1)
    A2 쳐올리기         the head hangs low outside and behind, and is swept up through the target (mounted_blade A2)
    B3 앞발 굴러 내려베기  the horse lifts its front hooves and stamps as the halberd comes straight down (mounted_blade B3)
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
TOTAL = 202.0
PULL = float(os.environ.get('SAMTO_PULL', 34.0))      # how far the hands stay back at the blow; the other 20 px they slip up the shaft
CANVAS_SHIFT = {'front': (0, 14), 'left': (10, 12), 'rear': (0, 16)}      # where the sprite sits on the 256 canvas for this weapon (fit_canvas.py sets the same per hero)
WEAPON, convert, _clip, _spin = mounted_long.build(mb, TOTAL, PULL, CANVAS_SHIFT)
def rig(neutral): return __import__('cavalry').CavalryRig(neutral, WEAPON)
GUARD = convert(mb.GUARD)

M = mb.CLIPS
CLIPS = {
 'idle': _clip(M['idle'], M['idle']['title']), 'move': _clip(M['move'], M['move']['title']),
 'a1': _clip(M['a1'], 'A1 사선 베기', '오른 어깨 뒤로 넘겼다가(5~6번) 비스듬히 내려벤다. 8번에 날이 표적에 닿고, 손은 몸 가까이에 남는다.'),
 'a2': _clip(M['a2'], 'A2 쳐올리기', '날을 말 오른쪽 바깥 뒤 아래로 늘어뜨렸다가, 뒤에서 앞으로 쳐올린다. 8번에 표적을 지난다.'),
 'b3': _clip(M['b3'], 'B3 앞발 굴러 내려베기', '말이 앞발을 높이 들었다가 구르며, 화극을 위에서 아래로 내려벤다.'),
 's3': dict(_spin, title='S3 무쌍', notes='여포 전법. 두 손을 모아 자루 가운데를 잡고 머리 위로 올려(3~5번) 화극을 한 바퀴 돌린다. 날이 오른쪽(6~7번), 앞(8번, 타격), 왼쪽(9~10번), 뒤(11번)를 차례로 지난다. 말은 제자리.'),
}
