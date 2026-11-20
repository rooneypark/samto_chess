"""여포: shorten the halberd from 202 px to 175 px in copies of the approved drawings (the bone's length, clips/mounted_halberd.py).

    python -X utf8 bone-motion/engine/shorten_lubu.py        -> art-in/119/short-front.png, short-rear.png

The 27 px come off the bottom of the shaft, below the hand: the butt cap moves up 27 rows. That keeps the head, the hand and
everything round them as drawn, and brings the hand nearer the butt, which is how the bone holds it.
    front  shaft x 81-88, butt cap rows 193-218. The cap moves to rows 166-191, in front of the horse and cape as the shaft
           was. Below it (rows 192-218) there was only the weapon, so that becomes empty.
    rear   the drawing's halberd was already 25 rows shorter than the front one; it loses 2 rows, so both are 190 rows long.
           (Two earlier attempts took 27 rows off here too and left it shorter than the front: user, 'not right'.)
    side   the lower shaft is behind the horse in this drawing; nothing to change (user: 'the side does not need cutting').
Same rule as shorten_xuhuang.py: only pixels inside a declared box may change; the script fails if any other pixel differs.
"""
import json, os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm

B = os.path.join(sm.WORK, 'art-in', '119'); K = 27; NONE = (0, 0, 0, 0)
def solid(p): return p[3] >= 128

def front():
    src = Image.open(os.path.join(B, 'front.png')).convert('RGBA'); s = src.load(); im = src.copy(); px = im.load()
    box = (78, 166, 92, 218)
    for y in range(192, 219):              # below the new end there was only the weapon
        for x in range(78, 93): px[x, y] = NONE
    for y in range(180, 192):              # the cap's tapering end is narrower than the shaft it replaces
        for x in range(81, 89): px[x, y] = NONE
    for y in range(193, 219):              # the cap, 27 rows higher
        for x in range(78, 93):
            if solid(s[x, y]): px[x, y - K] = s[x, y]
    return src, im, box

KR = 2
def rear():
    """The rear drawing's halberd was already shorter than the front one: 192 rows from point to butt (rows 11-202) against
    217 in front (rows 2-218). The front one is now 190 rows. So the rear one loses only 2 rows, which makes the two the same
    length (user: 'the rear is shorter than the front; make it the same as the front'). The cape is not touched."""
    src = Image.open(os.path.join(B, 'back.png')).convert('RGBA'); s = src.load(); im = src.copy(); px = im.load()
    box = (164, 175, 177, 203)
    for y in range(175, 204):              # the cap and the two rows of shaft above it
        for x in range(164, 178):
            if y >= 177 or 168 <= x <= 175: px[x, y] = NONE
    for y in range(177, 204):              # the cap, 2 rows higher
        for x in range(164, 178):
            if solid(s[x, y]): px[x, y - KR] = s[x, y]
    return src, im, box

def check(name, src, im, box):
    a, b = src.load(), im.load(); x0, y0, x1, y1 = box
    out = [(x, y) for y in range(256) for x in range(256) if a[x, y] != b[x, y] and not (x0 <= x <= x1 and y0 <= y <= y1)]
    if out: raise SystemExit('%s: 칸 밖에서 원본과 다른 픽셀 %d개 (예: %s)' % (name, len(out), out[:5]))
    print('%-5s 칸 x %d-%d, y %d-%d 안에서 %d픽셀 변경, 칸 밖은 원본과 동일' % (name, x0, x1, y0, y1, sum(1 for y in range(y0, y1 + 1) for x in range(x0, x1 + 1) if a[x, y] != b[x, y])))

if __name__ == '__main__':
    for name, make in (('front', front), ('rear', rear)):
        src, im, box = make(); check(name, src, im, box); im.save(os.path.join(B, 'short-%s.png' % name))
    p = os.path.join(B, 'pixellab.json'); cfg = json.load(open(p, encoding='utf-8'))
    cfg['art'] = {'front': 'short-front.png', 'rear': 'short-rear.png'}; cfg['_shortened'] = K
    cfg['art_weapon'] = {'front': {'weapon butt': [84, 181], 'weapon tip': [84, 6]}, 'left': {'weapon butt': [101, 143], 'weapon tip': [101, 8]},
                         'rear': {'weapon butt': [170, 198], 'weapon tip': [170, 10]}}
    cfg['_art_note'] = '2026-11-20: 화극을 202px에서 175px로 줄였다. 정면과 후면은 shorten_lubu.py가 만든 사본(short-front.png, short-rear.png)을 쓴다. 측면은 아랫자루가 말 뒤에 가려져 있어 원화 그대로다.'
    json.dump(cfg, open(p, 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
