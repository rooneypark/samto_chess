"""Place a hero on the 256 canvas so that nothing leaves it in any clip. Free.

    python -X utf8 bone-motion/engine/fit_canvas.py <hero id> [...]

The approved drawings often carry a weapon longer than the bone's (a 160 px spear on a 128 px bone, a 195 px lance on
a 140 px one). PixelLab draws the drawing's length, so a sweep or a raised weapon runs off the canvas and is cut.
The body is never scaled to fit (user rule). Instead the whole sprite is moved on the canvas, per view, by the smallest
amount that makes every joint of every clip the hero uses fit, and the pivot moves with it. If the motion is simply wider
or taller than the canvas, that is reported: then the weapon in the drawing has to be shortened, or the clip changed.
Writes "canvas_offset": {view: [dx, dy]} into art-in/<id>/pixellab.json.
"""
import json, os, sys
os.environ['PIXELLAB_DRY'] = '1'
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm, pixellab as pl

MARGIN = 3.0; BODY_ROOM = 12.0
CUT = __import__('snappy').CUT      # a weapon end may leave the canvas by this much (user 2026-11-20); it counts that much nearer the middle
def fit(hero):
    src = open(os.path.join(sm.WORK, 'sim', 'heroes.js'), encoding='utf-8').read(); row = next(h for h in json.loads(src[src.index('['):src.rindex(']') + 1]) if h['id'] == hero)
    path = os.path.join(sm.WORK, 'art-in', hero, 'pixellab.json'); cfg = json.load(open(path, encoding='utf-8')); cfg.pop('canvas_offset', None); side = cfg.pop('side_offset', None)
    json.dump(cfg, open(path, 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)      # measure from the plain placement
    out = {}; problems = []
    for view in ('front', 'left', 'rear'):
        xs, ys, wx, wy = [], [], [], []      # the body (it must be on the canvas), and the weapon ends (they should be, as far as the body leaves room)
        for c in ['idle'] + row['attacks'] + [row['skillClip'], 'move']:
            _, _, first, motion = pl.prepared(hero, c, view, raw=True)
            for frame in [first] + motion:
                for k in frame:
                    x, y = k['x'] * 256, k['y'] * 256
                    if 'weapon' in k['label']: wx.append(x); wy.append(y)
                    else: xs.append(x); ys.append(y)
                # a big blade is a disc beside the shaft, centred a little back from the tip: "head": [px back from the tip, radius]
                back, r = cfg.get('head', (0, 0))
                if r:
                    by = {k['label']: k for k in frame}
                    if 'weapon tip' in by and 'weapon butt' in by:
                        tx, ty, bx, by_ = by['weapon tip']['x'] * 256, by['weapon tip']['y'] * 256, by['weapon butt']['x'] * 256, by['weapon butt']['y'] * 256
                        n = ((tx - bx) ** 2 + (ty - by_) ** 2) ** 0.5 or 1.0; cx, cy = tx - (tx - bx) / n * min(back, n), ty - (ty - by_) / n * min(back, n)
                        wx += [cx - r, cx + r]; wy += [cy - r, cy + r]
        im = pl.art(hero, view, base=True)[0]; bb = im.getbbox()      # the drawing itself must stay inside too
        xs += [bb[0], bb[2]]; ys += [bb[1], bb[3]]; room = 256 - 2 * MARGIN
        def place(body, weapon, name):
            """The shift along one axis. The body decides the range that is allowed; inside it, the weapon is brought on to the
            canvas, its low side first (the top of the picture, or the front in the side view: that is where the blade is).
            What the body leaves no room for is cut: up to CUT px is accepted (user 2026-11-20), more is reported."""
            b_lo, b_hi = min(body), max(body); lo_lim, hi_lim = MARGIN - b_lo, (256 - MARGIN) - b_hi
            if lo_lim > hi_lim: problems.append('%s: 몸이 %s %.0fpx (캔버스 %d)' % (view, name, b_hi - b_lo, room)); return (lo_lim + hi_lim) / 2
            a_lo, a_hi = min(body + weapon), max(body + weapon)
            want = max(0.0, MARGIN - a_lo) - (max(0.0, a_hi - (256 - MARGIN)) if a_hi - a_lo <= room else 0.0)
            d = min(max(want, lo_lim), hi_lim) if (want or not (lo_lim <= 0 <= hi_lim)) else 0.0
            over = max(0.0, -(a_lo + d), (a_hi + d) - 256)
            if over > CUT: problems.append('%s: 무기가 %s %.0fpx 밖 (허용 %d)' % (view, name, over, CUT))
            return d
        dx = place(xs, wx, '좌우'); dy = place(ys, wy, '상하')
        if round(dx) or round(dy): out[view] = [int(round(dx + (1 if dx > 0 else -1 if dx < 0 else 0))), int(round(dy + (1 if dy > 0 else -1 if dy < 0 else 0)))]
    if out: cfg['canvas_offset'] = out
    json.dump(cfg, open(path, 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
    print('%s: %s%s' % (row['name'], out or '그대로 들어감', '  ** 안 들어감: ' + '; '.join(problems) if problems else ''))
    return problems

if __name__ == '__main__':
    for h in sys.argv[1:]: fit(h)
