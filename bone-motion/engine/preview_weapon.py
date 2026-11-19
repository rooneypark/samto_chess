"""Bone preview with the DRAWING's weapon length: what will be sent to PixelLab, as a stick figure. Free.

    python -X utf8 bone-motion/engine/preview_weapon.py <hero id> [...]    -> out/pixellab-preflight/<id>/weapon-preview.gif

Three views side by side (front, side, rear), idle then the hero's three attacks and skill. The weapon is drawn at the
length measured on the hero's art, held the way the request will hold it (weapon_mode), on the canvas placement that
fit_canvas.py chose. The dashed box is the 256 canvas: anything outside it would be cut.
"""
import json, os, sys
os.environ['PIXELLAB_DRY'] = '1'
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm, pixellab as pl, render
from PIL import Image, ImageDraw

VIEWS = ('front', 'left', 'rear'); NAME = {'front': '정면', 'left': '측면', 'rear': '후면'}; S = 2; PAD = 24
def colour(name):
    if name.startswith('weapon'): return (255, 214, 90)
    if name.startswith('horse'): return (196, 164, 120)
    if 'LEFT' in name: return (110, 200, 230)
    if 'RIGHT' in name: return (220, 130, 170)
    return (190, 200, 215)

def frame_image(cfg, sets, title, font):
    W = (256 + 2 * PAD) * S; im = Image.new('RGB', (W * 3, W + 30), (24, 30, 42)); d = ImageDraw.Draw(im)
    for k, view in enumerate(VIEWS):
        ox = k * W + PAD * S; oy = PAD * S + 30; rig, frame = sets[view]; parent = {r['name']: r['parent'] for r in rig}
        by = {p['label']: (ox + p['x'] * 256 * S, oy + p['y'] * 256 * S) for p in frame}
        for x in range(0, 256 * S, 12):
            d.line([(ox + x, oy), (ox + x + 6, oy)], fill=(70, 84, 104)); d.line([(ox + x, oy + 256 * S), (ox + x + 6, oy + 256 * S)], fill=(70, 84, 104))
            d.line([(ox, oy + x), (ox, oy + x + 6)], fill=(70, 84, 104)); d.line([(ox + 256 * S, oy + x), (ox + 256 * S, oy + x + 6)], fill=(70, 84, 104))
        off = pl.shift_of(cfg, view); d.line([(ox, oy + (224 + off[1]) * S), (ox + 256 * S, oy + (224 + off[1]) * S)], fill=(52, 64, 82))
        order = sorted(parent, key=lambda n: (n.startswith('weapon'), ))
        for name in order:
            p = parent[name]
            if p and name in by and p in by and not name.endswith(('mid', 'tip', 'root')) or name == 'weapon tip':
                if name == 'weapon tip':
                    a, b = by['weapon butt'], by['weapon tip']; d.line([a, b], fill=colour(name), width=5)
                    head = (b[0] + (a[0] - b[0]) * 0.22, b[1] + (a[1] - b[1]) * 0.22)
                    if 'axe' in cfg['description'] or 'mace' in cfg['description']:      # a head across the shaft, not a point along it
                        ux, uy = b[0] - a[0], b[1] - a[1]; n = (ux * ux + uy * uy) ** 0.5 or 1.0; px, py = -uy / n, ux / n; w = 26 if 'axe' in cfg['description'] else 12
                        d.polygon([b, (head[0] + px * w, head[1] + py * w), (b[0] + px * w * 0.9 + ux / n * 6, b[1] + py * w * 0.9 + uy / n * 6)], fill=(235, 240, 248))
                        d.polygon([b, (head[0] - px * w * 0.35, head[1] - py * w * 0.35), head], fill=(200, 208, 220))
                    else: d.line([head, b], fill=(235, 240, 248), width=7)      # the blade end
                elif name != 'weapon butt': d.line([by[p], by[name]], fill=colour(name), width=6 if name.startswith('horse') else 5)
        for hand in ('RIGHT ARM', 'LEFT ARM'):
            if hand in by: d.ellipse([by[hand][0] - 5, by[hand][1] - 5, by[hand][0] + 5, by[hand][1] + 5], fill=(255, 240, 200))
        head = by.get('NOSE') or by.get(pl.SKULL)
        if head and 'NECK' in by:
            c = ((head[0] + by['NECK'][0]) / 2, (head[1] + by['NECK'][1]) / 2 - 12); d.ellipse([c[0] - 16, c[1] - 16, c[0] + 16, c[1] + 16], fill=(150, 162, 180))
        d.text((ox, 34), NAME[view], fill=(170, 184, 204), font=font)
    d.text((10, 6), title, fill=(255, 255, 255), font=font); return im

def run(hero):
    src = open(os.path.join(sm.WORK, 'sim', 'heroes.js'), encoding='utf-8').read(); row = next(h for h in json.loads(src[src.index('['):src.rindex(']') + 1]) if h['id'] == hero)
    cfg = pl.hero_config(hero); font = render.font(15); frames = []; durs = []
    for clip_id in ['idle'] + row['attacks'] + [row['skillClip']]:
        per = {}
        for view in VIEWS:
            c, clip, first, motion = pl.prepared(hero, clip_id, view, raw=True)
            if clip_id == 'idle': motion = motion[int(c.get('transition', 4)):]      # the guard itself, not the walk into it
            per[view] = (pl.rig(view, bool(c.get('weapon_length')), c), motion)
        n = len(per['left'][1])
        for i in range(n):
            frames.append(frame_image(cfg, {v: (per[v][0], per[v][1][i]) for v in VIEWS}, '%s  %s  %d/%d   무기 %dpx (원화 길이)' % (row['name'], clip['title'], i + 1, n, cfg['weapon_length']), font))
            durs.append(max(70, clip['durations'][min(i, len(clip['durations']) - 1)]))
        frames += [frames[-1]] * 2; durs += [200, 200]
    out = os.path.join(sm.WORK, 'out', 'pixellab-preflight', hero); os.makedirs(out, exist_ok=True); path = os.path.join(out, 'weapon-preview.gif')
    pal = [f.convert('P', palette=Image.ADAPTIVE, colors=64) for f in frames]; pal[0].save(path, save_all=True, append_images=pal[1:], duration=durs, loop=0)
    print(row['name'], len(frames), '프레임 ->', path); return path

if __name__ == '__main__':
    for h in sys.argv[1:]: run(h)
