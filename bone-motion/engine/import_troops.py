"""The four basic soldiers (sword, spear, spear and shield, bow) from their generated sheets -> 256x256 front / side / back.

    python -X utf8 bone-motion/engine/import_troops.py <folder with the sheets> [sword|spear|shield|archer ...]
    (without the sheets it works from art-in/base-sheets, the copies kept at the drawing's own pixel size)
    -> bone-motion/art-in/base_swordsman, base_spearman, base_shield, base_archer  (+ sheet-check.png in each)

The sheets are read by import_sheet.py (order on these sheets: side | back | front). What this file adds is the repair the
side views needed (user 2026-11-20: "the weapon is in an odd place in the side views of spear, shield and bow"):
  spear   the spear stood behind the back. It is taken off, and the front view's spear is laid through the fist the side view
          already has. Nothing is added to the figure: no extra fist, no arm (user: "leave the arms alone").
  shield  the sheet's own side figure, with only its broken spear taken off; the spear is laid over the body and under the
          shield. The spear is cut to the spear-and-shield bones' 104 px in all three views (it was 132).
  bow     the side view had no bow. The back view's bow is laid through the fist the side view already has.
  sword   the side and front views had a cape and the back view none. The cape is taken off (basic troops have no cape).
          The blade is brought to the back view's size in all three (see match_swords).
All work is done at the drawing's own pixel size, before the 1.5x enlargement.
"""
import os, sys
from collections import deque
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm, import_sheet as S

SHEETS = {'sword': '21t6fz21t6fz21t6', 'spear': 'e9s0ele9s0ele9s0', 'spear_old': 'bbz87gbbz87gbbz8', 'shield': '3sk7v13sk7v13sk7', 'shield_old': '84vsnv84vsnv84vs', 'archer': 'mdnh87mdnh87mdnh', 'archer_old': '5lfgg85lfgg85lfg'}
OUT = {'sword': 'base_swordsman', 'spear': 'base_spearman', 'shield': 'base_shield', 'archer': 'base_archer'}
CLEAR = (0, 0, 0, 0)

def dark(p): return p[3] and sum(p[:3]) < 180
def parts(im, test):
    px = im.load(); left = {(x, y) for y in range(im.height) for x in range(im.width) if test(px[x, y])}; out = []
    while left:
        q = deque([left.pop()]); part = set(q)
        while q:
            x, y = q.popleft()
            for n in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if n in left: left.discard(n); part.add(n); q.append(n)
        out.append(part)
    return out

def pockets(im):
    """Checkerboard shut in by the figure (between a spear and a skirt, between a bow and its string): a patch of exactly
    neutral grey. Hair and steel are never exactly neutral on these sheets."""
    px = im.load()
    for c in parts(im, lambda p: p[3] and max(p[:3]) - min(p[:3]) < 9 and S.GROUND[0] - 5 <= p[0] <= S.GROUND[1] + 5):
        m = np.mean([px[p][:3] for p in c], axis=0)
        if len(c) >= 5 and m.max() - m.min() <= 2:
            for p in c: px[p] = CLEAR
    return im

FAR = -3      # side view: the column a far-hand spear stands at. Just in front of the body, so that it is not wholly hidden
KEPT = os.path.join(sm.WORK, 'art-in', 'base-sheets')      # the sheets read back at their own pixel size, kept beside the art

def read(folder, name):
    """The three views at the drawing's own pixel size. They are kept in art-in/base-sheets the first time a sheet is read,
    so the troops can be rebuilt after the generated sheet itself is gone (the Downloads copies were deleted 2026-11-20)."""
    path = os.path.join(folder, 'Gemini_Generated_Image_%s.png' % SHEETS[name]); views = ('side', 'back', 'front')
    if os.path.exists(path):
        S.sample_ground(path); figs = [S.cut_out(S.native(b, 11.2)) for b in S.bands(path, 11.2, 105.5)]; os.makedirs(KEPT, exist_ok=True)
        for v, f in zip(views, figs): f.save(os.path.join(KEPT, '%s_%s.png' % (name, v)))
    else:
        S.GROUND[:] = [110, 198]; figs = [Image.open(os.path.join(KEPT, '%s_%s.png' % (name, v))).convert('RGBA') for v in views]
    return dict(zip(views, [pockets(f) for f in figs]))

def outline_colour(im): return min((p for p in im.getdata() if p[3]), key=lambda p: sum(p[:3]))

def canvas(im, left=0, top=0, right=0, bottom=0):
    out = Image.new('RGBA', (im.width + left + right, im.height + top + bottom), CLEAR); out.alpha_composite(im, (left, top)); return out

def spear_sprite(front, rows):
    """The spear alone, from the spearman's front view (columns 0-6): head rows 0-23 as drawn, then a plain shaft."""
    px = front.load(); out = Image.new('RGBA', (7, rows), CLEAR); o = out.load(); k = outline_colour(front)
    for y in range(24):
        for x in range(7): o[x, y] = px[x, y]
    for x in range(7): o[x, 18] = px[x, 17]                      # two rows of the blade lost their outline on the sheet
    o[0, 19] = CLEAR; o[1, 19] = k; o[6, 19] = k; o[1, 20] = CLEAR; o[2, 20] = k; o[5, 20] = k
    for y in range(24, rows):
        for x in range(2, 6): o[x, y] = px[x, 40] if y < rows - 1 else k
    return out

def strip_rear_spear(side):
    """Spearman's side view: the spear stood behind the back in columns 21-27. Take it off and close the body's outline."""
    im = side.copy(); px = im.load(); k = outline_colour(im)
    for y in range(im.height):
        for x in range(21, im.width):
            if x >= 22 or y < 16: px[x, y] = CLEAR
    for y in range(im.height):
        if px[21, y][3] and not dark(px[21, y]): px[22, y] = k
    for y in range(1, im.height - 1):                              # the outline's corners
        if not px[22, y][3] and px[22, y - 1][3] and px[22, y + 1][3]: px[22, y] = k
    return im.crop((0, 5, 23, im.height))                          # rows 0-4 held only the spear's point

def fist(im, box):
    """A fist cut from the figure (its near hand), to put on a weapon held in front."""
    f = im.crop(box); px = f.load()
    for y in range(f.height):
        for x in range(f.width):
            p = px[x, y]
            if p[3] and not dark(p) and not (p[0] > 170 and p[0] > p[2] + 30): px[x, y] = CLEAR      # keep skin and outline only
    return f

def hold_in_front(body, weapon, hand, grip_x, hand_row, gap=0, arm=None):
    """Set `weapon` upright in front of (left of) the body, its foot on the ground line, with the fist over it at hand_row.
    grip_x = the weapon column the fist is centred on. Returns the picture and how far the body moved right."""
    pad = max(weapon.width, hand.width) + gap + 2; top = max(0, weapon.height - body.height); out = canvas(body, left=pad, top=top)
    hx = pad - gap - hand.width; wx = hx + hand.width // 2 - grip_x; under = Image.new('RGBA', out.size, CLEAR)
    under.alpha_composite(weapon, (wx, out.height - weapon.height))
    if arm: under.alpha_composite(arm, (hx + hand.width - 1, top + hand_row + 1))
    under.alpha_composite(hand, (hx, top + hand_row)); under.alpha_composite(out); return under, pad

def hold_in_hand(body, weapon, grip_x, box, top=None, over=None):
    """Side view, nothing added to the figure (user 2026-11-20: "leave the arms alone, just attach the weapon"): the weapon
    is laid upright over the body so that it runs through the fist the drawing already has (box), and that fist is put back
    on top of it. top = the weapon's top row (default: its foot on the ground line). over = a piece drawn above the weapon
    as well (the shield). Returns the picture; the body does not move sideways."""
    up = max(0, weapon.height - body.height) if top is None else max(0, -top); out = canvas(body, top=up)
    x = (box[0] + box[2]) // 2 - grip_x; y = out.height - weapon.height if top is None else top + up
    out.alpha_composite(weapon, (x, y)); out.alpha_composite(fist(body, box), (box[0], box[1] + up))
    if over: out.alpha_composite(over, (0, up))
    return out

def res_spear(rows, ink):
    """The spear of the weapon sheet the user supplied (art-in/base-sheets/res_spear.png, 7 x 42 at its own pixel size), at
    the length asked for: its head as drawn, then its shaft row repeated. The sheet's blade is the same grey as its
    checkerboard, so the cut-out lost the blade's right outline and left grey specks: those are redrawn here."""
    r = Image.open(os.path.join(KEPT, 'res_spear.png')).convert('RGBA'); px = r.load(); out = Image.new('RGBA', (7, rows), CLEAR); o = out.load()
    for y in range(17):
        xs = [x for x in range(1, 6) if px[x, y][3] and sum(px[x, y][:3]) > 300] if y >= 2 else []      # the steel of this row
        if y < 2 or not xs: o[3, y] = o[4, y] = ink; continue
        if y < 15: xs = [x for x in xs if 2 <= x <= 5]                                             # the blade is 4 wide at most; row 15 is its foot
        for x in xs: o[x, y] = px[x, y]
        o[min(xs) - 1, y] = ink; o[max(xs) + 1, y] = ink
    for x in range(1, 7): o[x, 17] = ink; o[x, 19] = ink; o[x, 18] = px[3, 18] if 1 < x < 6 else ink
    for y in range(20, rows):
        o[2, y] = ink; o[5, y] = ink; o[3, y] = px[3, 25] if y < rows - 1 else ink; o[4, y] = px[4, 25] if y < rows - 1 else ink
    return out

def res_bow(ink):
    """The supplied sheet's bow (10 x 39), turned to face left: wood and outline only (the grey between limb and string was
    checkerboard), the outline in the figures' own ink."""
    r = Image.open(os.path.join(KEPT, 'res_bow.png')).convert('RGBA'); px = r.load(); out = Image.new('RGBA', r.size, CLEAR); o = out.load()
    for y in range(r.height):
        for x in range(r.width):
            p = px[x, y]
            if p[3] and (dark(p) or p[0] > p[2] + 25): o[r.width - 1 - x, y] = ink if dark(p) else p
    return out

def hold_behind(body, weapon, x):
    """Side view, weapon in the far hand (user 2026-11-20: "it goes on the other arm: the spearman's will be overlapped by the
    body"): the weapon stands upright at column x with its foot on the ground line, and the figure is drawn over it."""
    left = max(0, -x); up = max(0, weapon.height - body.height); out = Image.new('RGBA', (body.width + left, body.height + up), CLEAR)
    out.alpha_composite(weapon, (x + left, out.height - weapon.height)); out.alpha_composite(body, (left, up)); return out, left

def shorten(im, cols, shaft, head_bottom, hand_top, k):
    """Cut k rows out of an upright spear's shaft above the hand: the head comes down by k."""
    src = im.copy(); s = src.load(); px = im.load()
    for y in range(hand_top):
        for x in cols:
            from_head = 0 <= y - k <= head_bottom
            if y - k < 0: px[x, y] = CLEAR
            elif from_head:
                if s[x, y - k][3] or y <= head_bottom or x in shaft: px[x, y] = s[x, y - k]
            elif x not in shaft and y <= head_bottom: px[x, y] = CLEAR
    return im.crop(im.getbbox())

def disc(im, cx, cy, rx, ry):
    out = Image.new('RGBA', im.size, CLEAR); o = out.load(); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1: o[x, y] = px[x, y]
    return out

def strip_front_cape(front):
    """Swordsman's front view: the cape showed beside the legs (left of column 14 and right of column 40). Its red goes, and
    then every outline pixel there that no longer borders anything."""
    im = front.copy(); px = im.load(); zone = lambda x, y: (x <= 15 and 47 <= y <= 71) or (x >= 41 and 59 <= y <= 71)
    for y in range(im.height):
        for x in range(im.width):
            p = px[x, y]
            if zone(x, y) and p[3] and p[0] > p[1] + 40 and p[0] > p[2] + 40 and p[1] < 110: px[x, y] = CLEAR
    lone = [(x, y) for y in range(im.height) for x in range(im.width) if zone(x, y) and dark(px[x, y]) and not any(
        0 <= x + i < im.width and 0 <= y + j < im.height and px[x + i, y + j][3] and not dark(px[x + i, y + j]) for i, j in ((1, 0), (-1, 0), (0, 1), (0, -1)))]
    for p in lone: px[p] = CLEAR
    return im

def match_swords(t):
    """Swordsman: the blade was 23 rows in the front and side views and 18 in the back view, where it also ended above the
    ground. The back view's is the sword bones' 40 px, so the other two are brought to it (user 2026-11-20: "the sword's size
    and place need a little correcting").
      front  the blade is replaced by the back view's, mirrored, under the same guard
      side   five straight rows are cut out of the blade below the guard and the rest comes up"""
    back = t['back']; b = back.load(); front = canvas(strip_front_cape(t['front']), left=1); f = front.load()
    for y in range(59, 82):
        for x in range(0, 14 if y > 70 else 13): f[x, y] = CLEAR                # the old blade (columns moved right by the 1 px pad)
    for y in range(58, 76):
        for x in range(35, 46):
            if b[x, y][3]: f[44 - x + 1, y + 1] = b[x, y]
    side = t['side'].copy(); s = side.load()
    for y in range(59, 82):
        for x in range(0, 11): s[x, y] = s[x, y + 5] if y + 5 < 82 else CLEAR
    for y in range(71, 82):                                        # the cape's dark red still showed between the legs
        for x in range(26, 33):
            p = f[x, y]
            if p[3] and (p[0] > p[1] + 12 and p[0] > p[2] + 8 or (dark(p) and y < 77 and x not in (26, 32))): f[x, y] = CLEAR
    ink = outline_colour(front); f[28, 69] = ink                   # what was left of the cape's edge beside the legs and the blade
    for x, y in [(10, 59), (10, 60), (10, 61), (10, 62), (15, 72), (16, 72), (40, 72), (41, 72), (42, 72), (43, 72), (40, 73), (41, 73), (17, 74), (43, 78), (4, 76)]: f[x, y] = CLEAR
    for y in range(front.height):                                  # grey specks on the outside of the outline (half-blended cells)
        for x in range(front.width):
            p = f[x, y]
            if p[3] and not dark(p) and max(p[:3]) - min(p[:3]) < 22 and sum(1 for i, j in ((1, 0), (-1, 0), (0, 1), (0, -1)) if not (0 <= x + i < front.width and 0 <= y + j < front.height) or not f[x + i, y + j][3]) >= 2: f[x, y] = CLEAR
    for c in parts(front, lambda p: p[3] > 0):                     # and specks of its outline
        if len(c) < 8:
            for p in c: f[p] = CLEAR
    return front, side

def plain_shaft(front, pattern, top):
    """Front view: the shaft was mottled on the sheet. Above and below the hand it is redrawn with one plain row."""
    px = front.load()
    for y in list(range(top, 53)) + list(range(62, front.height - 1)):
        for x in range(2, 6): px[x, y] = pattern[x - 2]
    return front

def feet_x(im, skip=()):
    """Middle of the shoes: the bottom rows, leaving out the columns a weapon stands in."""
    px = im.load(); xs = [x for x in range(im.width) if x not in skip and any(px[x, y][3] for y in range(im.height - 4, im.height))]
    return (min(xs) + max(xs)) / 2.0

def finish(name, views, feet, post={}):
    d = os.path.join(sm.WORK, 'art-in', OUT[name]); os.makedirs(d, exist_ok=True); order = ('front', 'side', 'back')
    figs = S.palette([views[v] for v in order], 56); check = Image.new('RGBA', (768 * 3, 768), (200, 198, 185, 255))
    for k, (v, f) in enumerate(zip(order, figs)):
        big = S.rescale(f, 1.5); big = post[v](big) if v in post else big; out = Image.new('RGBA', (256, 256), CLEAR)
        out.alpha_composite(big, (int(round(128 - feet[v] * 1.5)), 224 - big.height)); out.save(os.path.join(d, v + '.png')); bb = out.getbbox()
        print('%-14s %-5s %dx%d  캔버스 %s' % (OUT[name], v, bb[2] - bb[0], bb[3] - bb[1], bb)); check.alpha_composite(out.resize((768, 768), Image.NEAREST), (k * 768, 0))
    check.save(os.path.join(d, 'sheet-check.png'))

if __name__ == '__main__':
    folder = sys.argv[1]; only = sys.argv[2:] or list(SHEETS)
    spear = read(folder, 'spear_old'); body = strip_rear_spear(spear['side'])              # rows now start at the helmet: 82 high
    hand = fist(spear['side'], (11, 56, 20, 64)); long_spear = spear_sprite(spear['front'], 88); short_spear = spear_sprite(spear['front'], 69)
    pattern = [spear['front'].getpixel((x, 40)) for x in range(2, 6)]; spear['front'] = plain_shaft(spear['front'], pattern, 24)
    if 'spear' in only:
        # second sheet (2026-11-20): its side view already holds the spear in front, in the hand. It faces right, so it is
        # only turned to face left; nothing is repaired. The first sheet still gives the body the sword and shield sides use.
        t = read(folder, 'spear'); side = t['side'].transpose(Image.FLIP_LEFT_RIGHT); t['front'] = plain_shaft(t['front'], pattern, 24) if '--plain' in sys.argv else t['front']
        finish('spear', {'front': t['front'], 'side': side, 'back': t['back']},
               {'front': feet_x(t['front'], range(0, 8)), 'side': feet_x(side, range(0, 8)), 'back': feet_x(t['back'], range(t['back'].width - 8, t['back'].width))})
    if 'shield' in only:
        # second sheet (2026-11-20): its side view already holds the spear in front, in the hand. Used as drawn; the only
        # change is the spear's length, 132 -> 104 px (the spear-and-shield bones) in all three views.
        t = read(folder, 'shield'); px = t['side'].load(); bp = body.load()
        # the side view alone had a plume on the helmet (user 2026-11-20: take it off). The helmet under it is the first
        # spearman sheet's, the same drawing 8 px to the left and 6 rows up (after its crop), so that one is laid in.
        for y in range(4, 20):
            for x in range(8, t['side'].width): px[x, y] = bp[x - 8, y - 6] if 0 <= x - 8 < body.width and y - 6 >= 0 else CLEAR
        for y in range(20, 23):
            for x in range(31, t['side'].width): px[x, y] = CLEAR
        side = shorten(t['side'], range(0, 8), range(2, 6), 23, 50, 19)
        front = shorten(t['front'], range(0, 8), range(2, 6), 22, 52, 19); back = shorten(t['back'], range(44, 52), range(46, 50), 22, 41, 19)
        finish('shield', {'front': front, 'side': side, 'back': back},
               {'front': feet_x(front, range(0, 8)), 'side': feet_x(side, range(0, 8)), 'back': feet_x(back, range(44, 52))})
    if 'archer' in only:
        # second sheet (2026-11-20): its side view already holds the bow in front. Used as drawn; nothing is repaired.
        t = read(folder, 'archer'); side = t['side']; px = side.load(); k = outline_colour(side)
        for y in range(46, 64):                                    # checkerboard left between the lower limb and the body
            for x in range(8, 17):
                p = px[x, y]
                if p[3] and not dark(p) and max(p[:3]) - min(p[:3]) < 25: px[x, y] = CLEAR
        def string(big):                                           # the string was a hair line on the sheet and did not survive: tip to tip,
            b = big.load(); ink = outline_colour(big)              # behind the figure, 1 px wide at the final size
            for y in range(12, 105):
                x = int(round(8 + (y - 12) * (23 - 8) / 92.0))
                if not b[x, y][3]: b[x, y] = ink
            return big
        finish('archer', {'front': t['front'], 'side': t['side'], 'back': t['back']},
               {'front': feet_x(t['front'], range(t['front'].width - 9, t['front'].width)), 'side': feet_x(t['side'], range(0, 12)), 'back': feet_x(t['back'], range(0, 12))}, post={'side': string})
    if 'sword' in only:
        t = read(folder, 'sword'); t['front'], s = match_swords(t); px = s.load(); side = Image.new('RGBA', s.size, CLEAR); o = side.load(); bp = body.load()
        for y in range(s.height):                                                      # the back half comes from the spearman (same body, no cape)
            for x in range(s.width):
                bx = x - 8
                o[x, y] = px[x, y] if x < 20 else bp[bx, y] if 0 <= bx < body.width and y < body.height else CLEAR
        side = side.crop(side.getbbox())
        finish('sword', {'front': t['front'], 'side': side, 'back': t['back']}, {'front': feet_x(t['front'], range(0, 13)), 'side': feet_x(side, range(0, 9)), 'back': feet_x(t['back'], range(t['back'].width - 8, t['back'].width))})
