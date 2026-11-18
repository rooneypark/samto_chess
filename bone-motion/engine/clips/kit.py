"""Shared helpers for building the full clip sets (평타 A/B 세트, 전법 S1..S6)."""
import math
from samto_motion import blend

STRIKE = (0.0, 100.0, 45.0)      # every attack that touches lands here: centre of the tile in front, chest height
D = [100, 90, 90, 100, 150, 45, 40, 50, 70, 170, 90, 90, 80, 80, 100]            # usual timing: slow wind-up, hit on frame 8
D_SKILL = [100, 100, 110, 120, 130, 190, 55, 45, 80, 130, 220, 100, 90, 90, 100]  # longer hold before and after
D_CAST = [100, 100, 110, 120, 120, 130, 180, 50, 80, 150, 220, 110, 100, 90, 100]

def direction(turn, pitch):
    t, e = math.radians(turn), math.radians(pitch)
    return (math.sin(t) * math.cos(e), math.cos(t) * math.cos(e), math.sin(e))

def reach_hand(reach, turn, pitch, over=0.0, strike=STRIKE):
    """Where a hand must be so that the weapon tip, `reach` px ahead of it along (turn, pitch), sits on the strike point
    (plus `over` px beyond it)."""
    d = direction(turn, pitch); return tuple(strike[i] + (over - reach) * d[i] for i in range(3))

def foot(at, yaw=0, heel=0, air=0): return dict(at=at, yaw=yaw, heel=heel, air=air)

def sup(air_L=(), air_R=()):
    return [tuple(s for s, a in (('L', air_L), ('R', air_R)) if i not in a) for i in range(15)]

def rot(v, theta):
    """Turn an (x, y) offset by theta degrees about the vertical axis (same sense as hip_turn)."""
    c, s = math.cos(math.radians(theta)), math.sin(math.radians(theta)); return (v[0] * c - v[1] * s, v[0] * s + v[1] * c)

def clip(title, keys, impact=8, support=None, durations=None, sheet=None, **kw):
    out = dict(title=title, keys=keys, impact=impact, support=support or sup(), durations=durations or D, sheet=sheet or [0, 4, 6, 7, 9, 12]); out.update(kw); return out

def posed(title, poses, impact, support, durations=None, sheet=None, **kw):
    out = dict(title=title, poses=poses, impact=impact, support=support, durations=durations or D, sheet=sheet or [0, 4, 6, 7, 9, 12]); out.update(kw); return out

__all__ = ['STRIKE', 'D', 'D_SKILL', 'D_CAST', 'direction', 'reach_hand', 'foot', 'sup', 'rot', 'clip', 'posed', 'blend']
