"""Cavalry rig: a horse and a rider as two skeletons joined at the seat.

The horse is a rigid trunk (position + pitch) with a neck/head chain and four legs solved from where each hoof
stands. The rider sits on the horse's seat contact, keeps his feet in the stirrups (fixed to the horse's trunk),
and has the same hips / chest / arms model as the foot soldier. Names follow the standard-bone JSON (h_*, r_*).
"""
import json, math
from samto_motion import add, sub, mul, dot, length, unit, lerp, frame, two_bone

def pitch(v, degrees):
    """Rotate about the lateral axis; + lifts whatever is in front (+y)."""
    a = math.radians(degrees); x, y, z = v
    return (x, y * math.cos(a) - z * math.sin(a), z * math.cos(a) + y * math.sin(a))

class Glaive:
    """월도 / 화극. p['main'] = the main (right) hand's socket, p['axis'] = direction from butt to tip,
    p['support'] = distance of the support hand's socket below the main hand, p['support_on'] = 1 while the left
    hand is on the shaft and 0 while it is free (a declared release), blended in between."""
    def __init__(self, total=148.0, main_socket=85.0, collar=112.0): self.total, self.main_socket, self.collar = total, main_socket, collar
    def point(self, p, along): return add(p['main'], mul(unit(p['axis']), along - self.main_socket))
    def sockets(self, p):
        return {'R': p['main'], 'L': lerp(p['hand.L'], self.point(p, self.main_socket - p['support']), p['support_on'])}
    def joints(self, p): return {'glaive_butt': self.point(p, 0), 'glaive_collar': self.point(p, self.collar), 'glaive_tip': self.point(p, self.total)}
    segments = [('glaive_butt', 'glaive_collar', 'shaft'), ('glaive_collar', 'glaive_tip', 'blade')]
    ends = ('glaive_butt', 'glaive_tip')

class CavalryRig:
    def __init__(self, neutral_json, weapon):
        data = json.load(open(neutral_json, encoding='utf-8-sig')); n = {k: tuple(v) for k, v in data['coordinates'].items()}
        self.n, self.weapon = n, weapon; d = lambda a, b: length(sub(n[a], n[b]))
        self.root = n['h_body_root']
        self.trunk = ['h_ribcage', 'h_chest', 'h_croup', 'h_withers', 'h_seat_contact', 'h_seat_side.L', 'h_seat_side.R', 'h_tail_root',
                      'h_fore_shoulder.L', 'h_fore_shoulder.R', 'h_hind_hip.L', 'h_hind_hip.R']
        self.fore = (d('h_fore_shoulder.L', 'h_fore_knee.L'), d('h_fore_knee.L', 'h_fore_fetlock.L'), d('h_fore_shoulder.L', 'h_fore_elbow.L'))
        self.hind = (d('h_hind_hip.L', 'h_hind_stifle.L'), d('h_hind_stifle.L', 'h_hind_hock.L'))
        self.spine, self.neck_len, self.head_len, self.top_len = d('r_chest', 'r_pelvis'), d('r_neck', 'r_chest'), d('r_head', 'r_neck'), d('r_head_top', 'r_head')
        self.shoulder = sub(n['r_shoulder.L'], n['r_chest']); self.hip = sub(n['r_hip.L'], n['r_pelvis'])
        self.upper, self.forearm, self.hand = d('r_elbow.L', 'r_shoulder.L'), d('r_wrist.L', 'r_elbow.L'), d('r_hand.L', 'r_wrist.L')
        self.thigh, self.shin = d('r_knee.L', 'r_hip.L'), d('r_ankle.L', 'r_knee.L')
        self.lengths = [('r_shoulder' + s, 'r_elbow' + s, self.upper) for s in ('.L', '.R')] + [('r_hip' + s, 'r_knee' + s, self.thigh) for s in ('.L', '.R')] + \
                       [('r_knee' + s, 'r_ankle' + s, self.shin) for s in ('.L', '.R')] + [('r_pelvis', 'r_chest', self.spine)] + \
                       [('h_fore_shoulder' + s, 'h_fore_knee' + s, self.fore[0]) for s in ('.L', '.R')] + [('h_fore_knee' + s, 'h_fore_fetlock' + s, self.fore[1]) for s in ('.L', '.R')] + \
                       [('h_hind_hip' + s, 'h_hind_stifle' + s, self.hind[0]) for s in ('.L', '.R')] + [('h_hind_stifle' + s, 'h_hind_hock' + s, self.hind[1]) for s in ('.L', '.R')]
        self.planted = {'FL': 'h_fore_hoof.L', 'FR': 'h_fore_hoof.R', 'HL': 'h_hind_hoof.L', 'HR': 'h_hind_hoof.R'}
        self.weapon_ends = weapon.ends if weapon else None

    def solve(self, p):
        n = self.n; j = {}; issues = []
        root = p['h_root']; j['h_body_root'] = root; tilt = p['h_pitch']
        place = lambda name: add(root, pitch(sub(n[name], self.root), tilt))
        for name in self.trunk: j[name] = place(name)
        j['h_tail_tip'] = add(j['h_tail_root'], pitch((0, -9 - p.get('tail', 0), -27), tilt))
        # neck and head hang from the withers; + raises them
        neck = tilt + p['neck']
        for name in ('h_neck_mid', 'h_poll'): j[name] = add(j['h_withers'], pitch(sub(n[name], n['h_withers']), neck))
        for name in ('h_head', 'h_jaw', 'h_muzzle', 'h_ear_base.L', 'h_ear_tip.L', 'h_ear_base.R', 'h_ear_tip.R'):
            j[name] = add(j['h_poll'], pitch(sub(n[name], n['h_poll']), neck + p['head']))
        for s, key in (('.L', 'FL'), ('.R', 'FR')):
            x, y, lift = p[key]; hoof = (x, y, 4 + lift); fetlock = add(hoof, (0, -4, 4))
            knee, fetlock2, short = two_bone(j['h_fore_shoulder' + s], fetlock, self.fore[0], self.fore[1], (0, 1, 0.15))
            j['h_fore_knee' + s] = knee; j['h_fore_elbow' + s] = lerp(j['h_fore_shoulder' + s], knee, self.fore[2] / self.fore[0])
            j['h_fore_fetlock' + s] = fetlock2; j['h_fore_hoof' + s] = add(fetlock2, (0, 4, -4)); j['h_fore_ground' + s] = (x, y, 0)
            if short > 0.05: issues.append('%s fore leg %.1fpx short of its hoof' % (key, short))
        for s, key in (('.L', 'HL'), ('.R', 'HR')):
            x, y, lift = p[key]; hoof = (x, y, 4 + lift); fetlock = add(hoof, (0, -4, 4)); hock = add(fetlock, (0, -3, 14))
            stifle, hock2, short = two_bone(j['h_hind_hip' + s], hock, self.hind[0], self.hind[1], (0, 1, -0.1))
            j['h_hind_stifle' + s], j['h_hind_hock' + s] = stifle, hock2
            j['h_hind_fetlock' + s] = add(hock2, (0, 3, -14)); j['h_hind_hoof' + s] = add(j['h_hind_fetlock' + s], (0, 4, -4)); j['h_hind_ground' + s] = (x, y, 0)
            if short > 0.05: issues.append('%s hind leg %.1fpx short of its hoof' % (key, short))
        # rider
        seat = add(j['h_seat_contact'], p['seat']); j['r_seat_root'] = seat
        pelvis = add(seat, sub(n['r_pelvis'], n['r_seat_root'])); j['r_pelvis'] = pelvis
        fp = frame(p['hip_turn'], p['hip_lean'], p.get('hip_side', 0)); fc = frame(p['chest_turn'], p['chest_lean'], p.get('chest_side', 0))
        fs = frame((p['hip_turn'] + p['chest_turn']) / 2, (p['hip_lean'] + p['chest_lean']) / 2, (p.get('hip_side', 0) + p.get('chest_side', 0)) / 2)
        fh = frame(p.get('head_turn', p['chest_turn'] * 0.15), p.get('head_lean', p['chest_lean'] * 0.4))
        j['r_chest'] = add(pelvis, fs((0, 0, self.spine))); j['r_neck'] = add(j['r_chest'], fc((0, 0, self.neck_len)))
        j['r_head'] = add(j['r_neck'], fh((0, 0, self.head_len))); j['r_head_top'] = add(j['r_head'], fh((0, 0, self.top_len))); j['r_nose'] = add(j['r_head'], fh((0, 17.0, -3)))
        grips = self.weapon.sockets(p) if self.weapon else {}
        if self.weapon: j.update(self.weapon.joints(p))
        for side, s in (('.L', 1), ('.R', -1)):
            sh = add(j['r_chest'], fc((self.shoulder[0] * s, self.shoulder[1], self.shoulder[2]))); j['r_shoulder' + side] = sh
            target = grips.get(side[1]) or p['hand' + side]
            elbow, hand, short = two_bone(sh, target, self.upper, self.forearm + self.hand, add(fc((9 * s, -6, -10)), p.get('elbow' + side, (0, 0, 0))))
            j['r_elbow' + side], j['r_hand' + side] = elbow, hand; j['r_wrist' + side] = add(elbow, mul(unit(sub(hand, elbow)), self.forearm))
            if short > 0.05: issues.append('rider %s hand %.1fpx short of its grip' % (side[1], short))
            hip = add(pelvis, fp((self.hip[0] * s, self.hip[1], self.hip[2]))); j['r_hip' + side] = hip
            ankle = place('r_ankle' + side)                                   # stirrup: fixed to the horse's trunk
            knee, ankle2, short = two_bone(hip, ankle, self.thigh, self.shin, (0.6 * s, 1, 0.25))
            j['r_knee' + side], j['r_ankle' + side] = knee, ankle2
            j['r_heel' + side] = add(ankle2, pitch(sub(n['r_heel' + side], n['r_ankle' + side]), tilt)); j['r_toe' + side] = add(ankle2, pitch(sub(n['r_toe' + side], n['r_ankle' + side]), tilt))
            if short > 0.05: issues.append('rider %s leg %.1fpx short of the stirrup' % (side[1], short))
        return j, issues

    def parts(self, j):
        out = [('h_croup', 'h_chest', 15.0, 'horse', 'trunk'), ('h_withers', 'h_poll', 8.0, 'horse', 'neck'), ('h_poll', 'h_muzzle', 6.5, 'horse', 'head'),
               ('h_tail_root', 'h_tail_tip', 3.0, 'horseR', 'tail')]
        for s, key in (('.L', 'horseL'), ('.R', 'horseR')):
            out += [('h_ear_base' + s, 'h_ear_tip' + s, 1.6, key, 'ear'),
                    ('h_fore_shoulder' + s, 'h_fore_knee' + s, 5.0, key, 'limb'), ('h_fore_knee' + s, 'h_fore_fetlock' + s, 3.4, key, 'limb'), ('h_fore_fetlock' + s, 'h_fore_hoof' + s, 3.6, key, 'foot'),
                    ('h_hind_hip' + s, 'h_hind_stifle' + s, 6.5, key, 'limb'), ('h_hind_stifle' + s, 'h_hind_hock' + s, 4.5, key, 'limb'),
                    ('h_hind_hock' + s, 'h_hind_fetlock' + s, 3.4, key, 'limb'), ('h_hind_fetlock' + s, 'h_hind_hoof' + s, 3.6, key, 'foot')]
        out += [('r_pelvis', 'r_chest', 12.0, 'mid', 'torso'), ('r_chest', 'r_neck', 6.0, 'mid', 'neck'), ('r_head', 'r_head', 18.5, 'mid', 'head'), ('r_nose', 'r_nose', 2.6, 'face', 'face'),
                ('r_shoulder.L', 'r_shoulder.R', 7.0, 'mid', 'girdle'), ('r_hip.L', 'r_hip.R', 8.0, 'mid', 'girdle')]
        for s in ('L', 'R'):
            out += [('r_shoulder.' + s, 'r_elbow.' + s, 5.0, s, 'limb'), ('r_elbow.' + s, 'r_wrist.' + s, 4.5, s, 'limb'), ('r_hand.' + s, 'r_hand.' + s, 4.0, s, 'hand'),
                    ('r_hip.' + s, 'r_knee.' + s, 6.5, s, 'limb'), ('r_knee.' + s, 'r_ankle.' + s, 5.5, s, 'limb'), ('r_heel.' + s, 'r_toe.' + s, 4.0, s, 'foot')]
        if self.weapon: out += [(a, b, {'shaft': 1.8, 'blade': 3.4}[kind], kind, 'weapon') for a, b, kind in self.weapon.segments]
        return out

    def volumes(self, j):
        return [('rider torso', j['r_pelvis'], j['r_chest'], 12.0), ('rider head', j['r_head'], j['r_head'], 18.5),
                ('rider right thigh', j['r_hip.R'], j['r_knee.R'], 6.5), ('rider right shin', j['r_knee.R'], j['r_ankle.R'], 5.5),
                ('horse trunk', j['h_croup'], j['h_chest'], 15.0), ('horse neck', j['h_withers'], j['h_poll'], 8.0), ('horse head', j['h_poll'], j['h_muzzle'], 6.5)]
