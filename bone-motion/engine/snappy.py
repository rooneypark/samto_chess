"""시원한 동작 (user, 2026-11-20: 'like 진삼국무쌍: big, clean body movement and strikes, for every troop type').

The clips were written under conservative checks and came out tight: bent arms, a small wind-up, a blow that stops on
the target. This pass makes every attack and skill bigger without rewriting them by hand:

    body       hips and chest wind further away and unwind further (turn, lean and side lean, measured from the ready pose)
    arms       the weapon hand travels further from where it rests, so the arm is straighter in the wind-up and in the blow
    weapon     its direction swings through a wider angle
    step       the pelvis (or the horse) travels further with the blow
    through    the blow does not stop on the target: the two frames after it carry on in the same direction, then come back
    head       the head faces the target the whole time; only the body turns
    timing     the wind-up is held, the two frames of the blow are 45 and 40 ms, the frame after the blow is held

How much is decided per clip, not by taste: bake() tries the full strength and steps down until the bone checks pass
(arm and leg reach, weapon through the body, balance, feet sliding). The result is written to snappy.json and read when the
family module is imported, so nothing is solved at import time.

One rule is relaxed on purpose (user: 'a big swing shows a trail anyway, a weapon cut off a little at the edge is fine;
where it leaves the canvas use a swing, not a thrust'): the ends of a WEAPON may leave the 256 canvas by up to CUT px.
The body may not.

    python -X utf8 bone-motion/engine/snappy.py            bake every family, print the strength each clip got
    python -X utf8 bone-motion/engine/snappy.py sword      one family
"""
import importlib, json, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm

HERE = os.path.dirname(os.path.abspath(__file__)); TABLE = os.path.join(HERE, 'snappy.json'); CUT = 50.0; LEAN = 9.0      # LEAN: how much further the weight may pass the feet in an upgraded clip
LADDER = (1.0, 0.8, 0.6, 0.45, 0.3, 0.15, 0.0)
SWING, CARRY = 0.5, 0.6      # user 2026-11-20: 'no turning the whole body round; make the SWING showy'. The weapon sweeps through half as much angle again, and the blow carries 60 % further past the target
def is_spin(clip):
    """A clip in which the body itself turns a full circle (선풍창, 돌아 베기, 대회전...). The user does not want these as attacks."""
    ps = clip['poses'] if 'poses' in clip else sm.timeline(clip['keys'])
    return any(k in ps[0] and max(p[k] for p in ps) - min(p[k] for p in ps) > 200 for k in ('hip_turn', 'chest_turn'))
EXTRA = {'heavy': 1.35, 'foot_spear': 1.35, 'poleaxe': 1.35, 'mounted_blade': 0.8, 'mounted_spear': 0.8,      # 2026-11-20 afternoon: at 1.35 PixelLab lost the glaive in the middle frames of 관우's swings (trial, 96 generations); tried at 0.8 first
          'mounted_halberd': 1.35, 'mounted_lance': 1.35}      # user 2026-11-20: these two (and the pole axe built on the spearman) bigger still
TURNS = ('hip_turn', 'chest_turn', 'hip_lean', 'chest_lean', 'hip_side', 'chest_side')
HANDS = ('rear', 'sword', 'spear', 'shield', 'swordR', 'swordL', 'chain', 'bow', 'sickle', 'main')
STEP = ('pelvis', 'h_root', 'seat')
STATIC = ('foot.L', 'foot.R', 'FL', 'FR', 'HL', 'HR')      # planted feet and hooves are never pushed further
_table = None

def table():
    global _table
    if _table is None: _table = json.load(open(TABLE, encoding='utf-8')) if os.path.exists(TABLE) else {}
    return _table

def _scale(g, v, k): return tuple(a + (b - a) * k for a, b in zip(g, v)) if isinstance(v, tuple) else g + (v - g) * k
def _swing(g, v, k):
    """Turn the direction v further away from the ready direction g: k = 1 leaves it, 1.3 is 30 % more angle (at most 175 degrees)."""
    a, b = sm.unit(g), sm.unit(v); c = max(-1.0, min(1.0, sm.dot(a, b))); ang = math.acos(c)
    if ang < 1e-3: return v
    n = sm.sub(b, sm.mul(a, c)); n = sm.unit(n); t = min(math.radians(175), ang * k)
    return sm.add(sm.mul(a, math.cos(t)), sm.mul(n, math.sin(t)))

def _one(g, p, f, fh, fs):
    q = dict(p)
    for k in TURNS:
        if k in q: q[k] = _scale(g[k], p[k], 1 + 0.6 * f)
    for k in HANDS:
        if k in q and isinstance(q[k], tuple): q[k] = _scale(g[k], p[k], 1 + 0.4 * fh)
    for k in STEP:
        if k in q: q[k] = _scale(g[k], p[k], 1 + 0.4 * fs)
    for k in list(q):
        if (k == 'aim' or k.endswith('_aim')) and isinstance(q[k], tuple) and k in g: q[k] = _scale(g[k], p[k], 1 + SWING * fh)
    if 'axis' in q and 'axis' in g: q['axis'] = _swing(g['axis'], p['axis'], 1 + SWING * fh)
    q['head_turn'] = 0.0; q['head_lean'] = q.get('chest_lean', 0.0) * 0.25      # eyes on the target; the body turns under the head
    return q

def bigger(ps, f, rig=None):
    """With a rig, each frame's arm and step strength is taken down until the hands reach their grips and the feet their
    places: the arm ends up as straight as it can be, which is the point, instead of the whole clip being made smaller."""
    g = ps[0]; n = len(ps); fh = [f] * n; fs = [f] * n
    if rig is not None and f > 0:
        for i, p in enumerate(ps):
            for _ in range(9):
                issues = rig.solve(_one(g, p, f, fh[i], fs[i]))[1]; hand = any('hand' in x for x in issues); leg = any('leg' in x for x in issues)
                if not hand and not leg: break
                if hand: fh[i] *= 0.7
                if leg: fs[i] *= 0.7
        for arr in (fh, fs):      # no frame much stronger than its neighbours: that would jitter
            sm_ = [min(arr[max(0, i - 1):i + 2]) for i in range(n)]; arr[:] = sm_
    return [_one(g, p, f, fh[i], fs[i]) for i, p in enumerate(ps)]

def through(ps, hit, f):
    """hit = 0-based index of the frame of the blow. The two frames after it carry the blow on, then ease back."""
    if hit is None or hit < 1 or hit + 2 >= len(ps) or f <= 0: return ps
    out = list(ps); a, b = ps[hit - 1], ps[hit]
    def beyond(t):
        q = sm.blend(a, b, t)
        for k in STATIC + ('socket', 'front', 'front_on', 'support', 'support_on', 'draw', 'string_hand', 'arrow_on', 'arrow_fly', 'chain_taut', 'head_turn', 'head_lean'):
            if k in b: q[k] = b[k]
        return q
    over = beyond(1 + CARRY * f)
    for i, w in ((hit + 1, 0.6), (hit + 2, 0.3)):
        q = sm.blend(ps[i], over, w)
        for k in STATIC:
            if k in ps[i]: q[k] = ps[i][k]
        out[i] = q
    return out

def timing(durations, hits):
    d = list(durations)
    for h in [x for x in hits if x]:      # 1-based frame of a blow
        i = h - 1
        if i - 2 >= 0: d[i - 2] = max(d[i - 2], 150)      # the wind-up is held
        if i - 1 >= 0: d[i - 1] = min(d[i - 1], 45)
        d[i] = min(d[i], 40)
        if i + 1 < len(d): d[i + 1] = max(d[i + 1], 190)  # the blow is held
    return d

def stride(ps, f):
    """이동 (user, 2026-11-20: 'the move too'). A run or a gallop has no ready pose to measure from, so each value is pushed away
    from its average over the cycle: the body rocks and twists more, the bounce is higher, the arms and the weapon swing
    wider. On top of that the runner leans into the run. Feet and hooves are not touched, so the ground speed stays even."""
    n = len(ps); mean = {}
    for k in ps[0]:
        v = ps[0][k]
        if isinstance(v, tuple): mean[k] = tuple(sum(p[k][i] for p in ps) / n for i in range(len(v)))
        elif isinstance(v, (int, float)): mean[k] = sum(p[k] for p in ps) / n
    out = []
    for p in ps:
        q = dict(p)
        for k in TURNS + ('h_pitch', 'neck'):
            if k in q: q[k] = _scale(mean[k], p[k], 1 + 0.7 * f)
        for k in STEP:
            if k in q: q[k] = _scale(mean[k], p[k], 1 + 0.6 * f)
        for k in HANDS + ('hand.L', 'hand.R'):
            if k in q and isinstance(q[k], tuple): q[k] = _scale(mean[k], p[k], 1 + 0.4 * f)
        if 'chest_lean' in q: q['chest_lean'] += 7.0 * f      # leaning into the run
        if 'hip_lean' in q: q['hip_lean'] += 3.0 * f
        q['head_turn'] = 0.0; q['head_lean'] = 0.0      # the head stays level and looks ahead
        out.append(q)
    return out

def make_move(clip, f, rig=None):
    if clip.get('snappy') is not None: return clip
    raw = poses_of(clip); ps = stride(raw, f)
    if rig is not None and f > 0:
        for i, p in enumerate(ps):
            for t in (0.25, 0.5, 0.75, 1.0):
                if not any('hand' in x or 'leg' in x for x in rig.solve(ps[i])[1]): break
                q = sm.blend(p, dict(raw[i], head_turn=0.0, head_lean=0.0), t)
                for k in STATIC:
                    if k in raw[i]: q[k] = raw[i][k]
                ps[i] = q
    out = {k: v for k, v in clip.items() if k != 'keys'}; out['poses'] = ps; out['snappy'] = f
    return out

def through_body(rig, j):
    """True when the weapon passes through the torso, the head or a limb in this frame (the same test render.qa makes)."""
    if not getattr(rig, 'weapon_ends', None) or getattr(rig, 'flexible', False): return False
    import render
    butt, tip = rig.weapon_ends
    return any(render.seg_seg(j[butt], j[tip], a, b) - radius - 1.6 < 0 for name, a, b, radius in rig.volumes(j))

def rear_up(ps, hit, f, support):
    """기병 (user, 2026-11-20: 'the cavalry once more, showier'). The horse takes part in every blow: through the wind-up it sits
    back and lifts both front hooves, the rider rising in the stirrups, and on the blow it comes down and stamps, neck
    stretched. A clip whose horse already lifts its hooves is left as it is. Returns (poses, support)."""
    if hit is None or hit < 4 or f <= 0 or 'h_pitch' not in ps[0]: return ps, support
    s0 = max(1, hit - 5)
    if max(max(p['FL'][2], p['FR'][2]) for p in ps[s0:hit + 1]) > 3.0: return ps, support
    out = list(ps); support = [tuple(x) for x in support]
    for i in range(s0, hit):
        w = math.sin(math.pi * (i - s0 + 1) / (hit - s0 + 1)) * min(1.0, f)      # 0 at both ends, 1 in the middle of the wind-up
        q = dict(out[i]); q['h_pitch'] = q['h_pitch'] + 10.0 * w; q['neck'] = q.get('neck', 0.0) + 6.0 * w
        q['h_root'] = (q['h_root'][0], q['h_root'][1] - 3.0 * w, q['h_root'][2] + 1.5 * w); q['seat'] = (q['seat'][0], q['seat'][1], q['seat'][2] + 2.5 * w)
        for k in ('FL', 'FR'): q[k] = (q[k][0], q[k][1] + 3.0 * w, q[k][2] + 17.0 * w)
        out[i] = q
        if 17.0 * w > 1.5: support[i] = tuple(x for x in support[i] if x not in ('FL', 'FR'))
    q = dict(out[hit]); q['h_pitch'] = q['h_pitch'] - 3.0 * min(1.0, f); q['neck'] = q.get('neck', 0.0) - 6.0 * min(1.0, f); out[hit] = q      # the stamp
    return out, support

def poses_of(clip): return clip['poses'] if 'poses' in clip else sm.timeline(clip['keys'])

def make(clip, f, rig=None):
    """The clip at strength f (0 = timing and head only)."""
    if clip.get('snappy') is not None: return clip
    hits = [clip.get('impact'), clip.get('impact2')]; ps = poses_of(clip); spin = is_spin(clip)
    ps = ps if spin else bigger(ps, f, rig)      # a full turn is not wound any further
    for h in [x for x in hits if x]: ps = through(ps, h - 1, f)
    support = clip['support']
    if hits[0] and not clip.get('treadmill'): ps, support = rear_up(ps, hits[0] - 1, f, support)
    if rig is not None and f > 0:      # a frame whose hand or foot still cannot reach goes back toward the frame as written, a quarter at a time
        raw = poses_of(clip)
        for i, p in enumerate(ps):
            for t in (0.25, 0.5, 0.75, 1.0):
                j, issues = rig.solve(ps[i])
                if not any('hand' in x or 'leg' in x for x in issues) and not through_body(rig, j): break
                q = sm.blend(p, dict(raw[i], **{k: p[k] for k in ('head_turn', 'head_lean') if k in p}), t)
                for k in STATIC:
                    if k in raw[i]: q[k] = raw[i][k]
                ps[i] = q
    out = {k: v for k, v in clip.items() if k != 'keys'}
    out['poses'] = ps; out['durations'] = timing(clip['durations'], hits) if any(hits) else list(clip['durations']); out['snappy'] = f; out['support'] = support; out['spin'] = spin
    return out

def upgrade(module):
    """CLIPS of a family with the strengths from snappy.json. Idle is left alone; move gets stride(). Call once at the end of the module."""
    name = module.__name__.split('.')[-1]; t = table().get(name, {}); out = {}; rig = rig_of(module) if t else None
    for cid, clip in module.CLIPS.items():
        # idle and move are published exactly as written: their pictures are kept (user 2026-11-20), and a bigger run changed the
        # joints by 1 px on average. stride() stays in the file for the day the moves are redrawn.
        out[cid] = clip if cid in ('idle', 'move') or cid not in t else make(clip, t[cid], rig)
    # 기본 병종 (user 2026-11-20: 'the basic troops must be plain; each country's heroes must be the showiest'). Every attack and
    # skill is also published exactly as it was written, under p + its id: no bigger swing, no carry-through, the old timing.
    for cid in [c for c in module.CLIPS if c not in ('idle', 'move') and c[0] in 'abs']:
        raw = module.CLIPS[cid]; out['p' + cid] = dict(raw, title='P ' + raw['title'], alias_of=cid, snappy=0.0, plain=True)
    # 화려한 평타 (user, 2026-11-20: 'every troop type showy, the way 여포 was done'). The big moves of a type - the turns, the leaps,
    # the double blows - were written as skills, and a hero only ever shows the one that is his. Each of them is also offered
    # as a basic attack under the id cN (= sN), so a hero's three attacks can include one. Shouts and orders (event 발동) are not.
    for cid in [c for c in out if c[0] == 's' and c[1:].isdigit()]:
        if out[cid].get('event') != '발동' and not out[cid].get('spin') and not is_spin(out[cid]) and 'c' + cid[1:] not in out: out['c' + cid[1:]] = dict(out[cid], title='C' + out[cid]['title'][1:], alias_of=cid)
    return out

def rig_of(m):
    import render
    neutral = os.path.join(sm.WORK, 'inputs', 'request', m.BODY)
    return m.rig(neutral) if hasattr(m, 'rig') else render.FootRig(sm.Body(neutral), m.WEAPON)

WEAPON_WORDS = ('tip', 'butt', 'collar', 'blade', 'sword', 'spear', 'glaive', 'chain', 'fan', 'bow', 'arrow', 'sickle', 'shield', 'weight', 'head_end')
def weapon_joint(name): return any(w in name for w in WEAPON_WORDS) and not name.startswith(('r_', 'h_')) and name not in ('head_top',)

def check(module, rig, clip):
    import render
    ps = clip['poses']; solved = [rig.solve(p) for p in ps]; frames = [j for j, _ in solved]; issues = [i for _, i in solved]
    if hasattr(rig, 'post'): rig.post(frames, ps)
    r = render.qa(rig, frames, clip['support'], issues, treadmill=clip.get('treadmill', False), canvas_shift=getattr(module, 'CANVAS_SHIFT', None), overhead=clip.get('overhead', False), weapon_cut=CUT, balance_slack=LEAN)
    return r['fail']

def bake(families=None):
    import render
    from overview import FAMILIES
    t = dict(table())
    for fam in families or FAMILIES:
        t.pop(fam, None); json.dump(t, open(TABLE, 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)      # import the family as written
        global _table; _table = None
        for k in [k for k in sys.modules if k.startswith('clips.')]: del sys.modules[k]
        m = importlib.import_module('clips.' + fam); rig = rig_of(m)
        raw = getattr(m, 'RAW', m.CLIPS); got = {}
        for cid, clip in raw.items():
            if cid == 'idle': continue
            base = dict(clip, snappy=None); base.pop('snappy')
            for f in ((EXTRA[fam],) if fam in EXTRA and cid != 'move' else ()) + LADDER:
                c = (make_move if cid == 'move' else make)(base, f, rig); fail = check(m, rig, c)
                if not fail: got[cid] = f; break
            else: got[cid] = None      # even the timing-only version fails: left exactly as written
        t[fam] = {k: v for k, v in got.items() if v is not None}
        print('%-16s %s' % (fam, '  '.join('%s %s' % (k, '-' if v is None else ('%.2f' % v).rstrip('0').rstrip('.')) for k, v in got.items())), flush=True)
        json.dump(t, open(TABLE, 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
    _table = None

if __name__ == '__main__':
    bake(sys.argv[1:] or None)
