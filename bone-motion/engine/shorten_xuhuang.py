"""서황: shorten the pole axe's shaft by 21 px below the hands, in copies of the three approved drawings.

    python -X utf8 bone-motion/engine/shorten_xuhuang.py        -> art-in/xuhuang/short-front|left|rear.png

Third attempt, and the rule that the first two broke: ONLY the pixels where the shaft and its end cap were may change.
The earlier scripts (shorten_shaft.py + five passes of shorten_touch.py, both deleted) cleaned up by colour ("anything
gold or light near the shaft is a leftover", "remove every faint pixel") and so painted over the armour's own gold trim
beside the shaft and stripped the drawings' soft edge pixels all over the figure. The user saw it at once.

So each view is rebuilt from the original with explicit geometry read off a pixel dump, inside one declared box, and the
script then compares the result with the original and fails if a single pixel outside the box differs.

    front  shaft x 101-109. The shaft end and cap (rows 200-215) move up 21 rows; the rows they leave become the dark
           shadow between the legs. The gold trim at x 98-100 and 110-112 is not touched.
    side   shaft x 96-106, cap x 94-109 (rows 204-219). Both move up 21 rows; what they leave is empty, as it is in front
           of the body there.
    rear   below row 183 the shaft is taken out and nothing is drawn in its place: shortened, its end is behind the cape
           (user: 'from behind it would be almost hidden by the cape'). The cape's right edge, which the shaft's own dark
           line used to draw, gets its outline back, and the stub is closed.
"""
import json, os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm

B = os.path.join(sm.WORK, 'art-in', 'xuhuang'); K = 21; DARK = (21, 17, 28, 255); NONE = (0, 0, 0, 0)
def solid(p): return p[3] >= 128
def dark(p): return solid(p) and max(p[:3]) < 75
def magenta(p): return solid(p) and p[0] > p[1] + 25 and p[2] > 60 and not (p[0] > 190 and p[1] > 140)      # the cape

def front():
    """Shaft x 103-106 with its outline at 101-102 and 107-109; the end cap is rows 206-217, x 100-109.
    The shaft stands in front of the figure's LEFT leg (x 93-118), not between the legs, so what it leaves is that leg:
    skirt band, knee, ankle band and boot, drawn the way the right leg (x 131-153) is drawn in the same picture."""
    src = Image.open(os.path.join(B, 'front.png')).convert('RGBA'); s = src.load(); im = src.copy(); px = im.load()
    box = (99, 185, 111, 219)
    for y in range(197, 220):          # shaft, cap and the dark around them come off the leg
        for x in range(101, 110): px[x, y] = DARK
    for y in range(206, 217):
        for x in (100, 110, 111):
            if y in (210, 211, 212, 213) or x == 100: px[x, y] = DARK
    for y in range(198, 202):          # the skirt's gold band runs through, as it does on the right leg
        for x in range(101, 110): px[x, y] = s[100, y] if x < 105 else s[110, y]
    for y, xs in ((205, range(102, 109)), (206, range(102, 109)), (207, range(103, 108)), (208, range(102, 107))):      # the knee
        for x in xs: px[x, y] = s[140, y]
    for y in range(210, 214):          # the ankle band: the right leg's, x 136-147, laid over x 100-111 (its end at 112-113 was showing)
        for x in range(100, 112): px[x, y] = s[min(136 + x - 100, 145), y]
    for x in range(101, 109): px[x, 215] = s[98, 216]      # the top of the boot
    for x in range(100, 111): px[x, 216] = s[98, 216]
    for y in (217, 218, 219):          # and the middle of the boot, where the cap's shadow was
        for x in range(101, 111):
            px[x, y] = s[97, y] if dark(s[x, y]) else s[x, y]
    for y in range(206, 218):          # the cap, 21 rows higher, straight under the shortened shaft
        for x in range(100, 110):
            c = s[x, y]
            if 101 <= x <= 108 or not dark(c): px[x, y - K] = c if solid(c) else DARK
    for y in range(185, 197):          # the cap keeps a dark line against the armour beside it
        for x, n in ((100, 99), (109, 110)):
            if not dark(px[x, y]) and px[x, y] != s[x, y] and not dark(px[n, y]): px[n, y] = DARK
    return src, im, box

def side():
    """Shaft x 96-106 (outline 96-98, 104-106); the cap is rows 203-219, x 94-109."""
    src = Image.open(os.path.join(B, 'side.png')).convert('RGBA'); s = src.load(); im = src.copy(); px = im.load()
    box = (94, 182, 109, 219); cap = lambda y: range(94, 108) if y < 209 else range(94, 110)
    for y in range(203, 220):          # the cap comes off; the soft pixels under the cape hem (x 108 and on) stay
        for x in cap(y): px[x, y] = NONE
    for y in range(199, 203):          # the last of the shaft; the body's own outline at x 107 and on stays
        for x in range(96, 107): px[x, y] = NONE
        for x in (107, 108):
            if not solid(s[x, y]): px[x, y] = NONE
    for y in range(182, 199):          # the cap, 21 rows higher: first the shaft it replaces goes, then the cap is set down
        for x in range(96, 107): px[x, y] = NONE
        for x in cap(y + K):
            if solid(s[x, y + K]): px[x, y] = s[x, y + K]
    for y in range(182, 199):          # a one-pixel sliver between the cap and the body would show as a light line
        for x in (106, 107, 108):
            if not solid(px[x, y]) and solid(px[x - 1, y]) and solid(px[x + 1, y]): px[x, y] = DARK
    return src, im, box

def rear():
    """From behind the cape covers the shaft down to the hem (row 202); only what stuck out below the hem is removed.
    Shortened, the shaft ends above the hem, so nothing of it shows there and the cape itself is not touched."""
    src = Image.open(os.path.join(B, 'back.png')).convert('RGBA'); s = src.load(); im = src.copy(); px = im.load()
    box = (151, 203, 170, 219)
    START = {203: 159, 204: 154, 205: 154, 206: 154, 207: 154, 208: 151, 209: 151, 210: 151, 211: 151, 212: 151, 213: 153, 214: 154,
             215: 155, 216: 156, 217: 156, 218: 156, 219: 155}      # the first column right of the boot, read off the pixel dump row by row
    for y in range(203, 220):
        for x in range(START[y], 171): px[x, y] = NONE
    for x in range(159, 163): px[x, 203] = DARK      # the hem's outline closes where the shaft passed through it
    return src, im, box

def check(name, src, im, box):
    """Nothing outside the box may differ from the approved drawing."""
    a, b = src.load(), im.load(); x0, y0, x1, y1 = box
    out = [(x, y) for y in range(256) for x in range(256) if a[x, y] != b[x, y] and not (x0 <= x <= x1 and y0 <= y <= y1)]
    inside = sum(1 for y in range(y0, y1 + 1) for x in range(x0, x1 + 1) if a[x, y] != b[x, y])
    if out: raise SystemExit('%s: 칸 밖에서 원본과 다른 픽셀 %d개 (예: %s)' % (name, len(out), out[:5]))
    print('%-5s 칸 x %d-%d, y %d-%d 안에서 %d픽셀 변경, 칸 밖은 원본과 동일' % (name, x0, x1, y0, y1, inside))

if __name__ == '__main__':
    for name, make in (('front', front), ('left', side), ('rear', rear)):
        src, im, box = make(); check(name, src, im, box); im.save(os.path.join(B, 'short-%s.png' % name))
    p = os.path.join(B, 'pixellab.json'); cfg = json.load(open(p, encoding='utf-8'))
    cfg['art'] = {v: 'short-%s.png' % v for v in ('front', 'left', 'rear')}; cfg['_shortened'] = K; cfg['weapon_length'] = 151
    cfg['art_weapon'] = {'front': {'weapon butt': [104, 193], 'weapon tip': [104, 46]}, 'left': {'weapon butt': [101, 193], 'weapon tip': [101, 42]},
                         'rear': {'weapon butt': [161, 195], 'weapon tip': [157, 48]}}
    json.dump(cfg, open(p, 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
