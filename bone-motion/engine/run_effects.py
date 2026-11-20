"""The 34 battle effects that are made in PixelLab from Codex's reference drawings (art-source/effects/v1/imagegen-handoff-v1).

    python -X utf8 bone-motion/engine/run_effects.py plan                    what would be sent, per effect. Free, sends nothing.
    python -X utf8 bone-motion/engine/run_effects.py submit bolt shield      submit the named effects (the two trial ones first)
    python -X utf8 bone-motion/engine/run_effects.py submit --all            the rest, after the trial was looked at
    python -X utf8 bone-motion/engine/run_effects.py fetch                   collect whatever has finished

Nothing is submitted without the word `submit` (user 2026-11-20: "get the effect requests READY"). An effect that already has
a job.json is never submitted twice. Results go to bone-motion/out/effects/<id>/ (request.json, job.json, frames).

What is sent to /vfx, from the handoff manifest: description = the effect's prompt, sprite = its 128x128 reference drawing,
sprite_frames / sprite_fps = the frames and duration the manifest recommends, artist = lite. The field names are the ones the
API document listed on 2026-11-19 (EFFECT-GUIDE.md); they have NOT been tried yet, which is what the two-effect trial is for:
if the server refuses a field the error is printed and nothing else is sent.
The four `direct` effects (jab, cut, thud, spark) already have finished frames and are not sent.
"""
import base64, json, os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm, pixellab as pl

ROOT = os.path.dirname(sm.WORK); SRC = os.path.join(ROOT, 'art-source', 'effects', 'v1', 'imagegen-handoff-v1'); OUT = os.path.join(sm.WORK, 'out', 'effects')
TRIAL = ('bolt', 'shield')

def effects():
    m = json.load(open(os.path.join(SRC, 'manifest.json'), encoding='utf-8'))
    return [e for e in m.values() if isinstance(e, dict) and e.get('mode') == 'reference']

def request(e):
    frames = int(e.get('recommendedFrames') or 6); fps = max(1, round(frames * 1000.0 / float(e.get('durationMs') or 400)))
    png = open(os.path.join(SRC, e['path'], 'reference.png'), 'rb').read()
    return {'description': open(os.path.join(SRC, e['path'], 'prompt.txt'), encoding='utf-8').read().strip(), 'sprite_frames': frames, 'sprite_fps': fps, 'artist': 'lite',
            'sprite': {'type': 'base64', 'base64': base64.b64encode(png).decode(), 'format': 'png'}}

def plan():
    es = effects(); print('PixelLab으로 만들 이펙트 %d종 (완성 프레임이 있는 4종 제외)' % len(es))
    for e in es:
        r = request(e); done = os.path.exists(os.path.join(OUT, e['id'], 'job.json'))
        print('%-8s %-8s %2d장 %2dfps %4dms  %s%s' % (e['id'], e['name'], r['sprite_frames'], r['sprite_fps'], e['durationMs'], e['role'], '  [제출됨]' if done else ''))
    print('시험 순서: %s 먼저, 확인 뒤 나머지. 견적은 제출 응답의 usage로 확인한다 (문서상 참고 그림을 쓰면 3~28회분/건).' % ', '.join(TRIAL))

def submit(ids):
    for e in effects():
        if e['id'] not in ids: continue
        d = os.path.join(OUT, e['id']); os.makedirs(d, exist_ok=True)
        if os.path.exists(os.path.join(d, 'job.json')): print(e['id'], '이미 제출됨, 건너뜀'); continue
        r = request(e); json.dump(dict(r, sprite='(omitted)'), open(os.path.join(d, 'request.json'), 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
        res = pl.call('POST', '/vfx', r)      # an HTTP error stops here with the server's message; nothing further is sent
        json.dump({k: v for k, v in res.items() if k not in ('images', 'frames', 'image')}, open(os.path.join(d, 'job.json'), 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
        json.dump(res, open(os.path.join(d, 'response.json'), 'w', encoding='utf-8', newline='\n'))
        print(e['id'], '제출:', {k: res[k] for k in res if k in ('background_job_id', 'usage', 'status')}, flush=True)

def fetch():
    for name in sorted(os.listdir(OUT)) if os.path.isdir(OUT) else []:
        p = os.path.join(OUT, name, 'job.json')
        if not os.path.exists(p): continue
        job = json.load(open(p, encoding='utf-8')); jid = job.get('background_job_id')
        if not jid or job.get('status') == 'completed': continue
        res = pl.call('GET', '/background-jobs/' + jid); job['status'] = res.get('status'); json.dump(job, open(p, 'w', encoding='utf-8', newline='\n'), indent=1)
        if res.get('status') == 'completed': json.dump(res, open(os.path.join(OUT, name, 'result.json'), 'w', encoding='utf-8', newline='\n'))
        print(name, res.get('status'), res.get('usage'))

if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'plan'
    if cmd == 'plan': plan()
    elif cmd == 'submit': submit([e['id'] for e in effects()] if '--all' in sys.argv else sys.argv[2:])
    elif cmd == 'fetch': fetch()
