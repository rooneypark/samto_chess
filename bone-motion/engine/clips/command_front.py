"""군령, 원소용 (user 2026-11-20: go ahead). 원소's long cape covers the far hip, so in the side view the sword of the shared guard
is under the cape through the wind-up and the return. Guard held out in front, as 동탁's (clips/sword_front.py)."""
from clips._variant import variant
exec(variant('command', [("GUARD = pose()", "GUARD = pose(sword=(-17, 27, 56), sword_aim=(-34, 50))"),
                         ("TITLE = '군령'", "TITLE = '군령 (원소)'")]), globals())
