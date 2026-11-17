"""Plain-edged frames: every button and panel uses the shape of the blue button (cut corners, no corner ornament).

    python tools/make_plain_frames.py

2026-11-17 user decision: the fret-cornered green button and the bracket-cornered panels are retired; all frames
take the plain edge of game/assets/ui-scalable/blue-rich.png. This recolours that one shape:

    green-plain.png        primary / selected button   (gold edge, jade face)
    blue-plain-panel.png   panel                       (silver edge, dark navy face)
    green-plain-panel.png  selected panel              (gold edge, dark green face)

and points frames.js at them. blue-rich.png itself is the secondary button and is not changed.
The retired art (green-rich.png, blue.png, green.png) stays on disk for reference.
"""
import json, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR = os.path.join(ROOT, 'game', 'assets', 'ui-scalable')

def lerp(a, b, t):
    t = max(0.0, min(1.0, t))
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))

def kind(r, g, b):
    lum = (r * 299 + g * 587 + b * 114) / 1000
    spread = max(r, g, b) - min(r, g, b)
    if lum < 40: return 'outline', lum
    if spread < 60 and lum > 80: return 'edge', lum          # silver edge and its highlight
    return 'face', lum

def recolour(src, edge, face):
    """edge / face: (dark, light) colour ramps, or None to keep the source colour."""
    out = src.copy(); px = out.load()
    faces = [kind(*px[x, y][:3])[1] for y in range(out.height) for x in range(out.width) if px[x, y][3] and kind(*px[x, y][:3])[0] == 'face']
    lo, hi = min(faces), max(faces)
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if not a: continue
            k, lum = kind(r, g, b)
            if k == 'edge' and edge: px[x, y] = (*lerp(edge[0], edge[1], (lum - 90) / 160), a)
            elif k == 'face' and face: px[x, y] = (*lerp(face[0], face[1], (lum - lo) / max(1, hi - lo)), a)
    return out

GOLD = ((150, 98, 30), (255, 240, 170))
def main():
    src = Image.open(os.path.join(DIR, 'blue-rich.png')).convert('RGBA')
    made = {
        'green-plain.png': recolour(src, GOLD, ((1, 30, 29), (21, 122, 76))),
        'blue-plain-panel.png': recolour(src, None, ((9, 21, 41), (19, 39, 68))),
        'green-plain-panel.png': recolour(src, GOLD, ((1, 40, 24), (2, 68, 38))),
    }
    for name, image in made.items(): image.save(os.path.join(DIR, name))
    note = 'Plain-edged frame recoloured from blue-rich.png (tools/make_plain_frames.py)'
    size = {'width': src.width, 'height': src.height, 'slice': 66, 'corner': 28}
    frames = {
        'blue': {'file': 'blue-plain-panel.png', **size, 'alpha': note},
        'green': {'file': 'green-plain-panel.png', **size, 'alpha': note},
        'blue-button': {'file': 'blue-rich.png', **size, 'alpha': 'Final 579x143 transparent frame; slice 66; build-rich-buttons.cjs'},
        'green-button': {'file': 'green-plain.png', **size, 'alpha': note},
    }
    lines = ['// Every frame has the plain cut-corner edge of the blue button (2026-11-17). tools/make_plain_frames.py writes this file.',
             '// blue / green: panels. blue-button / green-button: buttons (nineSlice(..., {button:true})).',
             'export const nineSliceFrames=' + json.dumps(frames, ensure_ascii=False) + ';', '']
    with open(os.path.join(DIR, 'frames.js'), 'w', encoding='utf-8', newline=chr(10)) as f:
        f.write(chr(10).join(lines))
    print('wrote', ', '.join(made), 'and frames.js')

if __name__ == '__main__':
    main()
