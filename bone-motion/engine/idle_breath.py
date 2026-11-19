"""숨만 쉬는 전투 대기 (local, no API call), from the one confirmed guard picture per view.

    python -X utf8 bone-motion/engine/idle_breath.py <hero id> [split row=196]

The idle is a breathing pose (user decision 2026-11-19): no wind, nothing swings. The upper body sinks 1px on the
out-breath and comes back; hanging cloth below the waist (cape, robe, skirt: found by its colour, set "cloth_rgb" ranges
in pixellab.json to override) bounces the same 1px one beat later, so it follows the body instead of standing frozen.
Legs and feet never move. Frame 1 is the guard picture itself, which is also the first frame of every attack.
Output: out/pixellab/<id>/idle-still/<view>/01..04.png and art-in/<id>/clips.json.
"""
import json, os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm

BEATS = [(0, 0), (1, 0), (1, 1), (0, 1)]      # (upper body px, hanging cloth px): the cloth trails the body by one beat

def cloth_mask(im, split, ranges):
    px = im.load(); green = set()
    is_cloth = (lambda p: any(all(lo <= c <= hi for c, (lo, hi) in zip(p[:3], r)) for r in ranges)) if ranges else (lambda p: p[1] > p[0] + 12 and p[1] > p[2] + 12)
    for y in range(split, 256):
        for x in range(256):
            if px[x, y][3] and is_cloth(px[x, y]): green.add((x, y))
    edge = set()
    for (x, y) in green:      # the dark outline of the cloth moves with it
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                n = (x + dx, y + dy)
                if n not in green and split <= n[1] < 256 and 0 <= n[0] < 256 and px[n][3] and max(px[n][:3]) < 60: edge.add(n)
    return green | edge

def frames(guard, split, ranges):
    mask = cloth_mask(guard, split, ranges); src = guard.load(); out = []
    for up, cl in BEATS:
        im = Image.new('RGBA', (256, 256), (0, 0, 0, 0)); px = im.load()
        for y in range(split, 256):      # legs, feet, and whatever is under the cloth
            for x in range(256):
                if (x, y) not in mask: px[x, y] = src[x, y]
        for (x, y) in mask:      # hanging cloth, bounced; the row it leaves is filled from the cloth above it
            if y + cl < 256: px[x, y + cl] = src[x, y]
        if cl:
            for (x, y) in mask:
                if (x, y - 1) not in mask and px[x, y][3] == 0: px[x, y] = src[x, y]
        for y in range(split - 1, -1, -1):      # upper body last, on top
            for x in range(256):
                if src[x, y][3] and y + up < 256: px[x, y + up] = src[x, y]
        out.append(im)
    return out, len(mask)

if __name__ == '__main__':
    hero = sys.argv[1]; split = int(sys.argv[2]) if len(sys.argv) > 2 else 196
    cfg = json.load(open(os.path.join(sm.WORK, 'art-in', hero, 'pixellab.json'), encoding='utf-8'))
    for view in ('front', 'left', 'rear'):
        g = Image.open(os.path.join(sm.WORK, 'art-in', hero, 'guard-%s.png' % view)).convert('RGBA')
        fr, n = frames(g, split, cfg.get('cloth_rgb'))
        d = os.path.join(sm.WORK, 'out', 'pixellab', hero, 'idle-still', view); os.makedirs(d, exist_ok=True)
        for i, im in enumerate(fr): im.save(os.path.join(d, '%02d.png' % (i + 1)))
        print(view, '늘어진 천 %d px, 4프레임' % n)
    p = os.path.join(sm.WORK, 'art-in', hero, 'clips.json'); c = json.load(open(p, encoding='utf-8')) if os.path.exists(p) else {}
    c['idle'] = {'folder': 'idle-still', 'frames': [1, 2, 3, 4], 'duration_ms': 260,
                 'note': '숨만 쉬는 대기. 확정 전투 대기 그림에서 로컬로 만든다(engine/idle_breath.py). 상체가 1px 내려갔다 올라오고, 허리 아래로 늘어진 천은 한 박자 늦게 같이 오르내린다. 바람·흔들림 없음. 1번이 공격 클립의 시작 그림과 같다.'}
    json.dump(c, open(p, 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
