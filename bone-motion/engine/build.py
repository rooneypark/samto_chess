"""Build one clip: solve the 15 frames, measure them, write previews and the coordinate track.

    python bone-motion/engine/build.py foot_spear a1
"""
import importlib, json, os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm, render

def build(family, clip_id):
    module = importlib.import_module('clips.' + family); clip = module.CLIPS[clip_id]
    neutral = os.path.join(sm.WORK, 'inputs', 'request', module.BODY)
    rig = module.rig(neutral) if hasattr(module, 'rig') else render.FootRig(sm.Body(neutral), module.WEAPON)
    poses = clip['poses'] if 'poses' in clip else sm.timeline(clip['keys'])
    solved = [rig.solve(p) for p in poses]
    frames = [j for j, _ in solved]; issues = [i for _, i in solved]
    if hasattr(rig, 'post'): rig.post(frames, poses)
    supports = clip['support']; durations = clip['durations']
    report = render.qa(rig, frames, supports, issues, treadmill=clip.get('treadmill', False), canvas_shift=getattr(module, 'CANVAS_SHIFT', None), overhead=clip.get('overhead', False))
    report.update(family=family, clip=clip_id, title=clip['title'], impact_frame=clip.get('impact'), impact2_frame=clip.get('impact2'), arrive_frame=clip.get('arrive'), event=clip.get('event', '타격'), durations_ms=durations, body=module.BODY, notes=clip.get('notes'))
    out = os.path.join(sm.WORK, 'out', family); os.makedirs(out, exist_ok=True); base = os.path.join(out, clip_id)
    images = [render.draw_frame(rig, j, '%s · %s   %02d / 15   %dms%s' % (module.TITLE, clip['title'], i + 1, durations[i], ('   ◀ ' + clip.get('event', '타격') if clip.get('impact') == i + 1 else '') + ('   ◀ 도달' if clip.get('arrive') == i + 1 else '') + ('   ◀ 2타' if clip.get('impact2') == i + 1 else '')), supports[i]) for i, j in enumerate(frames)]
    pal = [im.convert('RGB').convert('P', palette=Image.ADAPTIVE) for im in images]
    pal[0].save(base + '.gif', save_all=True, append_images=pal[1:], duration=durations, loop=0)
    pal[0].save(base + '-slow.gif', save_all=True, append_images=pal[1:], duration=[d * 3 for d in durations], loop=0)
    picks = clip.get('sheet', [0, 4, 6, 7, 9, 12]); w, h = images[0].size
    sheet = Image.new('RGBA', (w, h * len(picks)), (14, 18, 28, 255))
    for k, i in enumerate(picks): sheet.paste(images[i], (0, k * h))
    sheet.resize((w * 2 // 3, h * len(picks) * 2 // 3), Image.LANCZOS).save(base + '-keys.png')
    with open(base + '-qa.json', 'w', encoding='utf-8', newline='\n') as f: json.dump(report, f, ensure_ascii=False, indent=1); f.write('\n')
    track = {'family': family, 'clip': clip_id, 'title': clip['title'], 'body': module.BODY, 'units': 'px; x = screen right in front view, y = forward, z = up; ground pivot (128,224)',
             'durations_ms': durations, 'impact_frame': clip.get('impact'), 'support': supports,
             'frames': [{k: [round(c, 3) for c in v] for k, v in j.items()} for j in frames]}
    if clip_id not in ('idle', 'move'):      # for the game: how far to carry a melee unit toward its target when it attacks up or down the board
        from export import advance
        track['approach'] = {'max_px': 41, 'curve': advance(family, clip, rig, frames), 'applies': 'attacks up or down the board only; a null curve means the unit stays in place',
                             'why': 'the low camera shows 100 px of depth as about 31 px, but the rows of the board are 100 px apart'}
    with open(base + '-track.json', 'w', encoding='utf-8', newline='\n') as f: json.dump(track, f, ensure_ascii=False); f.write('\n')
    return report

if __name__ == '__main__':
    r = build(sys.argv[1], sys.argv[2])
    for k, v in r.items():
        if k not in ('pelvis_path', 'outside_canvas', 'fail'): print(' ', k, v)
    print('  outside_canvas', r['outside_canvas'][:6], len(r['outside_canvas']))
    print('  FAIL' if r['fail'] else '  PASS', r['fail'])
