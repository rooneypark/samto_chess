"""기본 궁병: the tan cap and tan quilted armour -> the grey of the sword / spear / shield soldiers (user 2026-11-20: "make the
archer's clothes and helmet the same colour as the other three, so they match"). Leather (quiver, strap, bracers), the golden
trim, the bow, skin, sleeves and the red parts keep their colours.

    python -X utf8 bone-motion/engine/recolour_archer.py
    art-in/base_archer/{front,side,back}.png  ->  art-in/archer/{front,side,back}.png  (front and back mirrored: the bow goes to the
    left hand, where the bow bones hold it), and base-portraits/archer.png is recoloured in place from its own build.

What counts as the cloth: hue 30-41 deg, saturation 0.36-0.60, value >= 0.40. Leather and trim are more saturated (>= 0.61),
skin is redder (hue 25) and the sleeves are paler (<= 0.32), so the three do not overlap. The bow has the cloth's colours, so it
is left out by where it stands. Value 0.45-0.90 maps onto the soldiers' armour greys (72-142), a touch warm like theirs.
"""
import colorsys, os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm

def grey(p):
    h, s, v = colorsys.rgb_to_hsv(p[0] / 255.0, p[1] / 255.0, p[2] / 255.0)
    if not (30 <= h * 360 <= 41 and 0.36 <= s < 0.60 and v >= 0.40) or (v > 0.91 and s > 0.5): return None
    g = int(round(72 + (min(0.90, max(0.45, v)) - 0.45) / 0.45 * 70)); return (g, g - 1, g - 4, p[3])

def recolour(im, bow=lambda x, y: False):
    px = im.load(); n = 0
    for y in range(im.height):
        for x in range(im.width):
            p = px[x, y]
            if p[3] and not bow(x, y):
                q = grey(p)
                if q: px[x, y] = q; n += 1
    return n

def specks(im, bow):
    """Cloth pixels the rule missed (a little more saturated than the rest): if grey is on three of their four sides they are cloth."""
    px = im.load(); isgrey = lambda p: p[3] and abs(p[0] - p[1]) <= 2 and 0 <= p[0] - p[2] <= 5 and 70 <= p[0] <= 145
    for _ in range(2):
        todo = []
        for y in range(1, im.height - 1):
            for x in range(1, im.width - 1):
                p = px[x, y]
                if not p[3] or bow(x, y): continue
                h, sa, v = colorsys.rgb_to_hsv(p[0] / 255.0, p[1] / 255.0, p[2] / 255.0)
                if 28 <= h * 360 <= 42 and sa < 0.68 and v >= 0.4 and not isgrey(p) and sum(isgrey(px[x + i, y + j]) for i, j in ((1, 0), (-1, 0), (0, 1), (0, -1))) >= 3:
                    g = int(round(72 + (min(0.90, max(0.45, v)) - 0.45) / 0.45 * 70)); todo.append((x, y, (g, g - 1, g - 4, p[3])))
        for x, y, q in todo: px[x, y] = q

def portrait(im):
    """The portrait is painted in stronger colours than the sprite, so it goes by place: the cap is everything warm above the
    face; on the body the quilting is the less saturated warm colour (the strap and the trim, >= 0.65, stay leather and gold);
    the face, the neck and the arrows at the right are not touched."""
    px = im.load(); n = 0
    for y in range(im.height):
        for x in range(im.width):
            p = px[x, y]
            if not p[3]: continue
            h, sa, v = colorsys.rgb_to_hsv(p[0] / 255.0, p[1] / 255.0, p[2] / 255.0); warm = 22 <= h * 360 <= 42 and sa >= 0.3 and v >= 0.3
            cap = y < 37 and warm; body = y >= 64 and warm and sa < 0.65 and 26 <= h * 360 and not (22 <= x <= 74 and y < 84) and not (x >= 78 and y < 88)
            if cap or body:
                g = int(round(66 + (min(1.0, max(0.35, v)) - 0.35) / 0.65 * 84)); px[x, y] = (g, g - 1, g - 4, p[3]); n += 1
    return n

# ---- second pass (user, same day: "it is not completely grey; make all of it grey") --------------------------------------
# Everything warm on the figure goes to the soldiers' colours, by place instead of by shade: only the skin, the bow, the quiver
# with its arrows and the boot bands keep theirs. The golden trim becomes the soldiers' cream trim; the strap and the bracers
# become grey like the rest.
QUIVER = {'front': (88, 120, 111, 147), 'side': (143, 122, 165, 156), 'back': (108, 124, 143, 182)}
def everything(im, bow, keep, face=(0, 126, 255, 140), boots=205):
    px = im.load(); n = 0
    for y in range(im.height):
        for x in range(im.width):
            p = px[x, y]
            if not p[3] or bow(x, y) or y >= boots or (keep[0] <= x <= keep[2] and keep[1] <= y <= keep[3]): continue
            h, sa, v = colorsys.rgb_to_hsv(p[0] / 255.0, p[1] / 255.0, p[2] / 255.0); deg = h * 360
            if not (22 <= deg <= 46 and sa >= 0.28 and v >= 0.30): continue                       # not a warm colour: red, cream, dark, grey stay
            if deg < 28.5 and v > 0.88: continue                                                  # skin
            if face[0] <= x <= face[2] and face[1] <= y <= face[3]: continue                      # the face: its shades are warm too, none of it is touched here
            if sa >= 0.60 and v >= 0.78: q = (218, 194, 159) if v >= 0.88 else (187, 175, 151)    # trim -> the soldiers' cream
            else:
                g = int(round(62 + (min(0.90, max(0.30, v)) - 0.30) / 0.60 * 80)); q = (g, g - 1, g - 4)
            px[x, y] = q + (p[3],); n += 1
    return n

if __name__ == '__main__':
    A = os.path.join(sm.WORK, 'art-in')
    BOW = {'front': lambda x, y: x >= 150, 'side': lambda x, y: x <= 122, 'back': lambda x, y: x <= 105}      # on the mirrored front / back
    for v in ('front', 'side', 'back'):
        im = Image.open(os.path.join(A, 'base_archer', v + '.png')).convert('RGBA')
        if v != 'side': im = im.transpose(Image.FLIP_LEFT_RIGHT)
        src = im.copy(); print(v, recolour(im, BOW[v]) + everything(im, BOW[v], QUIVER[v]), 'px')
        for y in range(126, 141):                                 # the face keeps every one of its own colours (its shade is close to the cloth's)
            for x in range(256):
                p = src.getpixel((x, y))
                if p[3] and p[0] > 215 and p[0] > p[2] + 80: im.putpixel((x, y), p)
        im.save(os.path.join(A, 'archer', v + '.png'))
    import import_portraits; import_portraits.portrait('archer')      # from its source, then recoloured
    p = os.path.join(A, 'base-portraits', 'archer.png'); im = Image.open(p).convert('RGBA'); print('portrait', portrait(im) + everything(im, lambda x, y: False, (76, 40, 96, 90), face=(20, 37, 76, 84), boots=999), 'px'); im.save(p)
