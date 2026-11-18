"""이동 (movement) cycles. A move clip is a 15-frame loop played in place: the game slides the unit across the board,
so the feet run on a treadmill (a planted foot travels backward under the body at constant speed).

One loop = two steps (left, right). Frame 1 is left-foot contact and frame 15 leads straight back into frame 1.
The weapon stays in the guard carry; it rides the body's bob instead of being re-posed.
"""
import math

CARRIED = ('rear', 'sword', 'swordR', 'swordL', 'spear', 'shield', 'chain', 'bow', 'hand.L', 'hand.R', 'main')

def _swing(u):                      # 0..1 -> 0..1, slow out of the ground and slow into contact
    return 0.5 - 0.5 * math.cos(math.pi * u)

def _leg(s, stride, lift, stance=0.5):
    """Foot path over one loop, s in 0..1 with contact at s = 0. Returns (y, air, heel). `stance` is the share of the
    loop the foot spends on the ground: 0.5 is a walk, below 0.5 both feet are in the air between steps (a run)."""
    if s < stance:                                                # on the ground: straight back under the body
        k = s / stance; heel = 6.0 * max(0.0, (k - 0.6) / 0.4)    # heel peels off before toe-off
        return stride - 2 * stride * k, 0.0, heel
    u = (s - stance) / (1 - stance)                               # in the air: heel kicks up behind, knee drives through
    return -stride + 2 * stride * _swing(u), lift * math.sin(math.pi * u) ** 0.8, 9.0 * (1 - u) ** 2

def foot_move(guard, stride=18.0, lift=9.0, lean=9.0, bob=1.6, sway=0.8, twist=10.0, swing=9.0, frames=15, ms=46, stance=0.4, drop=2.0, run_height=44.0, extra=None):
    """A combat run in guard for the foot and tactician bodies: long strides on a narrow track, body pitched forward,
    hips and chest counter-rotating, a moment in the air between steps. (The first version was a short, wide,
    upright walk and read as toddling; user review 2026-11-18.) `extra(pose, phase)` may add family-specific motion."""
    poses, supports = [], []
    for i in range(frames):
        s = i / frames; ph = 2 * math.pi * s; p = dict(guard)
        dz = -drop + bob * math.cos(2 * (ph - 2 * math.pi * (stance + 0.05)))      # lowest over the planted foot, highest in the air between steps
        x, y, z = guard['pelvis']; z = min(z, run_height)      # the guard stands tall; a run needs bent knees
        p['pelvis'] = (x + sway * math.sin(ph), y + 3.0, z + dz)
        p['hip_turn'] = guard['hip_turn'] * 0.6 + twist * math.cos(ph); p['chest_turn'] = guard['chest_turn'] * 0.8 - twist * 0.6 * math.cos(ph)
        p['hip_lean'] = guard['hip_lean'] + lean * 0.5; p['chest_lean'] = guard['chest_lean'] + lean + 1.2 * math.cos(2 * ph)
        down = []
        for side, offset in (('L', 0.0), ('R', 0.5)):
            fy, air, heel = _leg((s + offset) % 1.0, stride, lift, stance); g = guard['foot.' + side]
            p['foot.' + side] = dict(at=(g['at'][0] * 0.55, fy), yaw=g.get('yaw', 0) * 0.15, heel=heel, air=air)
            if air == 0.0: down.append(side)
        for k in CARRIED:                                          # carried things ride the body
            if k in guard and isinstance(guard[k], tuple) and len(guard[k]) == 3:
                a, b, c = guard[k]; back = swing * math.cos(ph) * (1 if k == 'hand.R' else -1) if k in ('hand.L', 'hand.R') else 0.0
                p[k] = (a + sway * 0.6 * math.sin(ph), b + 3.0 + back, c + dz * 0.8 + 0.8 * math.sin(2 * ph))
        if extra: extra(p, ph)
        poses.append(p); supports.append(tuple(down))
    return dict(title='이동', poses=poses, support=supports, durations=[ms] * frames, sheet=[0, 2, 4, 7, 9, 11], treadmill=True, loop=True)

def horse_move(guard, stride=14.0, lift=11.0, frames=15, ms=46, stance=0.42):
    """Trot: diagonal pairs (left fore + right hind, then right fore + left hind), two bounces per loop. The rider
    sinks into the saddle a moment after the horse comes down and carries the weapon steady."""
    poses, supports = [], []
    base = {k: guard[k] for k in ('FL', 'FR', 'HL', 'HR')}
    for i in range(frames):
        s = i / frames; ph = 2 * math.pi * s; p = dict(guard); down = []
        bounce = -2.2 * math.cos(2 * ph)                           # trunk is lowest as each diagonal lands
        x, y, z = guard['h_root']; p["h_root"] = (x, y + 1.0, z - 2.0 + bounce)
        p['h_pitch'] = 2.0 * math.sin(2 * ph); p['neck'] = -3.0 + 2.5 * math.cos(2 * ph + 0.6); p['head'] = -1.5 * math.cos(2 * ph + 1.0)
        for name, offset in (('FL', 0.0), ('HR', 0.03), ('FR', 0.5), ('HL', 0.53)):
            fy, air, _ = _leg((s + offset) % 1.0, stride, lift, stance); bx, by, _ = base[name]
            p[name] = (bx, by + fy, air)
            if air == 0.0: down.append(name)
        late = -1.3 * math.cos(2 * ph - 0.9)                       # the rider follows the bounce a little late
        p['seat'] = (0, 0, 0.8 + late * 0.5); p['hip_lean'] = 5.0; p['chest_lean'] = guard['chest_lean'] + 8.0 + 1.5 * math.cos(2 * ph - 0.9)
        for k in ('main', 'hand.L'):
            a, b, c = guard[k]; p[k] = (a, b + 1.0, c - 1.2 + bounce * 0.5 + late * 0.5)
        poses.append(p); supports.append(tuple(down))
    return dict(title='이동', poses=poses, support=supports, durations=[ms] * frames, sheet=[0, 2, 4, 7, 9, 11], treadmill=True, loop=True)
