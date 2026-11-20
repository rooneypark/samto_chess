"""한손 검, 기본 검병용 (user 2026-11-20: "make one separately for that character"). The shared one-hand guard holds the sword
upright beside the far hip; with the troop's short sabre (29 px) the whole blade was behind the body in the side view, so
PixelLab drew the sword only at the moment of the cut. Here the guard holds it out in front, point forward and up, where
all three views see it. The cuts themselves are the base type's."""
from clips._variant import variant
exec(variant('sword', [("GUARD = pose()", "GUARD = pose(sword=(-17, 27, 54), sword_aim=(-38, 42))"),
                       ("TITLE = '한손 검'", "TITLE = '한손 검 (기본 검병)'")]), globals())
