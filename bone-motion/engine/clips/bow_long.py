"""궁, 기본 궁병용 (user 2026-11-20). The archer's drawing carries a bow as tall as he is (116 px); the bow type's bow is 68 px,
and because a bow is sent to PixelLab at the bone's size, every clip came out with a small bow. Same clips, long bow."""
from clips._variant import variant
exec(variant('bow', [("WEAPON = Bow(limb=34.0, draw=46.0, arrow=52.0)", "WEAPON = Bow(limb=58.0, draw=46.0, arrow=52.0)"),
                     ("TITLE = '궁'", "TITLE = '궁 (기본 궁병, 긴 활)'")]), globals())
