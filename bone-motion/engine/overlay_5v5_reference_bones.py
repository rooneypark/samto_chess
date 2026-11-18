"""Overlay unchanged standard reference bones for review; not a fitted motion rig."""
import json
from pathlib import Path
from PIL import Image, ImageDraw
import samto_motion as sm
from review_5v5_base import ROOT, OUT, BATCH, board, FONT
cavalry=json.loads((ROOT/'bone-motion/out/zhangliao-base-v2-guides/coordinates.json').read_text(encoding='utf-8'))['views']
profiles=json.loads((ROOT/'bone-motion/hero-profiles.json').read_text(encoding='utf-8-sig'))['heroes']
edges=[('head_top','head'),('head','neck'),('neck','chest'),('chest','pelvis'),('shoulder.R','shoulder.L'),('hip.R','hip.L')]
edges += [(a+'.'+s,b+'.'+s) for s in ('R','L') for a,b in [('shoulder','elbow'),('elbow','hand'),('hip','knee'),('knee','ankle'),('ankle','toe')]]
for hero in BATCH['heroes']:
    out=board(1536,552); d=ImageDraw.Draw(out)
    for col,(view,camera) in enumerate([('front','front'),('side','left'),('back','rear')]):
        im=Image.open(ROOT/'bone-motion/art-in'/hero['id']/'base-review-v1'/f'{view}.png').convert('RGBA').resize((512,512),Image.Resampling.NEAREST)
        out.paste(im,(col*512,40),im)
        if hero.get('mounted'):
            pts=cavalry[view]; links=[('r_'+a,'r_'+b) for a,b in edges]
        else:
            filename='samto-body-tactician-neutral.json' if hero['h']==111 else 'samto-body-neutral.json'
            coords=json.loads((ROOT/'bone-motion/inputs/request'/filename).read_text(encoding='utf-8-sig'))['coordinates']
            p=profiles[hero['id']]
            pts={k:sm.project(camera,(v[0]*p['width'],v[1],v[2]*p['height'])) for k,v in coords.items()}
            links=edges
        for a,b in links:
            if a in pts and b in pts:
                xy=[(col*512+pts[k][0]*2,40+pts[k][1]*2) for k in (a,b)]
                d.line(xy,fill='#49e0e8',width=2)
        d.line((col*512,488,col*512+511,488),fill='#e3ab55',width=1)
        d.text((col*512+10,8),hero['name']+' '+view+' · 표준 본 대조 / 미피팅',font=FONT,fill='white')
    out.save(OUT/f"{hero['id']}-reference-bones.png")
print('8 reference overlays written; no motion-rig approval asserted.')
