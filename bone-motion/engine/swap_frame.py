"""Replace one generated frame by another frame of the same clip (a neighbour in the same pose), keeping what was received.

    python -X utf8 bone-motion/engine/swap_frame.py <hero> <clip> <view> <bad frame> <good frame> "<why>"

Both the working frame and original/NN.png are replaced (sprite_fix.py rebuilds from original/), the received picture stays
beside them as raw-NN.png, and the reason is appended to art-in/<hero>/notes.txt.
"""
import os, shutil, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm
hero, clip, view, bad, good, why = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5]), sys.argv[6]
d = os.path.join(sm.WORK, 'out', 'pixellab', hero, clip, view)
for base in (d, os.path.join(d, 'original')):
    b = os.path.join(base, '%02d.png' % bad); raw = os.path.join(base, 'raw-%02d.png' % bad)
    if os.path.exists(b) and not os.path.exists(raw): shutil.copy2(b, raw)
    shutil.copyfile(os.path.join(base, '%02d.png' % good), b)
open(os.path.join(sm.WORK, 'art-in', hero, 'notes.txt'), 'a', encoding='utf-8').write('2026-11-20 %s %s %02d번을 %02d번으로 바꿈: %s (받은 그대로는 raw-%02d.png)\n' % (clip, view, bad, good, why, bad))
print('%s %s %s: %02d <- %02d' % (hero, clip, view, bad, good))
