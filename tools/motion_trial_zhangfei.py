"""Trial: Zhang Fei's left-facing basic attack (straight two-handed spear thrust) from skeleton coordinates.

    python tools/motion_trial_zhangfei.py poses          build the 12 skeletons and overlay previews (no API call)
    python tools/motion_trial_zhangfei.py key            draw only the full-extension frame (needs PIXELLAB_API_KEY)
    python tools/motion_trial_zhangfei.py clip           draw all 12 frames

The motion follows docs/캐릭터_원화_모션_스킬이펙트_통합가이드.md, 12절 장비 기본 공격 A:
pull the spear back to the waist -> bend the front knee and thrust straight with both hands -> hold at full
extension -> pull back to the upright stance. The spear tip travels along one straight horizontal lane.
Skeletons are computed, not drawn by hand: spear joints lie on one line of fixed length, wrists sit on the
shaft, elbows and knees come from two-bone IK with the bone lengths of the source art.
"""
import json, math, os, sys
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pixellab_client as pl

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRIAL = os.path.join(ROOT, 'motion-trials', 'zhangfei-side-attack')
SIZE = 256
DESCRIPTION = 'stocky bearded warrior in black and red armor with a red headband, holding a long serpent-bladed spear'

estimate = json.load(open(os.path.join(TRIAL, '01-estimate-result.json'), encoding='utf-8'))['last_response']
RIG = estimate['rig']
# Second attempt (2026-11-17): the sprite is moved right inside the canvas so a 160px spear can be thrust forward
# of the body without leaving the picture. The clip's pivot is therefore (128 + SHIFT, 224), as the approved
# Zhao Yun side attack already does with its own anchor.
SHIFT = 40
SOURCE = os.path.join(TRIAL, 'source-side-shifted.png')
if not os.path.exists(SOURCE):
    original = Image.open(os.path.join(TRIAL, 'source-side.png')).convert('RGBA')
    moved = Image.new('RGBA', original.size, (0, 0, 0, 0)); moved.paste(original, (SHIFT, 0)); moved.save(SOURCE)
REST = {k['label']: (k['x'] * SIZE + SHIFT, k['y'] * SIZE) for k in estimate['frames'][0]}
Z = {k['label']: k['z_index'] for k in estimate['frames'][0]}

def sub(a, b): return (a[0] - b[0], a[1] - b[1])
def add(a, b): return (a[0] + b[0], a[1] + b[1])
def dist(a, b): return math.hypot(a[0] - b[0], a[1] - b[1])
def lerp(a, b, t): return a + (b - a) * t
def lerp2(a, b, t): return (lerp(a[0], b[0], t), lerp(a[1], b[1], t))

def ik(root, target, l1, l2, bend):
    """Middle joint of a two-bone chain. bend=+1/-1 picks the side of the root->target line."""
    d = dist(root, target); reach = l1 + l2 - 0.01
    if d > reach: target = add(root, tuple(c * reach / d for c in sub(target, root))); d = reach
    d = max(d, abs(l1 - l2) + 0.01)
    a = math.acos(max(-1, min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))))
    base = math.atan2(target[1] - root[1], target[0] - root[0])
    return (root[0] + l1 * math.cos(base + bend * a), root[1] + l1 * math.sin(base + bend * a)), target

# Bone lengths and offsets measured on the source art.
L = {name: dist(REST[a], REST[b]) for name, a, b in [
    ('near_upper', 'near_shoulder', 'near_elbow'), ('near_fore', 'near_elbow', 'near_wrist'),
    ('far_upper', 'far_shoulder', 'far_elbow'), ('far_fore', 'far_elbow', 'far_wrist'),
    ('near_thigh', 'near_hip', 'near_knee'), ('near_shin', 'near_knee', 'near_ankle'),
    ('far_thigh', 'far_hip', 'far_knee'), ('far_shin', 'far_knee', 'far_ankle')]}
SPEAR = {'spear_butt': 0.0, 'spear_mid': dist(REST['spear_butt'], REST['spear_mid']), 'spear_collar': dist(REST['spear_butt'], REST['spear_collar']),
         'spear_blade_mid': dist(REST['spear_butt'], REST['spear_blade_mid']), 'spear_tip': dist(REST['spear_butt'], REST['spear_tip'])}
GRIP_NEAR_REST = dist(REST['spear_butt'], REST['near_wrist'])
GRIP_FAR_REST = dist(REST['spear_butt'], REST['far_wrist'])

# Key poses. angle: direction the tip points, degrees, 90 = straight up, 180 = left (the attack direction).
# grip: where the near (front) hand holds the shaft; near/far: distance of each hand from the butt.
# spread: how far the shoulders sit from the neck, relative to the source art. The first attempt kept the full
# spread and put both hands under the shoulders, which read as a body turned to the camera holding a bar.
# Here both hands are in front of the body on the shaft: the front hand reaches forward, the rear hand stays by the hip.
KEYS = {
 'rest':   dict(pelvis=(0, 0),   lean=0,  angle=90,  grip=REST['near_wrist'], near=GRIP_NEAR_REST, far=GRIP_FAR_REST, near_foot=(0, 0),   far_foot=(0, 0), spread=1.0),
 'ready':  dict(pelvis=(6, 4),   lean=-8, angle=180, grip=(150, 152),         near=60,             far=20,            near_foot=(0, 0),   far_foot=(4, 0), spread=0.7),
 'thrust': dict(pelvis=(-12, 8), lean=16, angle=180, grip=(112, 152),         near=60,             far=20,            near_foot=(-24, 0), far_foot=(8, 0), spread=0.7),
}
# Frame plan for the 12 returned frames (the source art is frame 0 and is not returned).
# A1 wind-up 0-30%, A2 drive 30-55%, A3 contact and hold 55-70%, A4 recovery 70-100%.
PLAN = [('rest', 'ready', 0.45), ('rest', 'ready', 0.85), ('rest', 'ready', 1.0), ('ready', 'ready', 0.0),
        ('ready', 'thrust', 0.55), ('ready', 'thrust', 1.0), ('thrust', 'thrust', 0.0), ('thrust', 'thrust', 0.0),
        ('thrust', 'rest', 0.3), ('thrust', 'rest', 0.6), ('thrust', 'rest', 0.85), ('thrust', 'rest', 1.0)]
KEY_FRAME = 5      # index in PLAN of the full extension

def mix(a, b, t):
    ka, kb = KEYS[a], KEYS[b]; out = {}
    for name in ka:
        out[name] = lerp2(ka[name], kb[name], t) if isinstance(ka[name], tuple) else lerp(ka[name], kb[name], t)
    return out

def rotate(point, origin, degrees):
    r = math.radians(degrees); x, y = sub(point, origin)
    return (origin[0] + x * math.cos(r) - y * math.sin(r), origin[1] + x * math.sin(r) + y * math.cos(r))

def skeleton(p):
    j = {}
    pelvis = add(REST['pelvis'], p['pelvis']); j['pelvis'] = pelvis
    # Upper body: the source offsets from the pelvis, leaned around it (positive = forward, toward the left).
    for name in ('chest', 'neck', 'head', 'head_top', 'near_shoulder', 'far_shoulder', 'scarf_1', 'scarf_2', 'scarf_3'):
        offset = sub(REST[name], REST['pelvis'])
        if name.endswith('_shoulder'):
            neck = sub(REST['neck'], REST['pelvis']); offset = add(neck, tuple(c * p['spread'] for c in sub(offset, neck)))
        j[name] = rotate(add(pelvis, offset), pelvis, -p['lean'])
    for name in ('scarf_2', 'scarf_3'):                                   # the scarf trails behind a forward lean
        j[name] = add(j[name], (max(0, p['lean']) * (0.25 if name == 'scarf_2' else 0.5), 0))
    # Spear: one straight line of fixed length through the front hand.
    a = math.radians(p['angle']); axis = (math.cos(a), -math.sin(a))
    butt = sub(p['grip'], tuple(c * p['near'] for c in axis))
    for name, along in SPEAR.items(): j[name] = add(butt, tuple(c * along for c in axis))
    # Hands on the shaft, elbows from IK (bent downward).
    j['near_elbow'], j['near_wrist'] = ik(j['near_shoulder'], p['grip'], L['near_upper'], L['near_fore'], -1)
    far_grip = add(butt, tuple(c * p['far'] for c in axis))
    j['far_elbow'], j['far_wrist'] = ik(j['far_shoulder'], far_grip, L['far_upper'], L['far_fore'], -1)
    # Legs: hips ride on the pelvis, feet are placed, knees from IK (bent toward the facing side).
    for side in ('near', 'far'):
        hip = add(pelvis, sub(REST[side + '_hip'], REST['pelvis'])); j[side + '_hip'] = hip
        ankle = add(REST[side + '_ankle'], p[side + '_foot'])
        j[side + '_knee'], j[side + '_ankle'] = ik(hip, ankle, L[side + '_thigh'], L[side + '_shin'], +1)
        j[side + '_toe'] = add(j[side + '_ankle'], sub(REST[side + '_toe'], REST[side + '_ankle']))
    return j

def keypoints(j):
    out = []
    for joint in RIG:
        x, y = j[joint['name']]
        out.append({'label': joint['name'], 'x': round(min(1, max(0, x / SIZE)), 4), 'y': round(min(1, max(0, y / SIZE)), 4), 'z_index': Z[joint['name']]})
    return out

def frames():
    return [skeleton(mix(a, b, t)) for a, b, t in PLAN]

def overlay(j, base=None):
    im = (base or Image.new('RGBA', (SIZE, SIZE), (60, 70, 90, 255))).convert('RGBA').resize((SIZE * 3, SIZE * 3), Image.NEAREST)
    d = ImageDraw.Draw(im)
    for joint in RIG:
        if joint['parent']:
            colour = (255, 220, 60, 255) if joint['name'].startswith('spear') else (90, 220, 255, 255) if joint['side'] == 'near' else (255, 120, 200, 255) if joint['side'] == 'far' else (255, 255, 255, 255)
            d.line([tuple(c * 3 for c in j[joint['parent']]), tuple(c * 3 for c in j[joint['name']])], fill=colour, width=3)
    for name, (x, y) in j.items(): d.ellipse([x * 3 - 4, y * 3 - 4, x * 3 + 4, y * 3 + 4], fill=(255, 60, 60, 255))
    return im

def poses():
    source = Image.open(SOURCE)
    overlay(REST, source).save(os.path.join(TRIAL, '05-rest-skeleton.png'))
    fs = frames(); sheet = Image.new('RGBA', (SIZE * 3 * 6, SIZE * 3 * 2), (60, 70, 90, 255))
    for i, j in enumerate(fs): sheet.paste(overlay(j), ((i % 6) * SIZE * 3, (i // 6) * SIZE * 3))
    sheet.resize((SIZE * 6, SIZE * 2), Image.LANCZOS).save(os.path.join(TRIAL, '05-planned-skeletons.png'))
    with open(os.path.join(TRIAL, '05-planned-keypoints.json'), 'w', encoding='utf-8', newline='\n') as f:
        json.dump([keypoints(j) for j in fs], f, indent=1); f.write('\n')
    tips = [(round(j['spear_tip'][0], 1), round(j['spear_tip'][1], 1)) for j in fs]
    print('spear length per frame:', sorted({round(dist(j['spear_butt'], j['spear_tip']), 1) for j in fs}))
    print('tip positions:', tips)
    # Every hand must actually reach its place on the shaft; a clamped IK target would pull the hand off the spear.
    short = []
    for i, (a, b, t) in enumerate(PLAN):
        p = mix(a, b, t); j = fs[i]; axis = (math.cos(math.radians(p['angle'])), -math.sin(math.radians(p['angle'])))
        want = {'near_wrist': p['grip'], 'far_wrist': add(j['spear_butt'], tuple(c * p['far'] for c in axis))}
        short += [(i, n, round(dist(j[n], w), 1)) for n, w in want.items() if dist(j[n], w) > 0.5]
        short += [(i, side + '_ankle') for side in ('near', 'far') if dist(j[side + '_ankle'], add(REST[side + '_ankle'], p[side + '_foot'])) > 0.5]
    print('hands or feet that cannot reach their target:', short)
    print('tip lane (y) while horizontal:', sorted({round(j['spear_tip'][1], 1) for i, j in enumerate(fs) if abs(j['spear_tip'][1] - j['spear_butt'][1]) < 2}))
    print('out of canvas:', [(i, n) for i, j in enumerate(fs) for n, (x, y) in j.items() if not (2 <= x <= SIZE - 2 and 2 <= y <= SIZE - 2)])

def generate(which):
    fs = frames(); chosen = [fs[KEY_FRAME]] if which == 'key' else fs
    body = {'description': DESCRIPTION, 'action': 'spear thrust attack', 'direction': 'west', 'view': 'side',
            'first_frame': pl.image(SOURCE), 'first_frame_keypoints': keypoints(REST),
            'keypoints': [keypoints(j) for j in chosen], 'rig': RIG, 'template_id': 'mannequin', 'seed': 20261117, 'no_background': True}
    tag = '03b-key' if which == 'key' else '05-clip'
    pl.log(TRIAL, tag + '-request.json', body)
    started = pl.call('POST', '/animate-with-skeleton-v3', body); print('job', started.get('background_job_id'))
    job = pl.wait(started['background_job_id']); pl.log(TRIAL, tag + '-result.json', job)
    print(job['status'], job.get('usage'))
    if job['status'] != 'completed': print(json.dumps(pl.strip_images(job), ensure_ascii=False)[:1500]); return
    paths = pl.save_images(job['last_response']['images'], os.path.join(TRIAL, tag + '-frames'), 'frame-')
    print('saved', len(paths), 'frames')

if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'poses'
    poses() if mode == 'poses' else generate(mode)
