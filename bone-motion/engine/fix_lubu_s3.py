"""여포 전법(s3) 측면 8~11번: PixelLab drew a second halberd head on the rear end of the pole. Local repair, no new request.

    python -X utf8 bone-motion/engine/fix_lubu_s3.py

The pole lies on the same line in the attack b2 (frames 10, 11, 9: same or nearly the same weapon keypoints), where the
rear end is drawn correctly as a plain pommel. Around the rear half of the pole (the line from the keypoints that were
sent) everything that is not red is taken out, and the pole and pommel of the matching b2 frame are put back along ITS line.
Red pixels (cape, feathers) and their outline are never touched, nor anything left of x = 128.
The frame as received is kept as raw-NN.png; original/NN.png gets the repaired frame so sprite_fix.py does not undo it.
"""
import json, os, shutil, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm

D = os.path.join(sm.WORK, 'out', 'pixellab', '119'); X0 = 128
PAIRS = {8: 10, 9: 11, 10: 11, 11: 9}
red = lambda p: p[3] > 127 and p[0] > 110 and p[1] < 75 and p[2] < 95
gold = lambda p: p[3] > 127 and p[0] > 190 and 120 < p[1] < 215 and p[2] < 110
dark = lambda p: p[3] > 127 and max(p[:3]) < 100

def line(clip, n):
    r = json.load(open(os.path.join(D, clip, 'left', 'request.json'), encoding='utf-8')); k = {p['label']: (p['x'] * 256, p['y'] * 256) for p in r['keypoints'][n - 1]}
    return k['weapon tip'], k['weapon butt']
def dist(p, a, b, over=0.0):
    """Distance from p to the segment a-b, the segment running `over` px past b."""
    vx, vy = b[0] - a[0], b[1] - a[1]; L = (vx * vx + vy * vy) ** 0.5; t = ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / L
    t = max(0.0, min(L + over, t)); return ((p[0] - a[0] - vx / L * t) ** 2 + (p[1] - a[1] - vy / L * t) ** 2) ** 0.5

def repair(n, m):
    d = os.path.join(D, 's3', 'left'); path = os.path.join(d, '%02d.png' % n); raw = os.path.join(d, 'raw-%02d.png' % n)
    if not os.path.exists(raw): shutil.copyfile(path, raw)
    im = Image.open(raw).convert('RGBA'); px = im.load(); ref = Image.open(os.path.join(D, 'b2', 'left', '%02d.png' % m)).convert('RGBA').load()
    tip, butt = line('s3', n); rtip, rbutt = line('b2', m); near_red = lambda x, y: any(red(px[x + dx, y + dy]) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)) if 0 <= x + dx < 256 and 0 <= y + dy < 256)
    gone = [(x, y) for x in range(X0, 256) for y in range(256) if px[x, y][3] and not red(px[x, y]) and not near_red(x, y) and dist((x, y), tip, butt, 14) < 30
            and ((x - butt[0]) ** 2 + (y - butt[1]) ** 2) ** 0.5 < 70]      # the rear end only: within 70 px of the pommel
    for x, y in gone: px[x, y] = (0, 0, 0, 0)
    put = 0
    for x in range(X0, 256):
        for y in range(256):
            r = ref[x, y]
            if px[x, y][3] == 0 and (dark(r) or gold(r)) and dist((x, y), rtip, rbutt, 9) < 6.5: px[x, y] = r; put += 1
    im.save(path); os.makedirs(os.path.join(d, 'original'), exist_ok=True); im.save(os.path.join(d, 'original', '%02d.png' % n)); return len(gone), put

if __name__ == '__main__':
    for n, m in PAIRS.items(): print('s3 left %02d <- b2 left %02d:' % (n, m), repair(n, m))
