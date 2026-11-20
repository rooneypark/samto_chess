"""Generated sprites for the battle simulator: sim/hero-clips.js  (window.HERO_CLIPS[hero id][clip][view]).

    python -X utf8 bone-motion/engine/export_hero_clips.py

Every hero with art-in/<id>/clips.json (written by run_hero.py) is included. Files are referenced where they are: the
published copy in art-source/motions/v1/<id>/final/ when finalize_heroes.py has made one, otherwise out/pixellab/<id>/. Zhang Fei keeps his own approved list (sim/zhangfei-clips.js).
Idle = the local breathing idle (4 frames); move = frames 1-14; attacks and skill = 15 frames with the bone's timing.
"""
import importlib, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm

VIEWS = ('front', 'left', 'rear')
def off(cfg, view):
    if view in cfg.get('canvas_offset', {}): return cfg['canvas_offset'][view]
    return [cfg.get('side_offset', 0) if view == 'left' else 0, 0]
if __name__ == '__main__':
    src = open(os.path.join(sm.WORK, 'sim', 'heroes.js'), encoding='utf-8').read(); rows = {h['id']: h for h in json.loads(src[src.index('['):src.rindex(']') + 1])}
    out = {}; base = os.path.join(sm.WORK, 'art-in')
    for hero in sorted(os.listdir(base)):
        p = os.path.join(base, hero, 'clips.json')
        if not os.path.exists(p) or hero not in rows: continue      # 장비 (2) is made by the same tools since 2026-11-20
        data = json.load(open(p, encoding='utf-8'))
        if 'order' not in data: continue
        cfg = json.load(open(os.path.join(base, hero, 'pixellab.json'), encoding='utf-8')); m = importlib.import_module('clips.' + rows[hero]['family'])
        clips = {}; missing = []
        for clip_id in ['idle', 'move'] + data['order']['attacks'] + [data['order']['skill']]:
            spec = data[clip_id]; folder = spec.get('folder', clip_id); views = {}
            for view in VIEWS:
                final = os.path.join(os.path.dirname(sm.WORK), 'art-source', 'motions', 'v1', hero, 'final', clip_id, view)      # published copy, if finalize_heroes.py made one
                if os.path.isdir(final): files = ['../../art-source/motions/v1/%s/final/%s/%s/%02d.png' % (hero, clip_id, view, i) for i in range(1, len(spec['frames']) + 1)]
                else: files = ['../out/pixellab/%s/%s/%s/%02d.png' % (hero, folder, view, n) for n in spec['frames']]
                missing += [f for f in files if not os.path.exists(os.path.join(sm.WORK, 'sim', f))]
                if 'duration_ms' in spec: dur = [spec['duration_ms']] * len(files)
                else: dur = [m.CLIPS[clip_id]['durations'][n - 1] for n in spec['frames']]
                views[view] = {'files': files, 'durations': dur, 'pivot': [128 + off(cfg, view)[0], 224 + off(cfg, view)[1]]}
            clips[clip_id] = views
        if missing: print('%s: 없는 파일 %d개, 건너뜀 (예: %s)' % (rows[hero]['name'], len(missing), missing[0])); continue
        out[hero] = clips; print('%s: %s' % (rows[hero]['name'], ' '.join(clips)))
    open(os.path.join(sm.WORK, 'sim', 'hero-clips.js'), 'w', encoding='utf-8', newline='\n').write('window.HERO_CLIPS = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print('%d명 -> sim/hero-clips.js' % len(out))
