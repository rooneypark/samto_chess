"""전수검사: every hero that has not been generated yet, every clip it will use, three views. Free, nothing is submitted.

    python -X utf8 bone-motion/engine/sweep.py [hero id ...]      -> out/pixellab-preflight/SWEEP.md

For each hero: the settings file is complete, the four clips are different enough (variety), and the preflight passes for
idle (from the base-pose art) and for every other clip (checked as if the guard picture were the bone's guard, since the
real one does not exist until the idle has been generated). A hero that is 준비됨 can be run with run_hero.py as it is.
"""
import itertools, json, os, sys
os.environ['PIXELLAB_DRY'] = '1'
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm, pixellab as pl, preflight, variety

VIEWS = ('front', 'left', 'rear'); NAME = {'front': '정면', 'left': '측면', 'rear': '후면'}
if __name__ == '__main__':
    src = open(os.path.join(sm.WORK, 'sim', 'heroes.js'), encoding='utf-8').read(); rows = json.loads(src[src.index('['):src.rindex(']') + 1])
    want = set(sys.argv[1:]); lines = ['# 전수검사 (제출 전, 무료)', '', '| 장수 | 유형 | 평타 + 전법 | 가장 비슷한 두 클립 | 결과 |', '|---|---|---|---|---|']; detail = []; ready = stuck = 0
    for h in rows:
        hid = h['id']
        if want and hid not in want: continue
        done = os.path.join(sm.WORK, 'art-in', hid, 'clips.json')
        try: finished = os.path.exists(done) and 'order' in json.load(open(done, encoding='utf-8'))
        except ValueError: finished = False
        if not want and finished: continue
        if hid == '2': continue
        bad = []; warn = set(); near = None
        try:
            cfg = pl.hero_config(hid); four = h['attacks'] + [h['skillClip']]
            missing = [c for c in ['idle', 'move'] + four if c not in cfg['actions']]
            if missing: bad.append('actions에 없는 클립: %s' % missing)
            tr = {c: variety.track(h['family'], c)[0] for c in four}
            near = min((variety.distance(tr[a], tr[b]), a, b) for a, b in itertools.combinations(four, 2)); limit = 6.0 if (h['family'] == 'caster' or (cfg.get('weapon_length') or 0) < 60) else 9.0      # a caster is read by its body, its prop is small whatever it holds
            if near[0] < limit and h['family'] != 'bow' and not cfg.get('variety_ok'): bad.append('클립이 비슷함: %s와 %s (%.1fpx, 기준 %.0f)' % (near[1], near[2], near[0], limit))
            for c in ['idle'] + four + ['move']:
                for v in VIEWS:
                    try: b, w, _ = preflight.check(pl, hid, c, v)
                    except Exception as e: b, w = ['%s: %s' % (type(e).__name__, e)], []
                    bad += ['%s %s: %s' % (c, NAME[v], x) for x in b]; warn |= {x.split(':')[0].split('(')[0][:40] for x in w}
        except Exception as e: bad.append('%s: %s' % (type(e).__name__, e))
        ok = not bad; ready += ok; stuck += not ok
        lines.append('| %s (%s) | %s | %s + %s | %s | %s |' % (h['name'], hid, h['family'], ' '.join(h['attacks']), h['skillClip'], '%.1fpx' % near[0] if near else '-', '준비됨' if ok else '**막힘 %d건**' % len(bad)))
        if bad: detail += ['', '## %s (%s)' % (h['name'], hid)] + ['- ' + b for b in bad[:12]] + (['- … 외 %d건' % (len(bad) - 12)] if len(bad) > 12 else [])
        print('%-8s %-14s %s' % (h['name'], h['family'], '준비됨' if ok else '막힘 %d건: %s' % (len(bad), bad[0][:90])))
    lines += ['', '준비됨 %d명 (약 %d회분), 막힘 %d명.' % (ready, round(ready * 72.3), stuck)] + detail
    out = os.path.join(sm.WORK, 'out', 'pixellab-preflight'); os.makedirs(out, exist_ok=True)
    open(os.path.join(out, 'SWEEP.md'), 'w', encoding='utf-8', newline='\n').write('\n'.join(lines) + '\n')
    print('\n준비됨 %d명, 막힘 %d명 -> %s' % (ready, stuck, os.path.join(out, 'SWEEP.md')))
