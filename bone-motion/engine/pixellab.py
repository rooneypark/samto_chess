"""PixelLab skeleton animation from the bone motion (animate-with-skeleton-v3, custom rig with the weapon).

    python bone-motion/engine/pixellab.py balance
    python bone-motion/engine/pixellab.py estimate <hero id>             art -> skeleton of the reference pose (0.1 generation per view)
    python bone-motion/engine/pixellab.py animate <hero id> <clip> [view ...]   15 frames per call = 4 generations
    python bone-motion/engine/pixellab.py fetch <hero id>                collect finished jobs

The token is read from %USERPROFILE%/.pixellab/api_key and is never written anywhere else.
Art comes from bone-motion/art-in/<id>/front|side|back.png; results go to bone-motion/out/pixellab/<id>/<clip>/<view>/.
"""
import base64, io, json, math, os, sys, time, urllib.request, urllib.error
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm
from overview import solve

API = 'https://api.pixellab.ai/v2'
ART = {'front': 'front.png', 'left': 'side.png', 'rear': 'back.png'}; DIRECTION = {'front': 'south', 'left': 'west', 'rear': 'north'}
HUMAN = [('NECK', 'neck'), ('NOSE', 'nose'),      # parents before children: the rig is listed in this order
          ('RIGHT SHOULDER', 'shoulder.R'), ('RIGHT ELBOW', 'elbow.R'), ('RIGHT ARM', 'wrist.R'), ('LEFT SHOULDER', 'shoulder.L'), ('LEFT ELBOW', 'elbow.L'),
         ('LEFT ARM', 'wrist.L'), ('RIGHT HIP', 'hip.R'), ('RIGHT KNEE', 'knee.R'), ('RIGHT LEG', 'ankle.R'), ('LEFT HIP', 'hip.L'), ('LEFT KNEE', 'knee.L'), ('LEFT LEG', 'ankle.L')]
PARENT = {'NECK': 'pelvis', 'NOSE': 'NECK', 'RIGHT SHOULDER': 'NECK', 'RIGHT ELBOW': 'RIGHT SHOULDER', 'RIGHT ARM': 'RIGHT ELBOW', 'LEFT SHOULDER': 'NECK', 'LEFT ELBOW': 'LEFT SHOULDER',
          'LEFT ARM': 'LEFT ELBOW', 'RIGHT HIP': 'pelvis', 'RIGHT KNEE': 'RIGHT HIP', 'RIGHT LEG': 'RIGHT KNEE', 'LEFT HIP': 'pelvis', 'LEFT KNEE': 'LEFT HIP', 'LEFT LEG': 'LEFT KNEE'}

def hero_config(hero):
    path = os.path.join(sm.WORK, 'art-in', hero, 'pixellab.json')
    return json.load(open(path, encoding='utf-8'))

def token(): return open(os.path.join(os.path.expanduser('~'), '.pixellab', 'api_key'), encoding='utf-8').read().strip()

def call(method, path, body=None):
    req = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={'Authorization': 'Bearer ' + token(), 'Content-Type': 'application/json', 'User-Agent': 'bone-motion-client'})
    try:
        with urllib.request.urlopen(req, timeout=120) as r: return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        raise SystemExit('HTTP %d %s: %s' % (e.code, path, e.read().decode()[:600]))

def art(hero, view):
    """The reference sprite with stray near-transparent pixels removed, as (image, base64 dict)."""
    im = Image.open(os.path.join(sm.WORK, 'art-in', hero, ART[view])).convert('RGBA'); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            if px[x, y][3] < 24: px[x, y] = (0, 0, 0, 0)
    buf = io.BytesIO(); im.save(buf, 'PNG')
    return im, {'type': 'base64', 'base64': base64.b64encode(buf.getvalue()).decode(), 'format': 'png'}

def rig(view, weapon):
    """Humanoid joints plus the weapon. `side` says which limbs are nearer the camera in this view."""
    near = {'left': ('LEFT', 'RIGHT'), 'front': ('LEFT', 'RIGHT'), 'rear': ('RIGHT', 'LEFT')}[view]
    out = [{'name': 'pelvis', 'parent': None, 'side': 'mid'}]
    for label, _ in HUMAN:
        side = 'near' if label.startswith(near[0]) else 'far' if label.startswith(near[1]) else 'mid'
        out.append({'name': label, 'parent': PARENT[label], 'side': side, 'estimate': label})
    if weapon:
        out.append({'name': 'weapon butt', 'parent': 'RIGHT ARM', 'side': 'mid'}); out.append({'name': 'weapon tip', 'parent': 'weapon butt', 'side': 'mid'})
    return out

def key(label, p, near):
    return {'x': round(min(1.0, max(0.0, p[0] / 256.0)), 4), 'y': round(min(1.0, max(0.0, p[1] / 256.0)), 4), 'label': label, 'depth': round(min(255.0, max(0.0, 128.0 + near)), 1)}

def skeleton(j, view, cfg, weapon_ends):
    """One frame of the bone motion as PixelLab keypoints. The weapon is drawn at the ART's length: the tip stays where
    the bone puts it and the shaft is extended behind the hand; near the guard the hand goes back to the art's grip."""
    out = []; P = lambda v: sm.project(view, v)
    pel = P(j['pelvis']); out.append(key('pelvis', pel, pel[2]))
    for label, name in HUMAN:
        p = P(j[name]); out.append(key(label, p, p[2]))
    if weapon_ends:
        butt, tip = j[weapon_ends[0]], j[weapon_ends[1]]; axis = sm.unit(sm.sub(tip, butt)); length = cfg['weapon_length']
        rear = j['hand.' + cfg.get('rear_hand', 'R')]; reach = sm.length(sm.sub(tip, rear))                 # the bone's tip distance from the rear hand
        grip_art = cfg['weapon_grip']; grip_far = length - reach                                             # art's grip, and the grip that keeps the bone's tip
        guard = cfg['_guard_rear']; w = min(1.0, sm.length(sm.sub(rear, guard)) / 14.0)                       # 0 at the guard, 1 once the hand has left it
        grip = grip_art + (grip_far - grip_art) * w
        if axis[2] > 0.05: grip = min(grip, max(grip_art * 0.6, (rear[2] - 3.0) / axis[2]))                  # never push the butt into the ground
        b = sm.sub(rear, sm.mul(axis, grip)); t = sm.add(b, sm.mul(axis, length))
        if cfg.get('weapon_mode') == 'forward': b, t = butt, sm.add(butt, sm.mul(axis, length))      # grip as the bone has it, extra length goes out in front
        if cfg.get('weapon_mode') == 'bone': b, t = butt, tip      # the bone's own weapon: short behind the hand, long in front (user review: the thrust must read)
        for label, v in (('weapon butt', b), ('weapon tip', t)):
            p = P(v); out.append(key(label, p, p[2]))
    return out

def frames_for(hero, clip_id, view):
    cfg = hero_config(hero); m, clip, rig_, frames = solve(cfg['family'], clip_id)
    if os.environ.get('PIXELLAB_WEAPON'): cfg['weapon_mode'] = os.environ['PIXELLAB_WEAPON']
    g = solve(cfg['family'], 'idle')[3][0]; cfg['_guard_rear'] = g['hand.' + cfg.get('rear_hand', 'R')]
    ends = rig_.weapon_ends if cfg.get('weapon_length') else None
    return cfg, clip, [skeleton(j, view, cfg, ends) for j in frames], skeleton(g, view, cfg, ends)

def first_frame(hero, view, cfg, bone_guard):
    """Keypoints of the pose the ART is in: the estimate where there is one, the bone guard elsewhere, the measured weapon."""
    path = os.path.join(sm.WORK, 'art-in', hero, 'estimate-%s.json' % view); by = {k['label']: k for k in bone_guard}
    if os.path.exists(path):
        est = {k['label']: k for k in json.load(open(path, encoding='utf-8'))}
        for label, _ in HUMAN:
            if label in est: by[label] = dict(by[label], x=round(est[label]['x'], 4), y=round(est[label]['y'], 4))
        if 'RIGHT HIP' in est and 'LEFT HIP' in est:
            by['pelvis'] = dict(by['pelvis'], x=round((est['RIGHT HIP']['x'] + est['LEFT HIP']['x']) / 2, 4), y=round((est['RIGHT HIP']['y'] + est['LEFT HIP']['y']) / 2, 4))
    # A hand or elbow hidden behind the body cannot be estimated from the drawing: the estimate guesses. For those the
    # bone's position is used, moved by the same amount the visible torso differs.
    bone = {k['label']: k for k in bone_guard}; core = [l for l in ('NECK', 'pelvis', 'RIGHT SHOULDER', 'LEFT SHOULDER', 'RIGHT HIP', 'LEFT HIP') if l in by]
    dx = sum(by[l]['x'] - bone[l]['x'] for l in core) / len(core); dy = sum(by[l]['y'] - bone[l]['y'] for l in core) / len(core)
    for label in ('RIGHT ELBOW', 'RIGHT ARM', 'LEFT ELBOW', 'LEFT ARM'):
        if bone[label]['depth'] < bone['pelvis']['depth'] - 3.0:
            by[label] = dict(bone[label], x=round(bone[label]['x'] + dx, 4), y=round(bone[label]['y'] + dy, 4))
    for label in ('weapon butt', 'weapon tip'):
        m = cfg.get('art_weapon', {}).get(view, {}).get(label)
        if m and label in by: by[label] = dict(by[label], x=round(m[0] / 256.0, 4), y=round(m[1] / 256.0, 4))
    return [by[k['label']] for k in bone_guard]

TAG = os.environ.get('PIXELLAB_TAG', '')      # a trial run goes to <clip>__<tag>/ and is not packed for the simulator

def retarget(motion, guard, first):
    """Carry the bone motion over to the art's proportions: every joint keeps the offset it has between the bone's guard
    and the pose the art is actually drawn in. The weapon moves with the rear hand so its length is untouched."""
    d = {g['label']: (f['x'] - g['x'], f['y'] - g['y']) for g, f in zip(guard, first)}
    for k in ('weapon butt', 'weapon tip'):
        if k in d: d[k] = d['RIGHT ARM']
    clamp = lambda v: round(min(1.0, max(0.0, v)), 4)
    return [[dict(k, x=clamp(k['x'] + d[k['label']][0]), y=clamp(k['y'] + d[k['label']][1])) for k in frame] for frame in motion]

def prepared(hero, clip_id, view):
    """Everything one call needs: (config, clip, first-frame keypoints on the art, motion keypoints fitted to the art)."""
    cfg, clip, motion, guard = frames_for(hero, clip_id, view); first = first_frame(hero, view, cfg, guard)
    return cfg, clip, first, retarget(motion, guard, first)

def out_dir(hero, clip_id, view):
    d = os.path.join(sm.WORK, 'out', 'pixellab', hero, clip_id + ('__' + TAG if TAG else ''), view); os.makedirs(d, exist_ok=True); return d

def animate(hero, clip_id, view):
    cfg, clip, first, motion = prepared(hero, clip_id, view); im, b64 = art(hero, view)
    body = {'description': cfg['description'], 'action': cfg['actions'].get(clip_id, clip['title']), 'direction': DIRECTION[view], 'view': 'low top-down', 'first_frame': b64,
            'first_frame_keypoints': first, 'keypoints': motion, 'rig': rig(view, bool(cfg.get('weapon_length'))), 'template_id': 'mannequin', 'no_background': True}
    d = out_dir(hero, clip_id, view)
    with open(os.path.join(d, 'request.json'), 'w', encoding='utf-8') as f: json.dump(dict(body, first_frame='(omitted)'), f, ensure_ascii=False, indent=1)
    r = call('POST', '/animate-with-skeleton-v3', body)
    with open(os.path.join(d, 'job.json'), 'w', encoding='utf-8') as f: json.dump(r, f)
    print('submitted', hero, clip_id, view, r.get('background_job_id'), r.get('usage')); return r

def fetch(hero, wait=False):
    base = os.path.join(sm.WORK, 'out', 'pixellab', hero); pending = 0
    for clip_id in sorted(os.listdir(base)):
        for view in sorted(os.listdir(os.path.join(base, clip_id))):
            d = os.path.join(base, clip_id, view); jp = os.path.join(d, 'job.json')
            if not os.path.exists(jp) or os.path.exists(os.path.join(d, '15.png')) or os.path.exists(os.path.join(d, 'failed.txt')): continue
            job = json.load(open(jp))['background_job_id']; r = call('GET', '/background-jobs/' + job); status = r.get('status')
            if status == 'completed':
                images = (r.get('last_response') or {}).get('images') or []
                clip = solve(hero_config(hero)['family'], clip_id.split('__')[0])[1]; ims = []
                for i, im in enumerate(images):
                    raw = base64.b64decode(im['base64'] if isinstance(im, dict) else im); open(os.path.join(d, '%02d.png' % (i + 1)), 'wb').write(raw); ims.append(Image.open(io.BytesIO(raw)).convert('RGBA'))
                if ims:
                    bg = [Image.alpha_composite(Image.new('RGBA', x.size, (40, 48, 62, 255)), x).resize((512, 512), Image.NEAREST).convert('P', palette=Image.ADAPTIVE) for x in ims]
                    bg[0].save(os.path.join(d, 'preview.gif'), save_all=True, append_images=bg[1:], duration=clip['durations'][:len(bg)], loop=0)
                print('done', clip_id, view, len(images), 'frames')
            elif status == 'failed':
                open(os.path.join(d, 'failed.txt'), 'w', encoding='utf-8').write(json.dumps(r, ensure_ascii=False)[:2000]); print('FAILED', clip_id, view, json.dumps(r, ensure_ascii=False)[:300])
            else: pending += 1; print('waiting', clip_id, view, status)
    return pending

if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'balance': print(call('GET', '/balance'))
    elif cmd == 'estimate':
        hero = sys.argv[2]
        for view in ART:
            im, b64 = art(hero, view); r = call('POST', '/estimate-skeleton', {'image': b64})
            json.dump(r['keypoints'], open(os.path.join(sm.WORK, 'art-in', hero, 'estimate-%s.json' % view), 'w', encoding='utf-8'), indent=1); print(view, len(r['keypoints']), 'joints', r.get('usage'))
    elif cmd == 'animate':
        hero, clip_id = sys.argv[2], sys.argv[3]
        for view in sys.argv[4:] or list(ART): animate(hero, clip_id, view)
    elif cmd == 'fetch':
        hero = sys.argv[2]
        while fetch(hero) and '--wait' in sys.argv: time.sleep(20)
