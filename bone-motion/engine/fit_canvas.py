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

MARGIN = 3.0
def fit(hero):
    src = open(os.path.join(sm.WORK, 'sim', 'heroes.js'), encoding='utf-8').read(); row = next(h for h in json.loads(src[src.index('['):src.rindex(']') + 1]) if h['id'] == hero)
    path = os.path.join(sm.WORK, 'art-in', hero, 'pixellab.json'); cfg = json.load(open(path, encoding='utf-8')); cfg.pop('canvas_offset', None); side = cfg.pop('side_offset', None)
    json.dump(cfg, open(path, 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)      # measure from the plain placement
    out = {}; problems = []
    for view in ('front', 'left', 'rear'):
        xs, ys = [], []
        for c in ['idle'] + row['attacks'] + [row['skillClip'], 'move']:
            _, _, first, motion = pl.prepared(hero, c, view, raw=True)
            for frame in [first] + motion:
                xs += [k['x'] * 256 for k in frame]; ys += [k['y'] * 256 for k in frame]
                # a big blade is a disc beside the shaft, centred a little back from the tip: "head": [px back from the tip, radius]
                back, r = cfg.get('head', (0, 0))
                if r:
                    by = {k['label']: k for k in frame}
                    if 'weapon tip' in by and 'weapon butt' in by:
                        tx, ty, bx, by_ = by['weapon tip']['x'] * 256, by['weapon tip']['y'] * 256, by['weapon butt']['x'] * 256, by['weapon butt']['y'] * 256
                        n = ((tx - bx) ** 2 + (ty - by_) ** 2) ** 0.5 or 1.0; cx, cy = tx - (tx - bx) / n * min(back, n), ty - (ty - by_) / n * min(back, n)
                        xs += [cx - r, cx + r]; ys += [cy - r, cy + r]
        im = pl.art(hero, view, base=True)[0]; bb = im.getbbox()      # the drawing itself must stay inside too
        xs += [bb[0], bb[2]]; ys += [bb[1], bb[3]]
        lo_x, hi_x, lo_y, hi_y = min(xs), max(xs), min(ys), max(ys); room = 256 - 2 * MARGIN
        if hi_x - lo_x > room: problems.append('%s: 좌우 %.0fpx (캔버스 %d)' % (view, hi_x - lo_x, room))
        if hi_y - lo_y > room: problems.append('%s: 상하 %.0fpx (캔버스 %d)' % (view, hi_y - lo_y, room))
        dx = max(0.0, MARGIN - lo_x) - max(0.0, hi_x - (256 - MARGIN)); dy = max(0.0, MARGIN - lo_y) - max(0.0, hi_y - (256 - MARGIN))
        if round(dx) or round(dy): out[view] = [int(round(dx + (1 if dx > 0 else -1 if dx < 0 else 0))), int(round(dy + (1 if dy > 0 else -1 if dy < 0 else 0)))]
    if out: cfg['canvas_offset'] = out
    json.dump(cfg, open(path, 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
    print('%s: %s%s' % (row['name'], out or '그대로 들어감', '  ** 안 들어감: ' + '; '.join(problems) if problems else ''))
    return problems

if __name__ == '__main__':
    for h in sys.argv[1:]: fit(h)
