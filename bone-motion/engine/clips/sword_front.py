"""한손 검, 동탁용 (user 2026-11-20: a type of its own for a character whose weapon hides in the guard). 동탁's long cape covers the
far hip, so in the side view the sabre of the shared guard is under the cape for the whole of the wind-up and return: the
sword showed only for the three frames of the cut. Guard held out in front like 기본 검병's, a little higher for his longer blade."""
from clips._variant import variant
exec(variant('sword', [("GUARD = pose()", "GUARD = pose(sword=(-17, 27, 56), sword_aim=(-34, 50))"),
                       ("TITLE = '한손 검'", "TITLE = '한손 검 (동탁)'")]), globals())
