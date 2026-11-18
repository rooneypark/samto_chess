"""Drawing and measuring for the bone-motion engine: mannequins with volume, three cameras, QA numbers.

A rig (FootRig here, CavalryRig in cavalry.py) tells this module what to draw and what to measure:
    rig.solve(pose) -> (joints, issues)
    rig.parts(joints) -> [(joint a, joint b, radius, colour key, kind)]
    rig.lengths -> [(joint a, joint b, expected length)]         bones that must never change length
    rig.planted -> {support name: joint that must not slide while that support is listed}
    rig.weapon_ends -> (butt joint, tip joint) or None
    rig.volumes(joints) -> [(name, point a, point b, radius)]     body volumes the weapon must stay out of
"""
import math
from PIL import Image, ImageDraw, ImageFont
from samto_motion import add, sub, mul, dot, length, project, VIEWS

S = 2                         # preview scale (512 px per view)
BG, GRID, INK = (24, 32, 46, 255), (58, 72, 92, 255), (16, 22, 34, 255)
COLOUR = {'mid': (176, 190, 206), 'L': (124, 206, 226), 'R': (236, 150, 196),            # rider/infantry: left cyan, right pink
          'horse': (196, 164, 120), 'horseL': (214, 186, 140), 'horseR': (160, 128, 92),
          'face': (52, 62, 84),
          'shaft': (214, 170, 92), 'blade': (236, 240, 246), 'fan': (236, 240, 246), 'shield': (150, 172, 200), 'head': (128, 136, 150),
          'chain': (196, 198, 208), 'weight': (128, 136, 150), 'bow': (178, 124, 70), 'string': (232, 232, 232), 'arrow': (244, 222, 160)}
RADIUS = {'shaft': 1.6, 'blade': 2.6, 'fan': 5.5, 'shield': 4.5, 'head': 6.5, 'chain': 1.5, 'weight': 4.0, 'bow': 1.7, 'string': 0.6, 'arrow': 1.0}
TARGET = (150, 122, 90)

def font(size, bold=True):
    return ImageFont.truetype('C:/Windows/Fonts/malgunbd.ttf' if bold else 'C:/Windows/Fonts/malgun.ttf', size)

class FootRig:
    """Adapter for the infantry / tactician body in samto_motion.Body."""
    def __init__(self, body, weapon):
        self.body, self.weapon = body, weapon
        self.lengths = [(a + s, b + s, n) for s in ('.L', '.R') for a, b, n in (('shoulder', 'elbow', body.upper), ('hip', 'knee', body.thigh), ('knee', 'ankle', body.shin))] + [('pelvis', 'chest', body.spine)]
        self.planted = {'L': 'ankle.L', 'R': 'ankle.R'}
        self.weapon_ends = weapon.ends if weapon else None; self.flexible = getattr(weapon, 'flexible', False)
    def solve(self, p): return self.body.solve(p, self.weapon)
    def post(self, frames, poses):
        if hasattr(self.weapon, 'post'): self.weapon.post(frames, poses)
    def parts(self, j):
        r = self.body.r
        out = [('pelvis', 'chest', r['torso'], 'mid', 'torso'), ('chest', 'neck', 6.0, 'mid', 'neck'), ('head', 'head', r['head'], 'mid', 'head'), ('nose', 'nose', 2.6, 'face', 'face'),
               ('shoulder.L', 'shoulder.R', 7.0, 'mid', 'girdle'), ('hip.L', 'hip.R', 8.0, 'mid', 'girdle')]
        for s in ('L', 'R'):
            out += [('shoulder.' + s, 'elbow.' + s, r['upper'], s, 'limb'), ('elbow.' + s, 'wrist.' + s, r['fore'], s, 'limb'), ('hand.' + s, 'hand.' + s, r['hand'], s, 'hand'),
                    ('hip.' + s, 'knee.' + s, r['thigh'], s, 'limb'), ('knee.' + s, 'ankle.' + s, r['shin'], s, 'limb'), ('ankle.' + s, 'toe.' + s, r['foot'], s, 'foot')]
        if self.weapon: out += [(a, b, RADIUS[kind], kind, 'weapon') for a, b, kind in self.weapon.segments]
        return out
    def volumes(self, j): return [('torso', j['pelvis'], j['chest'], self.body.r['torso']), ('head', j['head'], j['head'], self.body.r['head'])]
    def balance(self, j, support):
        """(centre of mass on the ground, ground points of the feet that are down). Mass: pelvis 40%, chest 40%, head 20%."""
        com = add(add(mul(j['pelvis'], 0.4), mul(j['chest'], 0.4)), mul(j['head'], 0.2)); pts = []
        for s in support:
            a, t = j['ankle.' + s], j['toe.' + s]; back = sub(a, mul(sub(t, a), 0.35)); side = (-(t[1] - a[1]), t[0] - a[0]); n = math.hypot(*side) or 1; side = (side[0] / n * 4, side[1] / n * 4)
            for q in (back, t): pts += [(q[0] + side[0], q[1] + side[1]), (q[0] - side[0], q[1] - side[1])]
        return (com[0], com[1]), pts

def shade(colour, near, lo, hi):
    k = 0.72 + 0.28 * ((near - lo) / (hi - lo) if hi > lo else 1)
    return tuple(int(c * k) for c in colour) + (255,)

def draw_view(rig, j, view, label, target=(0, 100, 0), support=()):
    W = 256 * S; im = Image.new('RGBA', (W, W), BG); d = ImageDraw.Draw(im)
    P = lambda v: project(view, v); px = lambda v: (P(v)[0] * S, P(v)[1] * S)
    for gx in (-50, 50): d.line([px((gx, -50, 0)), px((gx, 150, 0))], fill=GRID, width=1)       # own tile and the tile in front
    for gy in (-50, 50, 150): d.line([px((-50, gy, 0)), px((50, gy, 0))], fill=GRID, width=1)
    drawn = [(P(add(target, (0, 0, 30)))[2], 'post')] if target else []          # target=None: no post (reference stills)
    for a, b, radius, key, kind in rig.parts(j):
        drawn.append(((P(j[a])[2] + P(j[b])[2]) / 2 + (0.5 if kind == 'hand' else 0), (a, b, radius, key, kind)))
    nears = [n for n, _ in drawn]; lo, hi = min(nears), max(nears)
    for near, item in sorted(drawn, key=lambda x: x[0]):
        if item == 'post':
            g = px(target); d.ellipse([g[0] - 12 * S, g[1] - 5 * S, g[0] + 12 * S, g[1] + 5 * S], outline=TARGET + (255,), width=3)
            if view == 'left':            # the post would hide the figure in the front and rear views; there only its footprint is drawn
                b = px(add(target, (0, 0, 62)))
                d.line([g, b], fill=TARGET + (255,), width=int(9 * S)); d.ellipse([b[0] - 7 * S, b[1] - 7 * S, b[0] + 7 * S, b[1] + 7 * S], fill=TARGET + (255,))
            continue
        a, b, radius, key, kind = item
        colour = shade(COLOUR[key], near, lo, hi); A, B = px(j[a]), px(j[b]); w = radius * 2 * S
        for width, fill in ((w + 3, INK), (w, colour)):            # dark outline first, so overlaps stay readable
            if a != b: d.line([A, B], fill=fill, width=int(round(width)))
            for q in (A, B): d.ellipse([q[0] - width / 2, q[1] - width / 2, q[0] + width / 2, q[1] + width / 2], fill=fill)
    for name in support:                                             # planted feet / hooves
        v = j[rig.planted[name]]; q = px((v[0], v[1], 0)); d.ellipse([q[0] - 7, q[1] - 3, q[0] + 7, q[1] + 3], outline=(255, 226, 120, 255), width=2)
    if label: d.text((10, 8), label, font=font(20), fill=(255, 236, 170, 255))
    return im

def draw_frame(rig, j, title, support=()):
    W = 256 * S; out = Image.new('RGBA', (W * 3 + 20, W + 34), (14, 18, 28, 255)); d = ImageDraw.Draw(out)
    d.text((10, 5), title, font=font(19), fill=(255, 255, 255, 255))
    for i, (view, name) in enumerate(VIEWS): out.paste(draw_view(rig, j, view, name, support=support), (i * (W + 10), 34))
    return out

# ---- measurements ----------------------------------------------------------------------------------------------
def seg_seg(p1, q1, p2, q2):
    """Shortest distance between two 3D segments."""
    d1, d2, r = sub(q1, p1), sub(q2, p2), sub(p1, p2); a, e, f = dot(d1, d1), dot(d2, d2), dot(d2, r)
    if a < 1e-9 and e < 1e-9: return length(r)
    if a < 1e-9: s, t = 0.0, max(0.0, min(1.0, f / e))
    else:
        c = dot(d1, r)
        if e < 1e-9: t, s = 0.0, max(0.0, min(1.0, -c / a))
        else:
            b = dot(d1, d2); den = a * e - b * b
            s = max(0.0, min(1.0, (b * f - c * e) / den)) if den > 1e-9 else 0.0
            t = (b * s + f) / e
            if t < 0: t, s = 0.0, max(0.0, min(1.0, -c / a))
            elif t > 1: t, s = 1.0, max(0.0, min(1.0, (b - c) / a))
    return length(sub(add(p1, mul(d1, s)), add(p2, mul(d2, t))))

def outside(p, pts):
    """How far point p lies outside the convex hull of pts (0 when inside)."""
    if not pts: return 0.0
    pts = sorted(set(pts)); cross = lambda o, a, b: (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    def half(seq):
        h = []
        for q in seq:
            while len(h) >= 2 and cross(h[-2], h[-1], q) <= 0: h.pop()
            h.append(q)
        return h[:-1]
    hull = half(pts) + half(pts[::-1])
    if len(hull) < 3: return min(math.hypot(p[0] - q[0], p[1] - q[1]) for q in pts)
    if all(cross(hull[i], hull[(i + 1) % len(hull)], p) >= 0 for i in range(len(hull))): return 0.0
    best = 1e9
    for i in range(len(hull)):
        a, b = hull[i], hull[(i + 1) % len(hull)]; d = (b[0] - a[0], b[1] - a[1]); n = d[0] * d[0] + d[1] * d[1]
        t = max(0.0, min(1.0, ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1]) / n)) if n else 0.0
        best = min(best, math.hypot(p[0] - a[0] - d[0] * t, p[1] - a[1] - d[1] * t))
    return best

def qa(rig, frames, supports, issues, canvas_margin=2, treadmill=False):
    """Numbers a reviewer would otherwise have to eyeball. 'fail' lists anything out of tolerance."""
    report = {'fail': []}; fail = report['fail']
    for i, problems in enumerate(issues): fail += ['frame %d: %s' % (i + 1, p) for p in problems]
    worst = max(abs(length(sub(j[a], j[b])) - n) for j in frames for a, b, n in rig.lengths)
    report['max_bone_length_error_px'] = round(worst, 4)
    if worst > 0.05: fail.append('bone length changes by %.2fpx' % worst)
    slide = 0.0; speeds = []
    for name, joint in rig.planted.items():
        for i in range(1, len(frames)):
            if name in supports[i] and name in supports[i - 1]:
                a, b = frames[i][joint], frames[i - 1][joint]; slide = max(slide, math.hypot(a[0] - b[0], a[1] - b[1])); speeds.append(b[1] - a[1])
    report['max_planted_slide_px'] = round(slide, 3)
    if treadmill:      # a move loop runs in place: planted feet must all travel backward at one steady speed
        report['ground_speed_px_per_frame'] = [round(min(speeds), 2), round(max(speeds), 2)] if speeds else None
        if speeds and max(speeds) - min(speeds) > 0.6: fail.append('planted feet do not move at one speed (%.1f to %.1f px per frame)' % (min(speeds), max(speeds)))
    elif slide > 0.5: fail.append('a planted foot or hoof slides %.1fpx' % slide)
    if rig.weapon_ends:
        butt, tip = rig.weapon_ends
        lens = [length(sub(j[tip], j[butt])) for j in frames]; report['weapon_length_px'] = [round(min(lens), 3), round(max(lens), 3)]
        flexible = getattr(rig, 'flexible', False)
        if max(lens) - min(lens) > 0.05 and not flexible: fail.append('weapon length changes')
        clear = {}
        for i, j in enumerate(frames):
            for name, a, b, radius in ([] if flexible else rig.volumes(j)):
                clear.setdefault(name, []).append(seg_seg(j[butt], j[tip], a, b) - radius - 1.6)
        report['min_clearance_weapon_px'] = {k: round(min(v), 1) for k, v in clear.items()}
        for name, values in clear.items():
            bad = [i + 1 for i, v in enumerate(values) if v < 0]
            if bad: fail.append('weapon passes through the %s in frames %s' % (name, bad))
        report['tip_forward_reach_px'] = [round(j[tip][1], 1) for j in frames]; report['tip_height_px'] = [round(j[tip][2], 1) for j in frames]
        report['tip_travel_per_frame_px'] = [round(length(sub(frames[i][tip], frames[i - 1][tip]))) for i in range(1, len(frames))]
    if hasattr(rig, 'balance') and not treadmill:
        out = [round(outside(*rig.balance(j, supports[i])), 1) for i, j in enumerate(frames)]; report['balance_outside_px'] = out
        # Standing on both feet the weight must be over them. On one foot the body may be falling into its step, but not far.
        bad = [i + 1 for i, v in enumerate(out) if v > (6 if len(supports[i]) >= 2 else 16)]
        if bad: fail.append('off balance in frames %s (centre of mass up to %.0fpx outside the feet)' % (bad, max(out)))
    cut = set()
    for i, j in enumerate(frames):
        for view, _ in VIEWS:
            for name, v in j.items():
                x, y, _n = project(view, v)
                if not (canvas_margin <= x <= 256 - canvas_margin and canvas_margin <= y <= 256 - canvas_margin): cut.add((i + 1, view, name))
    report['outside_canvas'] = sorted(cut)
    if cut: fail.append('%d joint positions leave the canvas' % len(cut))
    return report
