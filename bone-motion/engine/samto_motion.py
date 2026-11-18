"""Samto Chess bone-motion engine: one 3D motion, three fixed cameras.

Coordinates follow the standard-bone JSON: x = screen-right in the front view (so the character's LEFT side
is +x), y = forward, z = up, in pixels of the 256 canvas; the ground pivot is the origin and maps to (128, 224).

A clip is a list of key poses on a 15-frame timeline. A pose is not a list of joint positions: it says where the
pelvis is, how hips and chest are turned and leaned, where each foot stands, and how the weapon is held. Joints
are solved from that (fixed bone lengths, two-bone IK for arms and legs), so limbs never stretch and the hands
are on the weapon by construction. Everything that can go wrong is then measured (qa()).
"""
import json, math, os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.path.dirname(HERE)
ELEVATION = math.radians(18)      # the game's low top-down camera

# ---- small vector helpers -------------------------------------------------------------------------------------
def add(a, b): return (a[0] + b[0], a[1] + b[1], a[2] + b[2])
def sub(a, b): return (a[0] - b[0], a[1] - b[1], a[2] - b[2])
def mul(a, s): return (a[0] * s, a[1] * s, a[2] * s)
def dot(a, b): return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
def length(a): return math.sqrt(dot(a, a))
def unit(a):
    n = length(a)
    return mul(a, 1 / n) if n > 1e-9 else (0.0, 0.0, 1.0)
def lerp(a, b, t):
    if isinstance(a, tuple): return tuple(lerp(x, y, t) for x, y in zip(a, b))
    return a + (b - a) * t

def frame(turn, lean, side=0.0):
    """Orientation of a body block: side-bend (roll), forward lean (pitch), then turn (yaw). Degrees.
    turn > 0 brings the LEFT shoulder forward; lean > 0 tips the top toward +y; side > 0 tips it toward +x."""
    t, p, r = math.radians(turn), math.radians(lean), math.radians(side)
    def apply(v):
        x, y, z = v
        x, z = x * math.cos(r) + z * math.sin(r), -x * math.sin(r) + z * math.cos(r)
        y, z = y * math.cos(p) + z * math.sin(p), -y * math.sin(p) + z * math.cos(p)
        return (x * math.cos(t) - y * math.sin(t), x * math.sin(t) + y * math.cos(t), z)
    return apply

def two_bone(root, target, a, b, pole):
    """Middle joint of a two-bone chain bending toward `pole`. Returns (middle, end, shortfall)."""
    d = sub(target, root); n = length(d); shortfall = 0.0
    if n > a + b - 1e-6: shortfall = n - (a + b); n = a + b - 1e-6
    if n < abs(a - b) + 1e-6: shortfall = abs(a - b) - n; n = abs(a - b) + 1e-6
    u = unit(d); end = add(root, mul(u, n))
    w = sub(pole, mul(u, dot(pole, u)))
    w = unit(w) if length(w) > 1e-6 else unit((u[2], 0, -u[0]))
    cos_a = max(-1.0, min(1.0, (a * a + n * n - b * b) / (2 * a * n)))
    return add(root, add(mul(u, a * cos_a), mul(w, a * math.sqrt(1 - cos_a * cos_a)))), end, shortfall

# ---- body ------------------------------------------------------------------------------------------------------
class Body:
    def __init__(self, neutral_json):
        data = json.load(open(neutral_json, encoding='utf-8-sig')); c = {k: tuple(v) for k, v in data['coordinates'].items()}
        self.neutral = c; self.sizing = data['sizing']
        d = lambda a, b: length(sub(c[a], c[b]))
        self.spine, self.neck_len, self.head_len, self.top_len = d('chest', 'pelvis'), d('neck', 'chest'), d('head', 'neck'), d('head_top', 'head')
        self.shoulder = sub(c['shoulder.L'], c['chest']); self.hip = sub(c['hip.L'], c['pelvis'])
        self.upper, self.fore, self.hand = d('elbow.L', 'shoulder.L'), d('wrist.L', 'elbow.L'), d('hand.L', 'wrist.L')
        self.thigh, self.shin = d('knee.L', 'hip.L'), d('ankle.L', 'knee.L')
        self.toe = sub(c['toe.L'], c['ankle.L']); self.ankle_height = c['ankle.L'][2]
        self.stand = c['pelvis'][2]
        # Volumes for drawing and for the penetration check (radii in px).
        self.r = dict(torso=12.5, head=self.sizing['head_height'] / 2, upper=5.0, fore=4.5, thigh=6.5, shin=5.5, hand=4.0, foot=4.5)

    def solve(self, p, weapon):
        """Joints for one pose. Returns (joints, issues)."""
        j = {}; issues = []
        pelvis = p['pelvis']; j['pelvis'] = pelvis
        fp = frame(p['hip_turn'], p['hip_lean'], p.get('hip_side', 0)); fc = frame(p['chest_turn'], p['chest_lean'], p.get('chest_side', 0))
        fs = frame((p['hip_turn'] + p['chest_turn']) / 2, (p['hip_lean'] + p['chest_lean']) / 2, (p.get('hip_side', 0) + p.get('chest_side', 0)) / 2)
        fh = frame(p.get('head_turn', p['chest_turn'] * 0.15), p.get('head_lean', p['chest_lean'] * 0.4))      # eyes stay on the target while the chest winds up
        j['chest'] = add(pelvis, fs((0, 0, self.spine))); j['neck'] = add(j['chest'], fc((0, 0, self.neck_len)))
        j['head'] = add(j['neck'], fh((0, 1, self.head_len))); j['head_top'] = add(j['head'], fh((0, -1, self.top_len))); j['nose'] = add(j['head'], fh((0, self.r['head'] - 1.5, -3)))
        grips = weapon.sockets(p) if weapon else {}
        j.update(weapon.joints(p) if weapon else {})
        for side, s in (('L', 1), ('R', -1)):
            sh = add(j['chest'], fc((self.shoulder[0] * s, self.shoulder[1], self.shoulder[2]))); j['shoulder.' + side] = sh
            target = grips.get(side) or p.get('hand.' + side) or add(sh, fc((6 * s, 3, -(self.upper + self.fore + self.hand) * 0.96)))
            pole = add(fc((9 * s, -6, -10)), p.get('elbow.' + side, (0, 0, 0)))
            elbow, hand, short = two_bone(sh, target, self.upper, self.fore + self.hand, pole)
            j['elbow.' + side], j['hand.' + side] = elbow, hand
            j['wrist.' + side] = add(elbow, mul(unit(sub(hand, elbow)), self.fore))
            if short > 0.05: issues.append('%s hand %.1fpx short of its grip' % (side, short))
            hip = add(pelvis, fp((self.hip[0] * s, self.hip[1], self.hip[2]))); j['hip.' + side] = hip
            foot = p['foot.' + side]            # dict(at=(x, y), yaw, heel, air)
            yaw = frame(foot.get('yaw', 0), 0); heel = foot.get('heel', 0.0); air = foot.get('air', 0.0)
            ankle = (foot['at'][0], foot['at'][1], self.ankle_height + heel + air)
            toe = add(ankle, yaw((self.toe[0], self.toe[1], self.toe[2] - heel)))
            knee, ankle2, short = two_bone(hip, ankle, self.thigh, self.shin, add(yaw((2.5 * s, 10, 0)), (0, 0, 2)))
            j['knee.' + side], j['ankle.' + side], j['toe.' + side] = knee, ankle2, toe
            if short > 0.05: issues.append('%s leg %.1fpx short of its foot' % (side, short))
        return j, issues

class Spear:
    """Straight shaft. p['rear'] = where the rear hand's socket is; p['aim'] = (turn, pitch) of the shaft in degrees
    (turn 0 = straight forward, + toward the character's left; pitch + = tip up); p['front'] = distance of the
    front hand's socket from the butt (changing it over time is a declared slide)."""
    def __init__(self, total=128.0, rear_socket=34.0, collar=104.0, rear_hand='R', front_hand='L', head='blade'):
        self.total, self.rear_socket, self.collar, self.rear_hand, self.front_hand = total, rear_socket, collar, rear_hand, front_hand
        self.segments = [('spear_butt', 'spear_collar', 'shaft'), ('spear_collar', 'spear_tip', head)]
    def axis(self, p):
        if 'axis' in p: return unit(p['axis'])          # a direction vector instead of (turn, pitch), for swings over the top
        t, e = math.radians(p['aim'][0]), math.radians(p['aim'][1])
        return (math.sin(t) * math.cos(e), math.cos(t) * math.cos(e), math.sin(e))
    def point(self, p, along): return add(p['rear'], mul(self.axis(p), along - self.rear_socket))
    def sockets(self, p):
        front = self.point(p, p['front']); on = p.get('front_on', 1.0)      # front_on < 1: the front hand has let go (a declared release)
        return {self.rear_hand: p['rear'], self.front_hand: front if on >= 1.0 else lerp(p['hand.' + self.front_hand], front, on)}
    def joints(self, p): return {'spear_butt': self.point(p, 0), 'spear_collar': self.point(p, self.collar), 'spear_tip': self.point(p, self.total)}
    ends = ('spear_butt', 'spear_tip')

class Fan:
    """Feather fan or other short one-hand prop. p['rear'] = the holding hand's socket, p['aim'] = (turn, pitch)."""
    def __init__(self, total=24.0, hand='R'): self.total, self.hand = total, hand
    def axis(self, p):
        t, e = math.radians(p['aim'][0]), math.radians(p['aim'][1])
        return (math.sin(t) * math.cos(e), math.cos(t) * math.cos(e), math.sin(e))
    def sockets(self, p): return {self.hand: p['rear']}
    def joints(self, p): return {'fan_base': p['rear'], 'fan_tip': add(p['rear'], mul(self.axis(p), self.total))}
    segments = [('fan_base', 'fan_tip', 'fan')]
    ends = ('fan_base', 'fan_tip')

# ---- timeline --------------------------------------------------------------------------------------------------
EASE = {'linear': lambda t: t, 'in': lambda t: t * t, 'out': lambda t: 1 - (1 - t) ** 2, 'inout': lambda t: t * t * (3 - 2 * t),
        'snap': lambda t: 1 - (1 - t) ** 3}

def blend(a, b, t):
    out = {}
    for k in a:
        if isinstance(a[k], dict): out[k] = {q: lerp(a[k].get(q, 0.0), b[k].get(q, 0.0), t) for q in set(a[k]) | set(b[k])}
        else: out[k] = lerp(a[k], b[k], t)
    return out

def timeline(keys, frames=15):
    """keys: list of (frame_index, pose, ease_into_this_key). Returns one pose per frame."""
    keys = sorted(keys, key=lambda k: k[0]); out = []
    for f in range(frames):
        nxt = next((i for i, k in enumerate(keys) if k[0] >= f), len(keys) - 1); prev = max(0, nxt - 1) if keys[nxt][0] != f else nxt
        if keys[nxt][0] == f or nxt == prev: out.append(keys[nxt][1]); continue
        a, b = keys[prev], keys[nxt]; t = (f - a[0]) / (b[0] - a[0])
        out.append(blend(a[1], b[1], EASE[b[2]](t)))
    return out

# ---- cameras ---------------------------------------------------------------------------------------------------
def project(view, v):
    """(screen x, screen y, nearness) on the 256 canvas."""
    x, y, z = v; c, s = math.cos(ELEVATION), math.sin(ELEVATION)
    if view == 'front': sx, up, near = x, z * c - y * s, y
    elif view == 'left': sx, up, near = -y, z * c - x * s, x
    else: sx, up, near = -x, z * c + y * s, -y
    return (128 + sx, 224 - up, near)

VIEWS = (('front', '정면'), ('left', '왼쪽 측면'), ('rear', '후면'))
