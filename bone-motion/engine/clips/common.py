"""Shared helpers for foot clips."""

def foot(at, yaw=0, heel=0, air=0): return dict(at=at, yaw=yaw, heel=heel, air=air)

def idle_clip(guard, **shift):
    """전투 대기: one slow breath on the guard pose. Pelvis sinks 1.4 px, chest leans 1.5 degrees, and whatever the hands
    hold sinks 1.6 px and dips 2.5 degrees with it (user review 2026-11-18: the weapon must move with the breath)."""
    low = dict(guard); x, y, z = guard['pelvis']; low['pelvis'] = (x, y, z - 1.4); low['chest_lean'] = guard['chest_lean'] + 1.5
    for k in ('rear', 'sword', 'swordR', 'swordL', 'spear', 'shield', 'chain', 'bow', 'hand.L', 'hand.R'):      # the weapon breathes with the body
        if k in guard and len(guard[k]) == 3: a, b, c = guard[k]; low[k] = (a, b + 0.6, c - 1.6)
    for k in guard:
        if k == 'aim' or k.endswith('_aim'): low[k] = (guard[k][0], guard[k][1] - 2.5)
    if 'axis' in guard: a, b, c = guard['axis']; low['axis'] = (a, b + 0.03, c - 0.02)
    low.update(shift)
    return dict(title='전투 대기', keys=[(0, guard, 'linear'), (7, low, 'inout'), (14, guard, 'inout')], support=[('L', 'R')] * 15, durations=[92] * 15, sheet=[0, 7])

def supports(air_left=(), air_right=()):
    """Support list for 15 frames; give the frame indices where each foot is off the ground."""
    return [tuple(s for s, air in (('L', air_left), ('R', air_right)) if i not in air) for i in range(15)]
