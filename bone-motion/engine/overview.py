"""Overview sheets, all families at the same scale so sizes can be compared directly.

    python bone-motion/engine/overview.py
writes out/overview-idle.png (전투 대기, every family) and out/size-compare.png (보병 · 책사 · 기마를 같은 바닥선에 나란히).
"""
import importlib, os, sys
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm, render

FAMILIES = ['foot_spear', 'sword', 'spear_shield', 'dual', 'heavy', 'flexible', 'bow', 'command', 'caster', 'mounted_blade', 'mounted_spear', 'sickle', 'poleaxe']      # sickle = 감녕's variant of 사슬·채찍, not a twelfth type

def solve(family, clip_id):
    m = importlib.import_module('clips.' + family); clip = m.CLIPS[clip_id]
    neutral = os.path.join(sm.WORK, 'inputs', 'request', m.BODY)
    rig = m.rig(neutral) if hasattr(m, 'rig') else render.FootRig(sm.Body(neutral), m.WEAPON)
    poses = clip['poses'] if 'poses' in clip else sm.timeline(clip['keys'])
    frames = [rig.solve(p)[0] for p in poses]
    if hasattr(rig, 'post'): rig.post(frames, poses)
    return m, clip, rig, frames

def row(rig, j, support, labels):
    W = 256 * render.S; out = Image.new('RGBA', (W * 3, W), (14, 18, 28, 255))
    for i, (view, name) in enumerate(sm.VIEWS): out.paste(draw(rig, j, view, labels[i], support), (i * W, 0))
    return out

def draw(rig, j, view, label, support): return render.draw_view(rig, j, view, label, support=support)

def idle_sheet(families, path, cols=2):
    cells = []
    for f in families:
        m, clip, rig, frames = solve(f, 'idle')
        cells.append(row(rig, frames[0], clip['support'][0], [m.TITLE + ' 정면', '왼쪽 측면', '후면']))
    w, h = cells[0].size; rows = (len(cells) + cols - 1) // cols
    sheet = Image.new('RGBA', (w * cols, h * rows), (14, 18, 28, 255))
    for i, c in enumerate(cells): sheet.paste(c, ((i % cols) * w, (i // cols) * h))
    sheet.resize((sheet.width // 2, sheet.height // 2), Image.LANCZOS).save(path)

def a1_sheet(families, path):
    cells = []
    for f in families:
        m, clip, rig, frames = solve(f, 'a1' if 'a1' in m_clips(f) else 's1')
        hit = clip['impact'] - 1; wind = max(k for k, _, _ in clip['keys'] if k < hit - 1)
        for i, tag in ((wind, '준비'), (hit, clip.get('event', '타격'))):
            cells.append(row(rig, frames[i], clip['support'][i], ['%s %s %02d' % (m.TITLE, tag, i + 1), '왼쪽 측면', '후면']))
    w, h = cells[0].size
    sheet = Image.new('RGBA', (w * 2, h * (len(cells) // 2)), (14, 18, 28, 255))
    for i, c in enumerate(cells): sheet.paste(c, ((i % 2) * w, (i // 2) * h))
    sheet.resize((sheet.width // 2, sheet.height // 2), Image.LANCZOS).save(path)

def m_clips(f): return importlib.import_module('clips.' + f).CLIPS

def size_sheet(path):
    """Front and side view of 보병, 책사, 기마 on one ground line with height rulers (px at game scale)."""
    S = render.S; W = 256 * S; picks = [('foot_spear', '보병'), ('caster', '책사'), ('mounted_blade', '기마')]
    out = Image.new('RGBA', (W * 3, W * 2 + 40), (14, 18, 28, 255)); d = ImageDraw.Draw(out)
    for c, (f, name) in enumerate(picks):
        m, clip, rig, frames = solve(f, 'idle'); j = frames[0]
        body = {k: v for k, v in j.items() if not any(t in k for t in ('spear', 'glaive', 'fan'))}
        top = max(v[2] for v in body.values()) + (rig.body.r['head'] if hasattr(rig, 'body') else 18.5)
        for r_, view in enumerate(('front', 'left')):
            im = render.draw_view(rig, j, view, '%s %s' % (name, '정면' if view == 'front' else '왼쪽 측면'), support=clip['support'][0])
            out.paste(im, (c * W, r_ * W))
        d.text((c * W + 10, W * 2 + 8), '%s: 표준 본 선 키 %dpx (그림은 전투 대기 자세)' % (name, {'보병': 124, '책사': 111, '기마': 163}[name]), font=render.font(20), fill=(255, 236, 170, 255))
    out.save(path)

if __name__ == '__main__':
    o = os.path.join(sm.WORK, 'out')
    idle_sheet(FAMILIES, os.path.join(o, 'overview-idle.png'))
    size_sheet(os.path.join(o, 'size-compare.png'))
    print('done')
