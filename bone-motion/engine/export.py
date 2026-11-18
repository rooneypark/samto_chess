"""Two exports.

    python bone-motion/engine/export.py idle    -> out/idle-reference/  (11 병종 x 3 방향 정지 자세, 원화 작업용)
    python bone-motion/engine/export.py sim     -> sim/data.js          (격자 시뮬레이터용 그리기 데이터)
"""
import importlib, json, os, sys
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm, render
from overview import solve, FAMILIES

NAMES = {'front': '정면', 'left': '왼쪽 측면', 'rear': '후면'}
HEIGHT = {'samto-body-neutral.json': '보병 본 (선 키 124px)', 'samto-body-tactician-neutral.json': '책사 본 (선 키 111px)', 'samto-body-cavalry-neutral.json': '기마 본 (전체 163px)'}

def idle_reference():
    out = os.path.join(sm.WORK, 'out', 'idle-reference'); os.makedirs(out, exist_ok=True); S = render.S; W = 256 * S
    rows, index = [], []
    for n, f in enumerate(FAMILIES, 1):
        m, clip, rig, frames = solve(f, 'idle'); j = frames[0]; stem = '%02d-%s' % (n, f)
        sheet = Image.new('RGBA', (W * 3, W + 40), (14, 18, 28, 255)); d = ImageDraw.Draw(sheet)
        d.text((10, 6), '%02d %s · 전투 대기 · %s' % (n, m.TITLE, HEIGHT[m.BODY]), font=render.font(22), fill=(255, 255, 255, 255))
        for i, (view, _) in enumerate(sm.VIEWS):
            im = render.draw_view(rig, j, view, None, target=None, support=clip['support'][0])
            im.save(os.path.join(out, '%s-%s.png' % (stem, view)))
            lab = im.copy(); ImageDraw.Draw(lab).text((10, 8), NAMES[view], font=render.font(20), fill=(255, 236, 170, 255)); sheet.paste(lab, (i * W, 40))
        sheet.save(os.path.join(out, stem + '-3view.png')); rows.append(sheet)
        coords = {view: {k: [round(c, 1) for c in sm.project(view, v)[:2]] for k, v in j.items()} for view, _ in sm.VIEWS}
        index.append({'no': n, 'family': f, 'title': m.TITLE, 'body': m.BODY, 'canvas': [256, 256], 'ground_pivot': [128, 224],
                      'world_px': {k: [round(c, 1) for c in v] for k, v in j.items()}, 'screen_px': coords})
    w, h = rows[0].size
    for name, part in (('all-1of2.png', rows[:6]), ('all-2of2.png', rows[6:])):
        big = Image.new('RGBA', (w, h * len(part)), (14, 18, 28, 255))
        for i, r in enumerate(part): big.paste(r, (0, i * h))
        big.resize((w * 2 // 3, big.height * 2 // 3), Image.LANCZOS).save(os.path.join(out, name))
    with open(os.path.join(out, 'idle-joints.json'), 'w', encoding='utf-8', newline='\n') as fh: json.dump(index, fh, ensure_ascii=False, indent=1); fh.write('\n')
    print('idle reference:', len(index), 'families ->', out)

def primitives(rig, j, view):
    """What draw_view draws, as numbers: [x1, y1, x2, y2, width, r, g, b] relative to the ground pivot, far to near."""
    P = lambda v: sm.project(view, v); drawn = []
    for a, b, radius, key, kind in rig.parts(j):
        drawn.append(((P(j[a])[2] + P(j[b])[2]) / 2 + (0.5 if kind == 'hand' else 0), a, b, radius, key))
    nears = [d[0] for d in drawn]; lo, hi = min(nears), max(nears); out = []
    for near, a, b, radius, key in sorted(drawn, key=lambda d: d[0]):
        A, B = P(j[a]), P(j[b]); c = render.shade(render.COLOUR[key], near, lo, hi)
        out.append([round(A[0] - 128, 1), round(A[1] - 224, 1), round(B[0] - 128, 1), round(B[1] - 224, 1), round(radius * 2, 1), c[0], c[1], c[2]])
    return out

RANGED = ('bow', 'caster', 'command')      # these do not close the distance: an arrow, a spell, a signal

def advance(family, clip, rig, frames):
    """0..1 per frame: how far the weapon tip has gone from its rest position to the strike point. The simulator uses it
    to carry a melee attacker toward the target when attacking up or down the board (see sim/index.html)."""
    if family in RANGED or not rig.weapon_ends or not clip.get('impact'): return None
    tip = rig.weapon_ends[1]; ys = [j[tip][1] for j in frames]; hit = ys[clip['impact'] - 1]; base = ys[0]
    if hit - base < 20: return None                      # nothing reaches forward (a shout, a brace, a signal)
    r = [max(0.0, min(1.0, (y - base) / (hit - base))) for y in ys]
    r = [0.0 if i < clip['impact'] - 2 else v for i, v in enumerate(r)]      # the wind-up stays on its own tile
    last = len(r) - 1; hold = (clip.get('impact2') or clip['impact']) + 1                    # stay in until the last hit has settled,
    r = [v if i <= hold else min(v, (last - i) / max(1, last - hold)) for i, v in enumerate(r)]      # then walk back out steadily (no snap home on the last frame)
    return [round(max(r[i], 0.4 * r[min(i + 1, len(r) - 1)]), 3) for i in range(len(r))]      # start moving one frame before the snap

def sim_data():
    data = {'families': []}
    for f in FAMILIES:
        mod = importlib.import_module('clips.' + f); attack = 'a1' if 'a1' in mod.CLIPS else 's1'; entry = {'id': f, 'title': mod.TITLE, 'attack': attack, 'clips': {}}
        order = ['idle', 'move', 'a1', 'a2', 'a3', 'b1', 'b2', 'b3', 's1', 's2', 's3', 's4', 's5', 's6']
        for cid in [c for c in order if c in mod.CLIPS]:
            m, clip, rig, frames = solve(f, cid)
            entry['clips'][cid] = {'title': clip['title'], 'durations': clip['durations'], 'impact': clip.get('impact'), 'impact2': clip.get('impact2'), 'arrive': clip.get('arrive'),
                                   'event': clip.get('event', '타격'), 'notes': clip.get('notes'), 'support': [list(x) for x in clip['support']],
                                   'advance': advance(f, clip, rig, frames) if cid not in ('idle', 'move') else None,
                                   'views': {view: [primitives(rig, j, view) for j in frames] for view, _ in sm.VIEWS}}
        data['families'].append(entry)
    out = os.path.join(sm.WORK, 'sim'); os.makedirs(out, exist_ok=True)
    with open(os.path.join(out, 'data.js'), 'w', encoding='utf-8', newline='\n') as fh:
        fh.write('window.SIM_DATA = '); json.dump(data, fh, ensure_ascii=False, separators=(',', ':')); fh.write(';\n')
    print('sim data ->', os.path.join(out, 'data.js'), os.path.getsize(os.path.join(out, 'data.js')) // 1024, 'KB')

if __name__ == '__main__':
    what = sys.argv[1:] or ['idle', 'sim']
    if 'idle' in what: idle_reference()
    if 'sim' in what: sim_data()
