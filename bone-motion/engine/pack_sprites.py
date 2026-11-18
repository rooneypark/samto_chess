"""Pack finished PixelLab frames into strips the simulator can load.

    python bone-motion/engine/pack_sprites.py <hero id>

Reads out/pixellab/<id>/<clip>/<view>/01..15.png and writes sim/sprites/<id>/<clip>-<view>.png (15 frames side by side,
256 px each) plus sim/sprites/index.js listing what exists. Only complete clips (all 15 frames) are packed.
"""
import json, os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import samto_motion as sm

def pack(hero):
    src = os.path.join(sm.WORK, 'out', 'pixellab', hero); dst = os.path.join(sm.WORK, 'sim', 'sprites', hero); os.makedirs(dst, exist_ok=True); done = {}
    for clip in sorted(os.listdir(src)):
        if '__' in clip: continue      # trial runs
        for view in sorted(os.listdir(os.path.join(src, clip))):
            d = os.path.join(src, clip, view); files = [os.path.join(d, '%02d.png' % i) for i in range(1, 16)]
            if not all(os.path.exists(f) for f in files): continue
            strip = Image.new('RGBA', (256 * 15, 256), (0, 0, 0, 0))
            for i, f in enumerate(files):
                im = Image.open(f).convert('RGBA')
                if im.size != (256, 256): im = im.resize((256, 256), Image.NEAREST)
                strip.paste(im, (i * 256, 0))
            strip.save(os.path.join(dst, '%s-%s.png' % (clip, view))); done.setdefault(clip, []).append(view)
    return done

if __name__ == '__main__':
    root = os.path.join(sm.WORK, 'sim', 'sprites'); os.makedirs(root, exist_ok=True); index_path = os.path.join(root, 'index.js'); index = {}
    if os.path.exists(index_path): index = json.loads(open(index_path, encoding='utf-8').read()[len('window.SIM_SPRITES = '):-2])
    for hero in sys.argv[1:]:
        index[hero] = pack(hero); print(hero, {k: len(v) for k, v in index[hero].items()})
    open(index_path, 'w', encoding='utf-8', newline='\n').write('window.SIM_SPRITES = ' + json.dumps(index) + ';\n')
