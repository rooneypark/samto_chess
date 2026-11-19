"""Collect the frames the simulator actually plays into art-source/motions/v1/<id>/final/, the only place motion art is
published from (docs/리소스_올리기_가이드.md: images go in the release ZIPs, never in Git; final versions only).

    python -X utf8 bone-motion/engine/finalize_heroes.py            every hero with art-in/<id>/clips.json (not 장비, done by hand)
    python -X utf8 bone-motion/engine/finalize_heroes.py --guards   after `asset_packs.py restore` on another PC: put the
                                                                    guard pictures back in art-in/<id>/ so more clips can be made

    art-source/motions/v1/<id>/final/<clip>/<view>/01.png ...   + manifest.json (files, durations, pivot, status)
    art-source/motions/v1/<id>/guard/<view>.png                 the guard picture every clip starts from
    art-source/motions/v1/<id>/manifest.json                    attacks, skill, clip list

idle = the local breathing idle (4 frames), move = frames 1-14, attacks and skill = 15 frames with the bone's timing.
out/pixellab/<id>/ keeps the working files (job ids, the frames before local clean-up); it is not published.
After this, run export_hero_clips.py: the simulator then reads the final folder instead of out/pixellab.
"""
import datetime, importlib, json, os, shutil, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm

VIEWS = ('front', 'left', 'rear'); ROOT = os.path.dirname(sm.WORK); DEST = os.path.join(ROOT, 'art-source', 'motions', 'v1')
APPROVED = {'liaohua': '2026-11-19', '15': '2026-11-19', '1': '2026-11-19'}      # the user said "확정" for these; the others are in the simulator for review

def off(cfg, view):
    if view in cfg.get('canvas_offset', {}): return cfg['canvas_offset'][view]
    return [cfg.get('side_offset', 0) if view == 'left' else 0, 0]

def heroes():
    src = open(os.path.join(sm.WORK, 'sim', 'heroes.js'), encoding='utf-8').read(); rows = {h['id']: h for h in json.loads(src[src.index('['):src.rindex(']') + 1])}
    for hero in sorted(os.listdir(os.path.join(sm.WORK, 'art-in'))):
        p = os.path.join(sm.WORK, 'art-in', hero, 'clips.json')
        if hero == '2' or hero not in rows or not os.path.exists(p): continue
        data = json.load(open(p, encoding='utf-8'))
        if 'order' in data: yield hero, rows[hero], data

def finalize():
    for hero, row, data in heroes():
        cfg = json.load(open(os.path.join(sm.WORK, 'art-in', hero, 'pixellab.json'), encoding='utf-8')); m = importlib.import_module('clips.' + row['family'])
        clips = ['idle', 'move'] + data['order']['attacks'] + [data['order']['skill']]; src = lambda c, v, n: os.path.join(sm.WORK, 'out', 'pixellab', hero, c, v, '%02d.png' % n)
        plan = {c: (('idle-still', [1, 2, 3, 4]) if c == 'idle' else (data[c].get('folder', c), data[c]['frames'])) for c in clips}
        missing = [src(f, v, n) for c, (f, ns) in plan.items() for v in VIEWS for n in ns if not os.path.exists(src(f, v, n))]
        if missing: print('%s: 없는 그림 %d장, 건너뜀 (%s)' % (row['name'], len(missing), missing[0])); continue
        base = os.path.join(DEST, hero); status = 'user_approved' if hero in APPROVED else 'in_simulator_for_review'
        for sub in ('final', 'guard'): shutil.rmtree(os.path.join(base, sub), ignore_errors=True)
        index = {}
        for c, (folder, ns) in plan.items():
            for v in VIEWS:
                d = os.path.join(base, 'final', c, v); os.makedirs(d); files = []
                for i, n in enumerate(ns, 1): shutil.copyfile(src(folder, v, n), os.path.join(d, '%02d.png' % i)); files.append('%02d.png' % i)
                dur = [260] * 4 if c == 'idle' else [data[c]['duration_ms']] * len(ns) if 'duration_ms' in data[c] else [m.CLIPS[c]['durations'][n - 1] for n in ns]
                man = {'status': status, 'files': files, 'durations_ms': dur, 'pivot': [128 + off(cfg, v)[0], 224 + off(cfg, v)[1]], 'loop': c in ('idle', 'move'),
                       'source': 'bone-motion/out/pixellab/%s/%s/%s' % (hero, folder, v), 'source_frames': ns}
                if data.get(c, {}).get('note'): man['note'] = data[c]['note']
                json.dump(man, open(os.path.join(d, 'manifest.json'), 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
                index.setdefault(c, {})[v] = 'art-source/motions/v1/%s/final/%s/%s/manifest.json' % (hero, c, v)
        os.makedirs(os.path.join(base, 'guard'))
        for v in VIEWS: shutil.copyfile(os.path.join(sm.WORK, 'art-in', hero, 'guard-%s.png' % v), os.path.join(base, 'guard', v + '.png'))
        top = {'schemaVersion': 1, 'id': hero, 'name': row['name'], 'family': row['family'], 'reviewStatus': status, 'canvas': [256, 256],
               'attacks': data['order']['attacks'], 'skill': data['order']['skill'], 'skillName': row['skill'], 'clips': index, 'finalized': datetime.date.today().isoformat()}
        if hero in APPROVED: top['approvedDate'] = APPROVED[hero]
        json.dump(top, open(os.path.join(base, 'manifest.json'), 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
        print('%s (%s): %d클립 x 3방향, %s' % (row['name'], hero, len(clips), status))

def guards():
    for hero in sorted(os.listdir(DEST)):
        for v in VIEWS:
            a = os.path.join(DEST, hero, 'guard', v + '.png'); b = os.path.join(sm.WORK, 'art-in', hero, 'guard-%s.png' % v)
            if os.path.exists(a) and not os.path.exists(b): shutil.copyfile(a, b); print('복원:', b)

if __name__ == '__main__':
    guards() if '--guards' in sys.argv else finalize()
