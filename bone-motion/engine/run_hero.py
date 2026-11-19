"""One hero from base-pose art to every clip, in the order the user fixed (PIXELLAB-WORKFLOW.md).

    python -X utf8 bone-motion/engine/run_hero.py <hero id> [--pick 12] [--only idle|rest]

Needs art-in/<id>/pixellab.json (written by hand after looking at the drawing) and the three 256x256 drawings.
    1. skeleton estimate of the base pose (foot soldiers; a rider uses the mounted guard bone instead)
    2. free preflight; anything blocked stops the run
    3. idle from the base pose, three views                    12 generations
    4. frame --pick (default 12) becomes the guard picture; the breathing idle is made locally from it
    5. three attacks, the skill and the move, three views      60 generations, at most 10 jobs at a time
    6. local clean-up, clips.json, and a preview GIF of everything
A clip/view that already has a job is never submitted twice, so the script can be run again after an interruption.
"""
import json, os, subprocess, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm, pixellab as pl, preflight
from PIL import Image, ImageDraw

VIEWS = ('front', 'left', 'rear'); HERE = os.path.dirname(os.path.abspath(__file__))

def hero_row(hero):
    src = open(os.path.join(sm.WORK, 'sim', 'heroes.js'), encoding='utf-8').read(); rows = json.loads(src[src.index('['):src.rindex(']') + 1])
    return next(h for h in rows if h['id'] == hero)

def wait(hero):
    while pl.fetch(hero): time.sleep(20)

def submit(hero, clip_id, views=VIEWS):
    for view in views:
        if os.path.exists(os.path.join(sm.WORK, 'out', 'pixellab', hero, clip_id, view, 'job.json')): continue
        while True:
            try: pl.animate(hero, clip_id, view); break
            except SystemExit as e:
                if '429' in str(e): print('  동시 10건 한도: 진행 중인 작업을 기다림'); wait(hero)
                else: raise

def tool(name, *args): subprocess.run([sys.executable, '-X', 'utf8', os.path.join(HERE, name)] + [str(a) for a in args], check=True)

def blocked(hero, clips):
    bad = []
    for c in clips:
        for v in VIEWS:
            try: b, w, _ = preflight.check(pl, hero, c, v)
            except Exception as e: b = ['%s: %s' % (type(e).__name__, e)]
            bad += ['%s %s: %s' % (c, v, x) for x in b]
    return bad

def preview(hero, order, skill, move_ms):
    b = os.path.join(sm.WORK, 'out', 'pixellab', hero); idle = [('idle-still', n, 260) for n in (1, 2, 3, 4)]; seq = idle * 2
    for c in order: seq += [(c, n, 78) for n in range(1, 16)] + idle
    seq += idle + [(skill, n, 88) for n in range(1, 16)] + idle + [('move', n, move_ms) for n in range(1, 15)] * 3
    frames = []; top = 256
    for c, n, ms in seq:
        f = Image.new('RGBA', (768, 256), (200, 198, 185, 255))
        for k, v in enumerate(VIEWS):
            im = Image.open(os.path.join(b, c, v, '%02d.png' % n)).convert('RGBA'); f.alpha_composite(im, (k * 256, 0)); bb = im.getbbox(); top = min(top, bb[1] if bb else 256)
        frames.append((f, c))
    y0 = max(0, top - 8); out = []
    for f, c in frames:
        g = f.crop((0, y0, 768, 240)).resize((1536, (240 - y0) * 2), Image.NEAREST); ImageDraw.Draw(g).text((8, 6), c, fill=(0, 0, 0, 255)); out.append(g.convert('P', palette=Image.ADAPTIVE))
    path = os.path.join(b, 'all-3views.gif'); out[0].save(path, save_all=True, append_images=out[1:], duration=[ms for _, _, ms in seq], loop=0); return path

if __name__ == '__main__':
    hero = sys.argv[1]; pick = int(sys.argv[sys.argv.index('--pick') + 1]) if '--pick' in sys.argv else 12
    only = sys.argv[sys.argv.index('--only') + 1] if '--only' in sys.argv else None
    row = hero_row(hero); cfg = pl.hero_config(hero); order = row['attacks']; skill = row['skillClip']; clips = order + [skill, 'move']
    missing = [c for c in ['idle'] + clips if c not in cfg['actions']]
    if missing: raise SystemExit('pixellab.json의 actions에 없는 클립: %s' % missing)
    print('== %s (%s): 평타 %s, 전법 %s' % (row['name'], row['family'], ' '.join(order), skill))
    if only != 'rest':
        if not pl.mounted(cfg) and not os.path.exists(os.path.join(sm.WORK, 'art-in', hero, 'estimate-front.json')):
            for view in VIEWS:
                im, b64 = pl.art(hero, view, base=True); r = pl.call('POST', '/estimate-skeleton', {'image': b64})
                json.dump(r['keypoints'], open(os.path.join(sm.WORK, 'art-in', hero, 'estimate-%s.json' % view), 'w', encoding='utf-8'), indent=1)
            print('  뼈대 추정 3건 (0.3회분)')
        if not all(pl.stage(hero, v) == 'guard' for v in VIEWS):
            bad = blocked(hero, ['idle'])
            if bad: raise SystemExit('제출 전 검사에서 막힘:\n  ' + '\n  '.join(bad))
            submit(hero, 'idle'); wait(hero); tool('sprite_fix.py', hero, 'idle')
            for v in VIEWS: pl.pick(hero, v, pick)
        tool('idle_breath.py', hero, 152 if pl.mounted(cfg) else 196)
    if only != 'idle':
        # the four clips a player sees from this hero must not look alike (Zhao Yun cost 36 generations to learn this)
        import itertools, variety
        four = order + [skill]; tr = {c: variety.track(row['family'], c)[0] for c in four}
        near = min((variety.distance(tr[a], tr[b]), a, b) for a, b in itertools.combinations(four, 2)); limit = 6.0 if (row['family'] == 'caster' or (cfg.get('weapon_length') or 0) < 60) else 9.0      # a caster is read by its body, its prop is small whatever it holds
        print('  가장 비슷한 두 클립: %s, %s (%.1fpx, 기준 %.0f)' % (near[1], near[2], near[0], limit))
        if near[0] < limit and row['family'] != 'bow' and not cfg.get('variety_ok'):
            raise SystemExit('클립이 너무 비슷합니다: %s 와 %s (%.1fpx). 본을 고치거나 assign_attacks.py로 평타를 다시 고른 뒤 진행합니다.' % (near[1], near[2], near[0]))
        bad = blocked(hero, clips)
        if bad: raise SystemExit('제출 전 검사에서 막힘:\n  ' + '\n  '.join(bad))
        for c in clips: submit(hero, c)
        wait(hero)
        for c in clips: tool('sprite_fix.py', hero, c)
        p = os.path.join(sm.WORK, 'art-in', hero, 'clips.json'); data = json.load(open(p, encoding='utf-8')) if os.path.exists(p) else {}
        for c in order + [skill]: data[c] = {'frames': list(range(1, 16))}
        ms = 54 if row['family'] == 'caster' else 46
        data['move'] = {'frames': list(range(1, 15)), 'duration_ms': ms, 'note': '15번은 빼고 01~14번만 반복한다.'}; data['order'] = {'attacks': order, 'skill': skill}
        json.dump(data, open(p, 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
        print('  미리보기:', preview(hero, order, skill, ms))
    print('  잔량:', pl.call('GET', '/balance')['subscription']['generations'])
