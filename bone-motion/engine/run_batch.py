"""Several heroes at once, keeping all ten PixelLab job slots busy (run_hero.py does one hero and leaves slots empty).

    python -X utf8 bone-motion/engine/run_batch.py idle <id> <id> ...               estimate, idle x3 views, pick, breathing idle
    python -X utf8 bone-motion/engine/run_batch.py rest <id> ... [--clips a1,b2]    the other clips (or only the named ones)
    python -X utf8 bone-motion/engine/run_batch.py finish <id> ...                  clean-up, clips.json, preview GIF

PixelLab refuses an eleventh running job (429). Jobs are therefore submitted in one stream across heroes: when a
submission is refused the script collects whatever has finished and tries again, so a slot is refilled as soon as it frees.
Every check run_hero.py makes before paying is made here too, for all heroes, BEFORE the first submission.
A clip/view that already has a job is never submitted twice, so any stage can be run again after an interruption.
"""
import itertools, json, os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm, pixellab as pl, run_hero as rh, variety

VIEWS = rh.VIEWS
def out(hero, *p): return os.path.join(sm.WORK, 'out', 'pixellab', hero, *p)
def has_job(hero, clip, view): return os.path.exists(out(hero, clip, view, 'job.json'))

def collect(heroes):
    n = 0
    for h in heroes:
        if os.path.isdir(out(h)): n += pl.fetch(h)
    return n

def stream(heroes, jobs):
    """jobs: (hero, clip, view). Submit all, refilling slots as they free; then wait for the last ones."""
    todo = [j for j in jobs if not has_job(*j)]; print('제출할 작업 %d건 (이미 있는 %d건 제외)' % (len(todo), len(jobs) - len(todo)), flush=True)
    for hero, clip, view in todo:
        while True:
            try: pl.animate(hero, clip, view); break
            except SystemExit as e:
                if '429' not in str(e): raise
                time.sleep(15); collect(heroes)
    while collect(heroes): time.sleep(15)

def stop_if_blocked(heroes, clips_of):
    bad = []
    for h in heroes: bad += ['%s %s' % (h, x) for x in rh.blocked(h, clips_of(h))]
    if bad: raise SystemExit('제출 전 검사에서 막힘 (아무것도 제출하지 않음):\n  ' + '\n  '.join(bad))

def idle(heroes, pick=12):
    for h in heroes:
        cfg = pl.hero_config(h)
        if not pl.mounted(cfg) and not os.path.exists(os.path.join(sm.WORK, 'art-in', h, 'estimate-front.json')):
            for view in VIEWS:
                im, b64 = pl.art(h, view, base=True); r = pl.call('POST', '/estimate-skeleton', {'image': b64})
                json.dump(r['keypoints'], open(os.path.join(sm.WORK, 'art-in', h, 'estimate-%s.json' % view), 'w', encoding='utf-8'), indent=1)
            print('%s: 뼈대 추정 3건' % h, flush=True)
    need = [h for h in heroes if not all(pl.stage(h, v) == 'guard' for v in VIEWS)]
    stop_if_blocked(need, lambda h: ['idle'])
    stream(heroes, [(h, 'idle', v) for h in need for v in VIEWS])
    for h in need:
        rh.tool('sprite_fix.py', h, 'idle')
        for v in VIEWS: pl.pick(h, v, pick)
    for h in heroes: rh.tool('idle_breath.py', h, 152 if pl.mounted(pl.hero_config(h)) else 196)

def plan(h):
    row = rh.hero_row(h); return row, row['attacks'], row['skillClip']

def rest(heroes, only=None):
    for h in heroes:      # the four clips a player sees must not look alike
        row, order, skill = plan(h); cfg = pl.hero_config(h); four = order + [skill]; tr = {c: variety.track(row['family'], c)[0] for c in four}
        near = min((variety.distance(tr[a], tr[b]), a, b) for a, b in itertools.combinations(four, 2)); limit = 6.0 if (row['family'] == 'caster' or (cfg.get('weapon_length') or 0) < 60) else 9.0
        print('%s: 가장 비슷한 두 클립 %s, %s (%.1fpx, 기준 %.0f)' % (row['name'], near[1], near[2], near[0], limit), flush=True)
        if near[0] < limit and row['family'] != 'bow' and not cfg.get('variety_ok'): raise SystemExit('%s: 클립이 너무 비슷합니다 (%s, %s)' % (row['name'], near[1], near[2]))
    clips_of = lambda h: [c for c in plan(h)[1] + [plan(h)[2], 'move'] if not only or c in only]
    stop_if_blocked(heroes, clips_of)
    stream(heroes, [(h, c, v) for h in heroes for c in clips_of(h) for v in VIEWS])

def finish(heroes):
    for h in heroes:
        row, order, skill = plan(h); clips = order + [skill, 'move']
        missing = [(c, v) for c in clips for v in VIEWS if not os.path.exists(out(h, c, v, '15.png'))]
        if missing: print('%s: 아직 없는 그림 %s' % (row['name'], missing)); continue
        for c in clips: rh.tool('sprite_fix.py', h, c)
        p = os.path.join(sm.WORK, 'art-in', h, 'clips.json'); data = json.load(open(p, encoding='utf-8')) if os.path.exists(p) else {}
        for c in order + [skill]: data.setdefault(c, {})['frames'] = list(range(1, 16))
        ms = 54 if row['family'] == 'caster' else 46
        data['move'] = {'frames': list(range(1, 15)), 'duration_ms': ms, 'note': '15번은 빼고 01~14번만 반복한다.'}; data['order'] = {'attacks': order, 'skill': skill}
        json.dump(data, open(p, 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
        print('%s 미리보기: %s' % (row['name'], rh.preview(h, order, skill, ms)), flush=True)

if __name__ == '__main__':
    stage = sys.argv[1]; args = sys.argv[2:]; only = None
    if '--clips' in args: i = args.index('--clips'); only = args[i + 1].split(','); args = args[:i] + args[i + 2:]
    {'idle': idle, 'finish': finish}.get(stage, lambda hs: rest(hs, only))(args)
    print('잔량:', pl.call('GET', '/balance')['subscription']['generations'], flush=True)
