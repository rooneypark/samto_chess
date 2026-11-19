"""Local clean-up of generated frames, no API call. Originals are kept in <view>/original/.

    python -X utf8 bone-motion/engine/sprite_fix.py <hero id> <clip> [view ...]
    python -X utf8 bone-motion/engine/sprite_fix.py <hero id> --marked [clip ...]     smears marked by hand in art-in/<id>/fixes.json

PixelLab sometimes leaves a flat grey area behind the character (its background colour, 128/127/128) and loose smears.
  1. flat-grey areas of 150 px or more are removed; the character's own small grey details are kept
  2. anything not touching the character is removed (parts of 40 px or more are reported, not silently dropped, in case
     it is a thrown weapon or an effect)
"""
import os, shutil, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm

def parts(px, test, diagonal=False):
    seen = set(); out = []; near = [(1, 0), (-1, 0), (0, 1), (0, -1)] + ([(1, 1), (1, -1), (-1, 1), (-1, -1)] if diagonal else [])
    for y in range(256):
        for x in range(256):
            if (x, y) in seen or not test(px[x, y]): continue
            comp = [(x, y)]; seen.add((x, y)); k = 0
            while k < len(comp):
                cx, cy = comp[k]; k += 1
                for dx, dy in near:
                    n = (cx + dx, cy + dy)
                    if 0 <= n[0] < 256 and 0 <= n[1] < 256 and n not in seen and test(px[n]): seen.add(n); comp.append(n)
            out.append(comp)
    return out

def grey(p): return p[3] and abs(p[0] - 128) <= 3 and abs(p[1] - 127) <= 3 and abs(p[2] - 128) <= 3

def clean(path, keep, known=frozenset()):
    if not os.path.exists(keep): shutil.copy2(path, keep)
    im = Image.open(keep).convert('RGBA'); px = im.load(); flat = loose = 0; big = []
    # The leftover background is not always 128/127/128 (Guan Yu: a bluish grey). It is always ONE flat colour, dull and
    # mid-bright, covering many pixels, and NOT one of the colours of the confirmed guard picture (`known`).
    count = {}
    for y in range(256):
        for x in range(256):
            p = px[x, y]
            if p[3] and max(p[:3]) - min(p[:3]) < 40 and 90 <= max(p[:3]) <= 175: count[p[:3]] = count.get(p[:3], 0) + 1
    dull = {c for c, n in count.items() if n >= 500}      # may include a colour the character has too (Guan Yu's armour grey): see the size rule below
    flatgrey = lambda p: grey(p) or (p[3] and p[:3] in dull)
    for comp in parts(px, flatgrey):
        own = px[comp[0]][:3] in known and not grey(px[comp[0]])      # the character's own colour: only a patch far larger than any part of it is background
        if len(comp) >= (800 if own else 150):
            for c in comp: px[c] = (0, 0, 0, 0)
            flat += len(comp)
    comps = parts(px, lambda p: p[3] > 0, diagonal=True)
    if comps:
        body = max(comps, key=len)
        for comp in comps:
            if comp is body: continue
            for c in comp: px[c] = (0, 0, 0, 0)
            loose += len(comp)
            if len(comp) >= 40: big.append(len(comp))
    im.save(path); return flat, loose, big

KINDS = {'grey': lambda p: max(p[:3]) - min(p[:3]) < 26 and 70 <= max(p[:3]) <= 215,      # outline-less grey smear
         'tan': lambda p: p[0] > 150 and 100 <= p[1] <= 170 and p[2] < 120,
         'any': lambda p: True}

def erase(hero, fixes):
    """Hand-marked smears that touch the character and so survive clean(): art-in/<id>/fixes.json,
    [{"clip": "a1", "view": "front", "frame": 5, "rect": [x0, y0, x1, y1], "kind": "grey"}]. Only pixels of that kind inside the
    rectangle are removed; outlined parts of the character are left alone."""
    for f in fixes:
        path = os.path.join(sm.WORK, 'out', 'pixellab', hero, f['clip'], f['view'], '%02d.png' % f['frame'])
        im = Image.open(path).convert('RGBA'); px = im.load(); x0, y0, x1, y1 = f['rect']; n = 0; test = KINDS[f.get('kind', 'grey')]
        for y in range(max(0, y0), min(256, y1 + 1)):
            for x in range(max(0, x0), min(256, x1 + 1)):
                if px[x, y][3] and test(px[x, y]): px[x, y] = (0, 0, 0, 0); n += 1
        im.save(path); print('%s %s %02d: 표시한 얼룩 %d px 제거' % (f['clip'], f['view'], f['frame'], n))

if __name__ == '__main__':
    import json
    if len(sys.argv) > 2 and sys.argv[2] == '--marked':
        erase(sys.argv[1], [f for f in json.load(open(os.path.join(sm.WORK, 'art-in', sys.argv[1], 'fixes.json'), encoding='utf-8')) if not sys.argv[3:] or f['clip'] in sys.argv[3:]]); sys.exit()

    hero, clip = sys.argv[1], sys.argv[2]
    for view in sys.argv[3:] or ['front', 'left', 'rear']:
        d = os.path.join(sm.WORK, 'out', 'pixellab', hero, clip, view); os.makedirs(os.path.join(d, 'original'), exist_ok=True)
        known = set(); ref = os.path.join(sm.WORK, 'art-in', hero, 'guard-%s.png' % view)
        for r in (ref, os.path.join(sm.WORK, 'art-in', hero, {'front': 'front.png', 'left': 'side.png', 'rear': 'back.png'}[view])):
            if os.path.exists(r):
                g = Image.open(r).convert('RGBA'); cnt = {}
                for p in g.get_flattened_data() if hasattr(g, 'get_flattened_data') else g.getdata():
                    if p[3]: cnt[p[:3]] = cnt.get(p[:3], 0) + 1
                known |= {c for c, n in cnt.items() if n >= 12}
        for i in range(1, 16):
            f = os.path.join(d, '%02d.png' % i)
            if not os.path.exists(f): continue
            flat, loose, big = clean(f, os.path.join(d, 'original', '%02d.png' % i), frozenset(known))
            if flat or loose: print('%s %s %02d: 회색 면 %d px, 떨어진 조각 %d px%s' % (clip, view, i, flat, loose, ' (큰 조각 %s 확인 필요)' % big if big else ''))
    # clean() restarts from the originals, so the hand-marked smears are taken out again afterwards, then loose bits once more
    fx = os.path.join(sm.WORK, 'art-in', hero, 'fixes.json')
    if os.path.exists(fx):
        marked = [f for f in json.load(open(fx, encoding='utf-8')) if f['clip'] == clip]
        erase(hero, marked)
        for f in marked:
            path = os.path.join(sm.WORK, 'out', 'pixellab', hero, clip, f['view'], '%02d.png' % f['frame'])
            im = Image.open(path).convert('RGBA'); px = im.load(); comps = parts(px, lambda p: p[3] > 0, diagonal=True)
            body = max(comps, key=len)
            for comp in comps:
                if comp is not body:
                    for c in comp: px[c] = (0, 0, 0, 0)
            im.save(path)
