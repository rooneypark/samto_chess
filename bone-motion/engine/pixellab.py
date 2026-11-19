"""PixelLab skeleton animation from the bone motion (animate-with-skeleton-v3, custom rig with the weapon).

    python bone-motion/engine/pixellab.py balance
    python bone-motion/engine/pixellab.py estimate <hero id>             base-pose art -> its skeleton (front and side, 0.1 generation each)
    python bone-motion/engine/pixellab.py animate <hero id> idle [view ...]     step 1: base-pose art + the bone's guard -> 전투 대기 (4 generations per view)
    python bone-motion/engine/pixellab.py pick <hero id> <view> <frame>         step 2: that frame becomes the start image of every other clip
    python bone-motion/engine/pixellab.py animate <hero id> <clip> [view ...]   step 3: move, attacks, skill from the picked guard image

The order is the user's decision (2026-11-18): the art is an easy base pose (arms a little out, weapon in one hand); PixelLab
turns it into the fighting guard using the bone; the guard picture it returns is then the first frame of everything else.
    python bone-motion/engine/pixellab.py fetch <hero id>                collect finished jobs
    python bone-motion/engine/pixellab.py preflight <hero id> [clip ...]  free local check before any paid call (report + overlays)

Lessons from the Zhang Fei run (docs/2026-11-19-zhangfei-motion-handoff.md) that are built in here:
  - rear view has no NOSE joint: the head point is 'back of skull', and the face is never estimated from a back view
  - description/action are assembled per view; face words in a rear request stop the submission
  - toe joints are sent so the shoe direction is constrained, not only the ankle
  - a clip/view that already has a job is not submitted again (pass --again to override)
  - cloth that should move (headband tails, sleeves, a collar, a cape, a plume) is listed under "streamers" in pixellab.json;
    each one becomes rig joints that trail behind the motion and sway in the idle, and the action text says so
  - side_offset in pixellab.json moves the side art and every side keypoint together, and nothing is clamped before the move

The token is read from %USERPROFILE%/.pixellab/api_key and is never written anywhere else.
Art comes from bone-motion/art-in/<id>/front|side|back.png; results go to bone-motion/out/pixellab/<id>/<clip>/<view>/.
"""
import base64, io, json, math, os, sys, time, urllib.request, urllib.error
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm
from overview import solve
import rear

def plain(j):
    """A mounted bone names the rider r_neck, r_wrist.L ...: give those the foot soldier's names too, so one request
    builder serves both. The horse keeps its h_ names."""
    return dict(j, **{k[2:]: v for k, v in j.items() if k.startswith('r_')}) if 'r_pelvis' in j else j

def solve_view(family, clip_id, view):
    """The bone for one camera. From behind, a bladed guard is squared to the back drawing (rear.py); front and side are the confirmed bone."""
    m, clip, rig_, frames = rear.solve(family, clip_id)[:4] if (view == 'rear' and rear.needed(family)) else solve(family, clip_id)
    return m, clip, rig_, [plain(j) for j in frames]

# ---- the horse (기마) -------------------------------------------------------------------------------------------------
# Rider and horse are one rig with one root, the horse's body. The rider's pelvis hangs from it, so when the horse rears
# the rider goes with it. Legs are sent down to the hoof: four joints per leg, or the model cannot tell a knee from a hock.
def _leg(prefix, label, top, mid, low):
    out = []; chain = [(top, 'horse body'), (mid, None), (low, None), ('fetlock', None), ('hoof', None)]
    names = {'h_fore_shoulder': 'shoulder', 'h_fore_elbow': 'elbow', 'h_fore_knee': 'knee', 'h_hind_hip': 'hip', 'h_hind_stifle': 'stifle', 'h_hind_hock': 'hock'}
    for side, word in (('L', 'left'), ('R', 'right')):
        prev = 'horse body'
        for part, _ in chain:
            joint = (part if part.startswith('h_') else prefix + '_' + part) + '.' + side
            name = 'horse %s %s %s' % (label, word, names.get(part, part)); out.append((name, joint, prev)); prev = name
    return out
HORSE = [('horse chest', 'h_chest', 'horse body'), ('horse withers', 'h_withers', 'horse chest'), ('horse neck', 'h_neck_mid', 'horse withers'), ('horse poll', 'h_poll', 'horse neck'),
         ('horse muzzle', 'h_muzzle', 'horse poll'), ('horse croup', 'h_croup', 'horse body'), ('horse tail root', 'h_tail_root', 'horse croup'), ('horse tail tip', 'h_tail_tip', 'horse tail root')] \
        + _leg('h_fore', 'front', 'h_fore_shoulder', 'h_fore_elbow', 'h_fore_knee') + _leg('h_hind', 'hind', 'h_hind_hip', 'h_hind_stifle', 'h_hind_hock')
def mounted(cfg): return str((cfg or {}).get('family', '')).startswith('mounted')

API = 'https://api.pixellab.ai/v2'
ART = {'front': 'front.png', 'left': 'side.png', 'rear': 'back.png'}; DIRECTION = {'front': 'south', 'left': 'west', 'rear': 'north'}
BODY = [('RIGHT SHOULDER', 'shoulder.R'), ('RIGHT ELBOW', 'elbow.R'), ('RIGHT ARM', 'wrist.R'), ('LEFT SHOULDER', 'shoulder.L'), ('LEFT ELBOW', 'elbow.L'),
        ('LEFT ARM', 'wrist.L'), ('RIGHT HIP', 'hip.R'), ('RIGHT KNEE', 'knee.R'), ('RIGHT LEG', 'ankle.R'), ('LEFT HIP', 'hip.L'), ('LEFT KNEE', 'knee.L'), ('LEFT LEG', 'ankle.L'),
        ('RIGHT TOE', 'toe.R'), ('LEFT TOE', 'toe.L')]      # toes: an ankle alone does not tell the shoe which way to point
SKULL = 'back of skull'; ESTIMATED = {'NECK', 'NOSE'} | {l for l, _ in BODY if 'TOE' not in l}
def human(view):
    """Joints sent for this view, parents before children. From behind the head point is the back of the skull:
    naming the back of the head NOSE made the model turn the face toward the camera."""
    return [('NECK', 'neck'), (SKULL, 'skull') if view == 'rear' else ('NOSE', 'nose')] + BODY
def with_skull(j):
    h, n = j['head'], j['nose']; return dict(j, skull=tuple(h[i] + (h[i] - n[i]) * 0.6 for i in range(3)))
PARENT = {'NECK': 'pelvis', 'NOSE': 'NECK', SKULL: 'NECK', 'RIGHT TOE': 'RIGHT LEG', 'LEFT TOE': 'LEFT LEG', 'RIGHT SHOULDER': 'NECK', 'RIGHT ELBOW': 'RIGHT SHOULDER', 'RIGHT ARM': 'RIGHT ELBOW', 'LEFT SHOULDER': 'NECK', 'LEFT ELBOW': 'LEFT SHOULDER',
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

def shift_of(cfg, view):
    """(dx, dy) in px: where the drawing and all its keypoints are placed on the 256 canvas, away from the usual foot point
    (128, 224). `canvas_offset` {view: [dx, dy]} is written by fit_canvas.py when a weapon longer than the bone's would
    leave the canvas; `side_offset` is the older side-only form (Zhang Fei, Xiahou Dun). The game draws the sprite by
    its pivot (128 + dx, 224 + dy), so the character does not move on the board."""
    if view in cfg.get('canvas_offset', {}): return tuple(float(v) for v in cfg['canvas_offset'][view])
    return (float(cfg.get('side_offset', 0)) if view == 'left' else 0.0, 0.0)

def guard_art(hero, view): return os.path.join(sm.WORK, 'art-in', hero, 'guard-%s.png' % view)      # the picked 전투 대기 frame
def stage(hero, view): return 'guard' if os.path.exists(guard_art(hero, view)) else 'base'

def art(hero, view, shift=(0.0, 0.0), base=False):
    """The reference sprite with stray near-transparent pixels removed, as (image, base64 dict). `shift` moves the
    drawing right on the canvas (side view of a long weapon); the keypoints get the same shift in prepared()."""
    own = hero_config(hero).get('art', {}).get(view) if os.path.exists(os.path.join(sm.WORK, 'art-in', hero, 'pixellab.json')) else None      # an edited copy of the drawing (shorten_shaft.py); the approved original stays as it is
    path = guard_art(hero, view) if (not base and os.path.exists(guard_art(hero, view))) else os.path.join(sm.WORK, 'art-in', hero, own or ART[view])
    im = Image.open(path).convert('RGBA'); px = im.load()
    if im.size != (256, 256): raise RuntimeError('%s 는 %dx%d 입니다. 256x256 원화가 필요합니다' % (path, im.width, im.height))
    for y in range(im.height):
        for x in range(im.width):
            if px[x, y][3] < 24: px[x, y] = (0, 0, 0, 0)
    if shift and tuple(shift) != (0.0, 0.0):
        moved = Image.new('RGBA', im.size, (0, 0, 0, 0)); moved.paste(im, (int(round(shift[0])), int(round(shift[1])))); im = moved
    buf = io.BytesIO(); im.save(buf, 'PNG')
    return im, {'type': 'base64', 'base64': base64.b64encode(buf.getvalue()).decode(), 'format': 'png'}

def rig(view, weapon, cfg=None):
    """Humanoid joints plus the weapon. `side` says which limbs are nearer the camera in this view."""
    near = {'left': ('LEFT', 'RIGHT'), 'front': ('LEFT', 'RIGHT'), 'rear': ('RIGHT', 'LEFT')}[view]
    horse = mounted(cfg)
    out = [{'name': 'horse body', 'parent': None, 'side': 'mid'}, {'name': 'pelvis', 'parent': 'horse body', 'side': 'mid'}] if horse else [{'name': 'pelvis', 'parent': None, 'side': 'mid'}]
    if horse:
        for name, _, parent in HORSE:
            side = 'mid' if not (' left ' in name or ' right ' in name) else 'near' if (' ' + near[0].lower() + ' ') in name else 'far'
            out.append({'name': name, 'parent': parent, 'side': side})
    for label, _ in human(view):
        side = 'near' if label.startswith(near[0]) else 'far' if label.startswith(near[1]) else 'mid'
        out.append(dict({'name': label, 'parent': PARENT[label], 'side': side}, **({'estimate': label} if label in ESTIMATED else {})))
    if weapon:
        out.append({'name': 'weapon butt', 'parent': 'RIGHT ARM', 'side': 'mid'}); out.append({'name': 'weapon tip', 'parent': 'weapon butt', 'side': 'mid'})
    return out + streamer_rig(cfg or {})

# ---- cloth that follows the motion ---------------------------------------------------------------------------------
# pixellab.json:  "streamers": [{"name": "headband tail", "attach": "head", "root": [-6, -7, 2], "hang": [-4, -10, -12], "sway": 2.5}]
#   attach  bone joint it is tied to (head, neck, chest, pelvis, wrist.L ...)      root  offset of the knot from that joint
#   hang    where the free end rests, from the knot (x = character's left, y = forward, z = up)      sway  idle breeze in px
# In the idle the cloth does not move by itself: the body only breathes, and wind in a standing pose read as a storm.
# In every clip where the body moves, the free end is not animated by hand: it chases its rest place with a lag, so it trails behind every move of the body
# and overshoots when the body stops. Zhang Fei's headband never moved because nothing asked it to (user review 2026-11-19).
ATTACH = {'head': 'NECK', 'neck': 'NECK', 'chest': 'NECK', 'pelvis': 'pelvis', 'wrist.L': 'LEFT ARM', 'wrist.R': 'RIGHT ARM', 'shoulder.L': 'LEFT SHOULDER', 'shoulder.R': 'RIGHT SHOULDER'}

def streamers(frames, cfg, loop, running=False, still=False):
    """-> per frame {label: 3D point} for every streamer (knot, middle, free end)."""
    out = [dict() for _ in frames]
    for n, st in enumerate(cfg.get('streamers', [])):
        name = st['name']; root = tuple(st.get('root', (0, 0, 0))); hang = tuple(st['hang']); L = sm.length(hang); sway = st.get('sway', 2.0); lag = st.get('lag', 0.45)
        if still:      # 대기: the body only breathes, so cloth hangs where it rests and rides the body rigidly. No breeze (user decision 2026-11-19)
            for i, j in enumerate(frames):
                k = sm.add(j[st['attach']], root); tip = sm.add(k, hang)
                out[i] = dict(out[i], **{name + ' root': k, name + ' mid': sm.add(sm.add(k, sm.mul(hang, 0.5)), (0.0, 0.0, -L * 0.08)), name + ' tip': tip})
            continue
        knot = lambda j: sm.add(j[st['attach']], root)
        tip = sm.add(knot(frames[0]), hang); vel = (0.0, 0.0, 0.0); N = len(frames)
        for turn in range(2 if loop else 1):      # a loop is run twice so its last frame leads into its first
            for i, j in enumerate(frames):
                k = knot(j); phase = 2 * math.pi * (i / float(N)) + n * 1.7
                rest = sm.add(sm.add(k, hang), (sway * math.sin(phase), sway * 0.6 * math.cos(phase), 0.0))      # light breeze, always there
                if running: rest = sm.add(rest, (0.0, -L * 0.7, L * 0.45 + 1.5 * math.sin(2 * phase)))      # a run in place: the wind of the run blows it back and it flaps with the steps
                vel = sm.add(sm.mul(vel, 0.55), sm.mul(sm.sub(rest, tip), lag)); tip = sm.add(tip, vel)
                d = sm.sub(tip, k); dist = sm.length(d) or 1.0
                tip = sm.add(k, sm.mul(d, L / dist))      # cloth does not stretch
                if tip[2] > k[2] + L * 0.35: tip = (tip[0], tip[1], k[2] + L * 0.35)      # and does not stand straight up
                mid = sm.add(sm.add(k, sm.mul(sm.sub(tip, k), 0.5)), (0.0, 0.0, -L * 0.08))
                out[i] = dict(out[i], **{name + ' root': k, name + ' mid': mid, name + ' tip': tip})
    return out

def streamer_rig(cfg):
    out = []
    for st in cfg.get('streamers', []):
        n = st['name']; out += [{'name': n + ' root', 'parent': ATTACH.get(st['attach'], 'NECK'), 'side': 'mid'}, {'name': n + ' mid', 'parent': n + ' root', 'side': 'mid'}, {'name': n + ' tip', 'parent': n + ' mid', 'side': 'mid'}]
    return out

def key(label, p, near):
    return {'x': round(p[0] / 256.0, 4), 'y': round(p[1] / 256.0, 4), 'label': label,      # not clamped here: see prepared()
            'depth': round(min(255.0, max(0.0, 128.0 + near)), 1)}

def skeleton(j, view, cfg, weapon_ends, cloth=None):
    """One frame of the bone motion as PixelLab keypoints. The weapon is drawn at the ART's length: the tip stays where
    the bone puts it and the shaft is extended behind the hand; near the guard the hand goes back to the art's grip."""
    out = []; P = lambda v: sm.project(view, v); j = with_skull(j)
    if mounted(cfg):
        p = P(j['h_body_root']); out.append(key('horse body', p, p[2]))
    pel = P(j['pelvis']); out.append(key('pelvis', pel, pel[2]))
    if mounted(cfg):
        for name, joint, _ in HORSE:
            p = P(j[joint]); out.append(key(name, p, p[2]))
    for label, name in human(view):
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
    for label, v in (cloth or {}).items():
        p = P(v); out.append(key(label, p, p[2]))
    return out

def frames_for(hero, clip_id, view):
    cfg = hero_config(hero); m, clip, rig_, frames = solve_view(cfg['family'], clip_id, view)
    cfg['_scale'] = body_scale(hero, cfg, rig_)
    for k in ('weapon_length', 'weapon_grip'):      # the art's weapon is measured in art pixels; the body is scaled afterwards
        if cfg.get(k): cfg[k] = cfg[k] / cfg['_scale']
    if os.environ.get('PIXELLAB_WEAPON'): cfg['weapon_mode'] = os.environ['PIXELLAB_WEAPON']
    g = solve_view(cfg['family'], 'idle', view)[3][0]; cfg['_guard_rear'] = g['hand.' + cfg.get('rear_hand', 'R')]
    ends = rig_.weapon_ends if cfg.get('weapon_length') else None
    cloth = streamers(frames, cfg, bool(clip.get('treadmill')), bool(clip.get('treadmill')), still=(clip_id == 'idle')); rest = streamers([g], cfg, False)[0]
    return cfg, clip, [skeleton(j, view, cfg, ends, c) for j, c in zip(frames, cloth)], skeleton(g, view, cfg, ends, rest)

STAND = dict(pelvis=None, hip_turn=0, hip_lean=0, chest_turn=0, chest_lean=2)      # the base pose the art is drawn in

def base_joints(rig_):
    """The bone standing in the art's base pose: square to the front, feet side by side, arms hanging a little out."""
    if not hasattr(rig_, 'body'): raise RuntimeError('mounted')      # a mounted base pose is the mounted guard: see base_keypoints
    body = rig_.body; p = dict(STAND, pelvis=(0, 0, body.stand))
    p['foot.L'] = dict(at=(9, 0), yaw=-6, heel=0, air=0); p['foot.R'] = dict(at=(-9, 0), yaw=6, heel=0, air=0)
    return with_skull(body.solve(p, None)[0])

def estimate_of(hero, view):
    path = os.path.join(sm.WORK, 'art-in', hero, 'estimate-%s.json' % view)
    return {k['label']: k for k in json.load(open(path, encoding='utf-8'))} if os.path.exists(path) else None

def swap_sides(est):
    flip = lambda l: l.replace('LEFT', '#').replace('RIGHT', 'LEFT').replace('#', 'RIGHT')
    return {flip(l): dict(k, label=flip(l)) for l, k in est.items()}

def rear_estimate(hero):
    """Body joints of the back drawing. The estimate is used for the body only (its NOSE lands on the back of the head and
    is dropped; the head point is the skull, computed from the neck). Seen from behind the character's right arm is on
    the right of the picture: if the estimate read the back as a front and put RIGHT on the left, the names are swapped.
    Without a rear estimate the front one is mirrored, which is exact for a symmetric standing pose drawn at the same size."""
    est = estimate_of(hero, 'rear')
    if est:
        est = {l: k for l, k in est.items() if l != 'NOSE'}
        if all(l in est for l in ('RIGHT SHOULDER', 'LEFT SHOULDER')) and est['RIGHT SHOULDER']['x'] < est['LEFT SHOULDER']['x']: est = swap_sides(est)
        return est
    front = estimate_of(hero, 'front')
    if not front: return None
    mid = (front['RIGHT HIP']['x'] + front['LEFT HIP']['x']) / 2 if 'RIGHT HIP' in front and 'LEFT HIP' in front else 0.5
    return {l: dict(k, x=2 * mid - k['x']) for l, k in front.items() if l != 'NOSE'}

def body_scale(hero, cfg, rig_):
    """Art size against the bone: neck-to-ankle height in the front drawing over the bone's. One number for the whole
    body, all views and all frames, so the proportions the art has are the proportions every frame gets."""
    if cfg.get('body_scale'): return float(cfg['body_scale'])
    if mounted(cfg): return 1.0      # measured on the overlay and set as body_scale; the humanoid estimate is not used on a rider
    est = estimate_of(hero, 'front')
    if not est or not all(l in est for l in ('NECK', 'RIGHT LEG', 'LEFT LEG')): return 1.0
    j = base_joints(rig_); P = lambda v: sm.project('front', v)
    bone = (P(j['ankle.L'])[1] + P(j['ankle.R'])[1]) / 2 - P(j['neck'])[1]
    art_h = ((est['RIGHT LEG']['y'] + est['LEFT LEG']['y']) / 2 - est['NECK']['y']) * 256.0
    return round(max(0.8, min(1.25, art_h / bone)), 3)

GROUND = (128 / 256.0, 224 / 256.0)
def scaled(frame, s): return [dict(k, x=GROUND[0] + (k['x'] - GROUND[0]) * s, y=GROUND[1] + (k['y'] - GROUND[1]) * s) for k in frame]

def base_keypoints(hero, view, cfg, rig_, template):
    """Keypoints of the base-pose ART, in the order of `template`. Front and side come from the skeleton estimate; the
    back view is never estimated (the estimate reads the back of a head as a face) and is the front estimate mirrored,
    which is exact for a symmetric standing pose. Whatever the estimate cannot give (pelvis, toes, skull, weapon, cloth)
    is the standing bone carried onto the estimated joints."""
    s = cfg['_scale']
    # 기마: the base drawing is the rider sitting on the standing horse, which is the mounted guard itself apart from the
    # arms and the weapon. The guard bone is the base; weapon and anything else that differs comes from art_weapon / art_points.
    j = with_skull(solve_view(cfg['family'], 'idle', view)[3][0]) if mounted(cfg) else base_joints(rig_)
    cloth = streamers([j], cfg, False)[0]
    bone = {k['label']: k for k in scaled(skeleton(j, view, dict(cfg, weapon_length=None), None, cloth), s)}
    by = dict(bone); est = None if mounted(cfg) else rear_estimate(hero) if view == 'rear' else estimate_of(hero, view)
    if est:
        for label in ESTIMATED - {'NOSE'} | ({'NOSE'} if view != 'rear' else set()):
            if label in est and label in by: by[label] = dict(by[label], x=est[label]['x'], y=est[label]['y'])
        if 'RIGHT HIP' in est and 'LEFT HIP' in est: by['pelvis'] = dict(by['pelvis'], x=(est['RIGHT HIP']['x'] + est['LEFT HIP']['x']) / 2, y=(est['RIGHT HIP']['y'] + est['LEFT HIP']['y']) / 2)
        hung = {st['name']: ATTACH.get(st['attach'], 'NECK') for st in cfg.get('streamers', [])}      # a sleeve follows the drawing's wrist, a hem its pelvis
        carry = [('RIGHT TOE', 'RIGHT LEG'), ('LEFT TOE', 'LEFT LEG'), (SKULL, 'NECK')] + [(l, hung.get(l.rsplit(' ', 1)[0], 'NECK')) for l in cloth]
        for label, anchor in carry:      # keep the bone's offset from a joint the estimate does know
            if label in by and (anchor in est or anchor == 'pelvis'): by[label] = dict(by[label], x=by[anchor]['x'] + bone[label]['x'] - bone[anchor]['x'], y=by[anchor]['y'] + bone[label]['y'] - bone[anchor]['y'])
    hand = by.get('RIGHT ARM' if cfg.get('rear_hand', 'R') == 'R' else 'LEFT ARM')
    measured = cfg.get('art_weapon', {}).get(view, {}); L = (cfg.get('weapon_length') or 0) * s / 256.0
    for label in ('weapon butt', 'weapon tip'):
        if label not in {k['label'] for k in template}: continue
        if label in measured: x, y = measured[label][0] / 256.0, measured[label][1] / 256.0
        else: x, y = hand['x'], (GROUND[1] if label == 'weapon butt' else GROUND[1] - L)      # not measured: upright beside the hand, butt on the ground
        by[label] = {'x': x, 'y': y, 'label': label, 'depth': hand['depth']}
    off = cfg.get('art_offset', {}).get(view, {})      # the drawing's rider sits a few px off the bone's: {"rider": [dx, dy], "horse": [dx, dy]}
    for label in list(by):
        who = 'horse' if label.startswith('horse') else None if label.startswith('weapon') else 'rider'
        if who in off: by[label] = dict(by[label], x=by[label]['x'] + off[who][0] / 256.0, y=by[label]['y'] + off[who][1] / 256.0)
    for label, m in cfg.get('art_points', {}).get(view, {}).items():
        if label in by: by[label] = dict(by[label], x=m[0] / 256.0, y=m[1] / 256.0)
    return [dict(by[k['label']], label=k['label']) for k in template]

def blend_keys(a, b, t):
    """Between the art's pose and the guard. The weapon turns as a rigid stick instead of shrinking through the middle."""
    out = {k['label']: dict(k, x=k['x'] + (q['x'] - k['x']) * t, y=k['y'] + (q['y'] - k['y']) * t, depth=round(k['depth'] + (q['depth'] - k['depth']) * t, 1)) for k, q in zip(a, b)}
    if 'weapon butt' in out:
        def stick(f):
            f = {k['label']: k for k in f}; bx, by_ = f['weapon butt']['x'], f['weapon butt']['y']; tx, ty = f['weapon tip']['x'], f['weapon tip']['y']
            return (bx + tx) / 2, (by_ + ty) / 2, math.atan2(ty - by_, tx - bx), math.hypot(tx - bx, ty - by_)
        A, B = stick(a), stick(b); da = (B[2] - A[2] + math.pi) % (2 * math.pi) - math.pi
        cx, cy, ang, ln = A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + da * t, A[3] + (B[3] - A[3]) * t
        out['weapon butt'].update(x=cx - math.cos(ang) * ln / 2, y=cy - math.sin(ang) * ln / 2); out['weapon tip'].update(x=cx + math.cos(ang) * ln / 2, y=cy + math.sin(ang) * ln / 2)
    return [out[k['label']] for k in a]

TAG = os.environ.get('PIXELLAB_TAG', '')      # a trial run goes to <clip>__<tag>/ and is not packed for the simulator

def picked(hero, view):
    path = os.path.join(sm.WORK, 'art-in', hero, 'guard.json')
    return (json.load(open(path, encoding='utf-8')) if os.path.exists(path) else {}).get(view)

def prepared(hero, clip_id, view, raw=False):
    """Everything one call needs: (config, clip, first-frame keypoints on the start image, target keypoints).

    stage 'base'  (no guard picture yet, idle only): the start image is the base-pose art. The first frames walk from the
                  art's pose into the guard, the rest is the guard breathing; one of those frames is then picked.
    stage 'guard' the start image is the picked guard frame and its keypoints are the ones it was generated from.

    The side offset is added and the 0..1 clamp comes last: clamping a spear tip that is off the canvas before the shift
    would shorten the spear. raw=True returns the unclamped points for the preflight."""
    cfg, clip, motion, guard = frames_for(hero, clip_id, view); s = cfg['_scale']; dx, dy = (v / 256.0 for v in shift_of(cfg, view))
    motion = [scaled(f, s) for f in motion]; guard = scaled(guard, s)
    if stage(hero, view) == 'guard':
        keep = picked(hero, view); first = [dict(k, x=k['x'] - dx, y=k['y'] - dy) for k in keep['keypoints']] if keep else guard
    else:
        if clip_id != 'idle' and not os.environ.get('PIXELLAB_DRY'): raise RuntimeError('전투 대기 그림이 아직 없습니다. 먼저 idle을 뽑고 pick으로 한 장을 고릅니다 (%s %s)' % (hero, view))
        if clip_id != 'idle': first = guard      # PIXELLAB_DRY: check a clip before any picture exists, as if the guard picture were the bone's guard (sweep.py)
        else:
            rig_ = solve_view(cfg['family'], 'idle', view)[2]; first = base_keypoints(hero, view, cfg, rig_, guard)
            n = int(cfg.get('transition', 4)); motion = [blend_keys(first, motion[0], (i + 1) / float(n + 1)) for i in range(n)] + motion[:len(motion) - n]
    fin = (lambda v: v) if raw else (lambda v: min(1.0, max(0.0, v)))
    fix = lambda frame: [dict(k, x=round(fin(k['x'] + dx), 4), y=round(fin(k['y'] + dy), 4)) for k in frame]
    return cfg, clip, fix(first), [fix(f) for f in motion]

def pick(hero, view, number):
    """Make frame `number` of the generated idle the guard picture for this view, with the keypoints it was drawn from."""
    d = os.path.join(sm.WORK, 'out', 'pixellab', hero, 'idle', view); src = os.path.join(d, '%02d.png' % number)
    if not os.path.exists(src): raise SystemExit('없는 프레임: ' + src)
    req = json.load(open(os.path.join(d, 'request.json'), encoding='utf-8'))
    path = os.path.join(sm.WORK, 'art-in', hero, 'guard.json'); data = json.load(open(path, encoding='utf-8')) if os.path.exists(path) else {}
    data[view] = {'frame': number, 'source': 'out/pixellab/%s/idle/%s/%02d.png' % (hero, view, number), 'keypoints': req['keypoints'][number - 1]}
    json.dump(data, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    Image.open(src).convert('RGBA').save(guard_art(hero, view)); print('전투 대기 확정:', hero, view, '%02d번 ->' % number, guard_art(hero, view))

VIEW_TEXT = {'front': 'Front view.', 'left': 'Left-facing side view.', 'rear': 'STRICT REAR VIEW, seen from directly behind.'}
VIEW_RULE = {'front': 'Fixed south camera, no camera rotation, no effects or afterimages.', 'left': 'Fixed west camera, no camera rotation, no effects or afterimages.',
             'rear': 'Head faces directly away at all times; no eyes, nose, mouth, beard or cheek visible. Torso stays turned away. Fixed north camera, no camera rotation, no effects or afterimages.'}
FACE_WORDS = ('face', 'eye', 'eyes', 'eyebrow', 'eyebrows', 'nose', 'mouth', 'beard', 'bearded', 'mustache', 'moustache', 'whiskers', 'goatee', 'cheek', 'cheeks', 'smile', 'teeth')

def texts(cfg, clip_id, clip, view):
    """(description, action) for one view. `description` is what is seen from every side; `face` is added in front and side
    only; `rear_detail` (hair knot, cape, quiver on the back...) only from behind."""
    parts = [VIEW_TEXT[view], cfg['description'].strip()]
    if view != 'rear' and cfg.get('face'): parts.append(cfg['face'].strip())
    if view == 'rear': parts += [cfg.get('rear_detail', '').strip(), 'Face hidden.']
    act = cfg.get('actions_' + view, {}).get(clip_id) or cfg['actions'].get(clip_id, clip['title'])
    cloth = [st['name'] for st in cfg.get('streamers', [])]
    if cloth:
        names = ', '.join(cloth)
        act = act.strip().rstrip('.') + ('. There is no wind: the %s hang still and only ride the breathing of the body; they do not sway, flutter or billow.' % names if clip_id == 'idle' else
                             '. The %s trail behind every movement with follow-through and settle after the body stops, following their marked points; they stay attached at the root and keep their length.' % names)
    stop = lambda t: t if t.endswith('.') else t + '.'
    return ' '.join(stop(p) for p in parts if p), stop(act.strip()) + ' ' + VIEW_RULE[view]

def face_words(cfg, clip_id, clip):
    """Face words that would reach a rear request (the fixed 'no eyes, nose...' rule is ours and is not counted)."""
    import re
    own = ' '.join([cfg['description'], cfg.get('rear_detail', ''), cfg.get('actions_rear', {}).get(clip_id) or cfg['actions'].get(clip_id, clip['title'])])
    return sorted({w for w in re.findall(r"[a-z]+", own.lower()) if w in FACE_WORDS})

def weapon_hidden(motion):
    """Frames (1-based) in which most of the weapon lies behind the torso as this camera sees it. In those frames the
    model tends to drop the weapon altogether (Liao Hua's side guard, Guan Yu's rising cut, Zhuge Liang's fan)."""
    out = []
    for i, frame in enumerate(motion):
        by = {k['label']: k for k in frame}
        if not all(l in by for l in ('weapon butt', 'weapon tip', 'NECK', 'pelvis')): return []
        a = (by['NECK']['x'] * 256, by['NECK']['y'] * 256); b = (by['pelvis']['x'] * 256, by['pelvis']['y'] * 256); core = (by['NECK']['depth'] + by['pelvis']['depth']) / 2; covered = 0
        for n in range(9):
            t = n / 8.0; x = (by['weapon butt']['x'] + (by['weapon tip']['x'] - by['weapon butt']['x']) * t) * 256; y = (by['weapon butt']['y'] + (by['weapon tip']['y'] - by['weapon butt']['y']) * t) * 256
            depth = by['weapon butt']['depth'] + (by['weapon tip']['depth'] - by['weapon butt']['depth']) * t
            ax, ay = b[0] - a[0], b[1] - a[1]; L = ax * ax + ay * ay or 1.0; u = max(0.0, min(1.0, ((x - a[0]) * ax + (y - a[1]) * ay) / L))
            if math.hypot(x - a[0] - ax * u, y - a[1] - ay * u) < 11.0 and depth < core - 2.0: covered += 1
        if covered >= 6: out.append(i + 1)
    return out

def weapon_far_side(motion):
    """True when the weapon is on the far side of the body for most of the clip in this view (a right-hand weapon seen
    from the character's left). Measured on the three heroes that lost their weapon for a few frames: the bone cannot tell
    WHICH frames the model will drop it in, only that this is the view where it happens. So the request always says so."""
    far = 0
    for frame in motion:
        by = {k['label']: k for k in frame}
        if not all(l in by for l in ('weapon butt', 'weapon tip', 'NECK', 'pelvis')): return False
        core = (by['NECK']['depth'] + by['pelvis']['depth']) / 2
        if (by['weapon butt']['depth'] + by['weapon tip']['depth']) / 2 < core - 2.0: far += 1
    return far >= len(motion) * 0.6

def spans(frames):
    out = []
    for f in frames:
        if out and f == out[-1][1] + 1: out[-1][1] = f
        else: out.append([f, f])
    return ', '.join('%d-%d' % (a, b) if a != b else str(a) for a, b in out)

def out_dir(hero, clip_id, view):
    d = os.path.join(sm.WORK, 'out', 'pixellab', hero, clip_id + ('__' + TAG if TAG else ''), view); os.makedirs(d, exist_ok=True); return d

def animate(hero, clip_id, view, again=False):
    cfg, clip, first, motion = prepared(hero, clip_id, view)
    im, b64 = art(hero, view, (0.0, 0.0) if stage(hero, view) == 'guard' else shift_of(cfg, view))      # a picked guard frame is already shifted
    d = out_dir(hero, clip_id, view)
    if os.path.exists(os.path.join(d, 'job.json')) and not again:
        raise SystemExit('이미 제출한 작업이 있습니다: %s. fetch로 조회하세요. 다시 제출하려면 --again.' % d)
    if view == 'rear' and face_words(cfg, clip_id, clip):
        raise SystemExit('후면 요청에 얼굴 단어가 들어 있습니다: %s. description에서 face 항목으로 옮기세요.' % ', '.join(face_words(cfg, clip_id, clip)))
    description, action = texts(cfg, clip_id, clip, view)
    hidden = weapon_hidden(motion)
    if len(hidden) >= 2:      # say it, or the weapon is simply left out of those frames
        action += ' In frames %s the weapon passes behind the body: only the covered part is hidden, the rest of it stays clearly drawn past the body outline. The weapon is never removed and the hand is never empty.' % spans(hidden)
    if weapon_far_side(motion):
        action += ' The weapon is in the hand on the far side of the body in this view. It is still drawn in EVERY frame: the part that sticks out past the body outline is always visible. Never draw that hand empty, never leave the weapon out.'
    if stage(hero, view) == 'base':
        n = int(cfg.get('transition', 4))
        action = ('From the supplied neutral standing pose, move smoothly into the fighting guard over frames 1-%d: %s. Then hold the guard, breathing, frames %d-15. ' % (n, cfg.get('guard_action', 'both hands come to the weapon and the knees bend'), n + 1)) + action
    body = {'description': description, 'action': action, 'direction': DIRECTION[view], 'view': 'low top-down', 'first_frame': b64,
            'first_frame_keypoints': first, 'keypoints': motion, 'rig': rig(view, bool(cfg.get('weapon_length')), cfg), 'template_id': 'mannequin', 'no_background': True}
    with open(os.path.join(d, 'request.json'), 'w', encoding='utf-8') as f: json.dump(dict(body, first_frame='(omitted)'), f, ensure_ascii=False, indent=1)
    r = call('POST', '/animate-with-skeleton-v3', body)
    with open(os.path.join(d, 'job.json'), 'w', encoding='utf-8') as f: json.dump(r, f)
    print('submitted', hero, clip_id, view, r.get('background_job_id'), r.get('usage')); return r

def fetch(hero, wait=False):
    base = os.path.join(sm.WORK, 'out', 'pixellab', hero); pending = 0
    for clip_id in sorted(c for c in os.listdir(base) if os.path.isdir(os.path.join(base, c))):
        for view in sorted(v for v in os.listdir(os.path.join(base, clip_id)) if os.path.isdir(os.path.join(base, clip_id, v))):
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
            im, b64 = art(hero, view, base=True); r = call('POST', '/estimate-skeleton', {'image': b64})
            json.dump(r['keypoints'], open(os.path.join(sm.WORK, 'art-in', hero, 'estimate-%s.json' % view), 'w', encoding='utf-8'), indent=1); print(view, len(r['keypoints']), 'joints', r.get('usage'))
    elif cmd == 'animate':
        hero, clip_id = sys.argv[2], sys.argv[3]
        for view in [a for a in sys.argv[4:] if not a.startswith('--')] or list(ART): animate(hero, clip_id, view, '--again' in sys.argv)
    elif cmd == 'pick': pick(sys.argv[2], sys.argv[3], int(sys.argv[4]))
    elif cmd == 'preflight':
        import preflight; preflight.run(sys.argv[2], [a for a in sys.argv[3:] if not a.startswith('--')])
    elif cmd == 'fetch':
        hero = sys.argv[2]
        while fetch(hero) and '--wait' in sys.argv: time.sleep(20)
