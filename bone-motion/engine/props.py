"""Weapons and props for the foot rig. Each prop reads its own keys from the pose, says where the hands must be
(sockets), and adds its joints. A Combo carries several props at once (sword + shield, two swords)."""
import math
from samto_motion import add, sub, mul, dot, length, unit, lerp

def direction(aim):
    t, e = math.radians(aim[0]), math.radians(aim[1])
    return (math.sin(t) * math.cos(e), math.cos(t) * math.cos(e), math.sin(e))

class Blade:
    """One-hand weapon: p[name] = the hand's socket, p[name + '_aim'] = (turn, pitch). `grip` is how far the socket
    is from the butt end; `collar` is where the blade (or head) starts."""
    def __init__(self, name, hand, total, grip=6.0, collar=None, head='blade'):
        self.name, self.hand, self.total, self.grip = name, hand, total, grip; self.collar = grip + 3 if collar is None else collar
        self.segments = [(name + '_butt', name + '_collar', 'shaft'), (name + '_collar', name + '_tip', head)]; self.ends = (name + '_butt', name + '_tip')
    def sockets(self, p): return {self.hand: p[self.name]}
    def joints(self, p):
        a = direction(p[self.name + '_aim']); at = lambda d: add(p[self.name], mul(a, d - self.grip))
        return {self.name + '_butt': at(0), self.name + '_collar': at(self.collar), self.name + '_tip': at(self.total)}

class Shield:
    """Round shield strapped to a forearm: p['shield'] = that hand's socket, p['shield_aim'] = the way its face points."""
    def __init__(self, hand='L', radius=12.0):
        self.hand, self.radius = hand, radius; self.segments = [('shield_top', 'shield_bottom', 'shield')]; self.ends = ('shield_bottom', 'shield_top')
    def sockets(self, p): return {self.hand: p['shield']}
    def joints(self, p):
        a = direction(p['shield_aim']); up = unit(sub((0, 0, 1), mul(a, a[2]))); c = add(p['shield'], mul(a, 3))
        return {'shield_top': add(c, mul(up, self.radius)), 'shield_bottom': sub(c, mul(up, self.radius))}

class Combo:
    def __init__(self, *props):
        self.props = props; self.segments = [s for q in props for s in q.segments]; self.ends = props[0].ends
        self.flexible = any(getattr(q, 'flexible', False) for q in props)
    def sockets(self, p):
        out = {}
        for q in self.props: out.update(q.sockets(p))
        return out
    def joints(self, p):
        out = {}
        for q in self.props: out.update(q.joints(p))
        return out
    def post(self, frames, poses):
        for q in self.props:
            if hasattr(q, 'post'): q.post(frames, poses)

class Chain:
    """Chain or whip: rigid links that trail behind the hand. p[name] = handle socket, p[name + '_aim'] = where the
    wielder is throwing it. The links are not posed: each follows its place on the thrown line with a delay that grows
    toward the tip, then link lengths are restored from the handle outward (post()). p[name + '_taut'] = 0..1 pulls the
    links onto the thrown line: 1 on the frame the weighted end lands, so the tip is exactly where the throw points."""
    flexible = True
    def __init__(self, name='chain', hand='R', links=6, link=11.0):
        self.name, self.hand, self.links, self.link = name, hand, links, link
        self.segments = [('%s_%d' % (name, k), '%s_%d' % (name, k + 1), 'chain' if k < links - 1 else 'weight') for k in range(links)]
        self.ends = (name + '_0', '%s_%d' % (name, links))
    def sockets(self, p): return {self.hand: p[self.name]}
    def joints(self, p):
        a = direction(p[self.name + '_aim'])
        return {'%s_%d' % (self.name, k): add(p[self.name], mul(a, self.link * k)) for k in range(self.links + 1)}
    def post(self, frames, poses):
        key = lambda k: '%s_%d' % (self.name, k); ideals = [{k: j[key(k)] for k in range(self.links + 1)} for j in frames]
        state = dict(ideals[-1])
        for _pass in range(2):                       # the second pass starts from the end state, so the loop closes
            for j, ideal, p in zip(frames, ideals, poses):
                taut = p.get(self.name + '_taut', 0.0)
                previous = ideal[0]; state[0] = previous
                for k in range(1, self.links + 1):
                    f = 0.88 - 0.10 * k; target = lerp(state[k], ideal[k], f + (1 - f) * taut); target = (target[0], target[1], target[2] - 0.9 * k * (1 - taut))
                    node = add(previous, mul(unit(sub(target, previous)), self.link))
                    if node[2] < 2: node = (node[0], node[1], 2.0)
                    state[k] = node; j[key(k)] = node; previous = node

class Bow:
    """Bow in one hand, string drawn by the other. p['bow'] = bow hand socket, p['bow_aim'] = line of the shot,
    p['draw'] = 0..1, p['string_hand'] = 1 while the draw hand holds the string, p['arrow_on'] = 1 while an arrow is
    nocked, p['arrow_fly'] = how far a released arrow has travelled (0 = none in the air)."""
    def __init__(self, hand='L', draw_hand='R', limb=24.0, draw=27.0, arrow=36.0):
        self.hand, self.draw_hand, self.limb, self.draw, self.arrow = hand, draw_hand, limb, draw, arrow
        self.segments = [('bow_top', 'bow_grip', 'bow'), ('bow_grip', 'bow_bottom', 'bow'), ('bow_top', 'bow_nock', 'string'), ('bow_nock', 'bow_bottom', 'string'), ('arrow_tail', 'arrow_tip', 'arrow')]
        self.ends = ('bow_bottom', 'bow_top')
    def nock(self, p): return sub(p['bow'], mul(direction(p['bow_aim']), 5 + self.draw * p['draw']))
    def sockets(self, p):
        return {self.hand: p['bow'], self.draw_hand: lerp(p['hand.' + self.draw_hand], self.nock(p), p['string_hand'])}
    def joints(self, p):
        a = direction(p['bow_aim']); up = unit(sub((0, 0, 1), mul(a, a[2]))); bend = 5 + 7 * p['draw']
        top, bottom = add(sub(p['bow'], mul(a, bend)), mul(up, self.limb)), sub(sub(p['bow'], mul(a, bend)), mul(up, self.limb))
        nock = self.nock(p) if p['string_hand'] > 0.5 else lerp(top, bottom, 0.5)
        if p['arrow_on'] > 0.5: tail, tip = nock, add(nock, mul(a, self.arrow))
        elif abs(p['arrow_fly']) > 0.5: tail = add(p['bow'], mul(a, p['arrow_fly'])); tip = add(tail, mul(a, self.arrow))
        else: tail = tip = p['bow']
        return {'bow_top': top, 'bow_grip': p['bow'], 'bow_bottom': bottom, 'bow_nock': nock, 'arrow_tail': tail, 'arrow_tip': tip}
