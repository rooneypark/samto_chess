"""사슬낫 (감녕 전용 변형). 사슬·채찍 유형의 장수지만 통합가이드 12절의 감녕은 사슬을 던져 휘두르지 않는다:
the sickle is in the RIGHT hand and does short hooking cuts, the spare chain is gathered in the LEFT hand.
So this is not a twelfth type but 감녕's own variant: the body moves of the one-hand blade with a 30 px sickle and
the chain drawn from its handle to the left hand.

    A1 안쪽 걸어베기   A2 올려 걸기   A3 깊이 내려찍기   B1 찌르고 올려 걸기   B2 도약 내려찍기   B3 돌아 걸기
    S1 금범적: knees and chest folded low, then a rough upward hook from below and outside
    S2 낮게 휩쓸어 걸기 (여분)
"""
import types
from props import Blade, Combo
from clips import sword as base
from clips.kit import *
from clips.blades import blade_set
from clips.common import idle_clip
from clips.cycles import foot_move

TITLE = '사슬낫 (감녕)'
BODY = base.BODY

class Tether:
    """The spare chain: one line from the sickle's handle to the left hand that holds the gathered links."""
    segments = [('sickle_butt', 'tether_end', 'chain')]; ends = ('sickle_butt', 'tether_end')
    def sockets(self, p): return {}
    def joints(self, p): return {'tether_end': p['hand.L']}

WEAPON = Combo(Blade('sickle', 'R', total=30.0, grip=6.0, collar=16.0), Tether())

def _conv(p):
    d = dict(p); d['sickle'] = d.pop('sword'); d['sickle_aim'] = d.pop('sword_aim'); return d
_ns = types.SimpleNamespace(**{k: _conv(getattr(base, k)) for k in ('GUARD', 'A1_LIFT', 'A1_COIL', 'A1_STEP', 'A1_HIT', 'A1_OVER', 'A1_SETTLE', 'A1_PULL', 'A1_BACK')})
GUARD = _ns.GUARD
_moves, _K, _at = blade_set(_ns, 'sickle', 24.0)
def _named(m, title, notes, **kw): d = dict(_moves[m]); d['title'] = title; d['notes'] = notes; d.update(kw); return d

CLIPS = {
 'move': foot_move(GUARD),
 'idle': idle_clip(GUARD),
 'a1': _named('level', 'A1 안쪽 걸어베기', '낫을 허리 뒤 바깥으로 당겼다가 짧게 안쪽으로 걸어 벤다. 사슬은 던지지 않고 왼손에 모아 쥔다.'),
 'a2': _named('rise', 'A2 올려 걸기', '낫을 몸 앞 아래로 내렸다가 아래에서 위로 걸어 올린다.'),
 'a3': _named('cleave', 'A3 깊이 내려찍기', '낫을 어깨 위로 들었다가 깊이 내려앉으며 찍는다.', durations=D),
 'b1': _named('double', 'B1 찌르고 올려 걸기', '6번에 낫끝으로 찌르고 9번에 아래에서 걸어 올린다.'),
 'b2': _named('leap', 'B2 도약 내려찍기', '5~7번에 두 발이 뜨고, 위에서 내려찍으며 8번에 착지한다.'),
 'b3': _named('spin', 'B3 돌아 걸기', '낮게 뜬 채 한 바퀴 돌고 그 힘으로 내딛으며 9번에 걸어 벤다.'),
 's1': _named('ambush', 'S1 금범적', '감녕 전법. 무릎과 상체를 크게 접어 낮게 들어갔다가, 골반과 가슴을 비틀어 풀며 아래에서 바깥 위로 낫을 거칠게 걸어 올린다. 도착 칸 이동은 게임이 한다.'),
 's2': _named('sweep', 'S2 낮게 휩쓸어 걸기', '여분 전법. 두 무릎을 접고 낫을 뒤로 뺐다가 허리 높이에서 폭넓게 한 번 휩쓴다.'),
}
