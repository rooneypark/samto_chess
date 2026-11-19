"""여포 측면 두 프레임의 로컬 보정 (재요청 없음). fix_lubu_s3.py 다음에 돌린다.

    python -X utf8 bone-motion/engine/fix_lubu_frames.py

s3 left 11   the rear half of the pole was patched from another clip whose pole lies 9 px off, and came out ragged.
             Here it is drawn instead: a straight shaft from the body to the butt keypoint that was sent, with a pommel.
b2 left 05   the halberd head is smeared (and drawn lower than its keypoint). Frame 14 of the same clip has the head and
             the upper pole at almost the same place (tip 61,31 against 65,30) drawn cleanly, so they are moved over.
Red pixels (cape, feathers) and their outline are never touched. The frame as received stays in raw-NN.png;
original/NN.png gets the repaired frame so sprite_fix.py does not undo it.
"""
import json, os, shutil, sys
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm

D = os.path.join(sm.WORK, 'out', 'pixellab', '119')
red = lambda p: p[3] > 127 and p[0] > 110 and p[1] < 75 and p[2] < 95
def keys(clip, n):
    r = json.load(open(os.path.join(D, clip, 'left', 'request.json'), encoding='utf-8')); k = {p['label']: (p['x'] * 256, p['y'] * 256) for p in r['keypoints'][n - 1]}
    return k['weapon tip'], k['weapon butt']
def start(clip, n):
    d = os.path.join(D, clip, 'left'); path = os.path.join(d, '%02d.png' % n); raw = os.path.join(d, 'raw-%02d.png' % n)
    if not os.path.exists(raw): shutil.copyfile(path, raw)
    return d, path, Image.open(raw).convert('RGBA')
def done(d, path, im, n): im.save(path); os.makedirs(os.path.join(d, 'original'), exist_ok=True); im.save(os.path.join(d, 'original', '%02d.png' % n))
def near_red(px, x, y): return any(red(px[x + dx, y + dy]) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)) if 0 <= x + dx < 256 and 0 <= y + dy < 256)

def s3_11():
    d, path, im = start('s3', 11); px = im.load(); tip, butt = keys('s3', 11); vx, vy = butt[0] - tip[0], butt[1] - tip[1]; L = (vx * vx + vy * vy) ** 0.5
    def off(x, y): t = ((x - tip[0]) * vx + (y - tip[1]) * vy) / L; t = max(0, min(L + 14, t)); return ((x - tip[0] - vx / L * t) ** 2 + (y - tip[1] - vy / L * t) ** 2) ** 0.5
    for x in range(128, 256):      # the second head and what is left of the pole behind the rider
        for y in range(256):
            if px[x, y][3] and (px[x, y][1] > 62 or (not red(px[x, y]) and not near_red(px, x, y))) and off(x, y) < 30 and ((x - butt[0]) ** 2 + (y - butt[1]) ** 2) ** 0.5 < 78: px[x, y] = (0, 0, 0, 0)
    layer = Image.new('RGBA', im.size, (0, 0, 0, 0)); g = ImageDraw.Draw(layer); a = (128, tip[1] + vy * (128 - tip[0]) / vx); b = (butt[0] - 3, butt[1] - 3 * vy / vx)
    g.line([a, b], fill=(24, 20, 30, 255), width=5); g.line([a, b], fill=(58, 54, 68, 255), width=3)                       # shaft: outline, then core
    g.ellipse([butt[0] - 5, butt[1] - 5, butt[0] + 4, butt[1] + 4], fill=(24, 20, 30, 255)); g.ellipse([butt[0] - 3, butt[1] - 3, butt[0] + 2, butt[1] + 2], fill=(244, 178, 44, 255))      # pommel
    lp = layer.load()
    for x in range(128, 256):
        for y in range(256):
            if lp[x, y][3] and px[x, y][3] == 0: px[x, y] = lp[x, y]      # behind the body and cape: only where nothing is drawn
    done(d, path, im, 11); print('s3 left 11: 자루 뒤쪽을 다시 그림')

def b2_05():
    d, path, im = start('b2', 5); px = im.load(); ref = Image.open(os.path.join(D, 'b2', 'left', '14.png')).convert('RGBA').load()
    tip, _ = keys('b2', 5); rtip, _ = keys('b2', 14); dx, dy = round(tip[0] - rtip[0]), round(tip[1] - rtip[1])
    zone = lambda x, y: x < 90 and y < 112      # left of the rider's face and above the horse: only the halberd is drawn there (the smear sits lower than the keypoint)
    for x in range(256):
        for y in range(256):
            if zone(x, y) and px[x, y][3]: px[x, y] = (0, 0, 0, 0)
    n = 0
    for x in range(256):
        for y in range(256):
            if zone(x, y) and ref[x, y][3] > 127 and not red(ref[x, y]) and zone(x + dx, y + dy) and x + dx >= 0 and y + dy >= 0 and px[x + dx, y + dy][3] == 0: px[x + dx, y + dy] = ref[x, y]; n += 1
    tip, butt = keys('b2', 5); vx, vy = butt[0] - tip[0], butt[1] - tip[1]; L = (vx * vx + vy * vy) ** 0.5; at = lambda t: (tip[0] + vx / L * t, tip[1] + vy / L * t)
    layer = Image.new('RGBA', im.size, (0, 0, 0, 0)); g = ImageDraw.Draw(layer); g.line([at(22), at(56)], fill=(24, 20, 30, 255), width=5); g.line([at(22), at(56)], fill=(58, 54, 68, 255), width=3); lp = layer.load()
    for x in range(256):      # the pole from the head down into the rider's outline: without it the head is a loose piece and sprite_fix.py removes it
        for y in range(256):
            if lp[x, y][3] and px[x, y][3] == 0: px[x, y] = lp[x, y]
    done(d, path, im, 5); print('b2 left 05: 14번의 날을 옮김 (%d픽셀, 이동 %d,%d)' % (n, dx, dy))

if __name__ == '__main__':
    s3_11(); b2_05()
