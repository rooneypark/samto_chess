"""Render one neutral cavalry pose into three camera guides; never edit art or GUARD."""
import json
from pathlib import Path
from PIL import Image, ImageDraw
import samto_motion as sm
import render
from overview import solve

OUT = Path(sm.WORK) / 'out' / 'zhangliao-base-v2-guides'
OUT.mkdir(parents=True, exist_ok=True)
m, _, rig, _ = solve('mounted_blade', 'idle')
pose = m.pose(chest_lean=0.0, main=(-35, 0, 100), axis=(0, 0, 1), **{'hand.L': (7, 20, 92)})
j, issues = rig.solve(pose)
# Blade curves toward world +X,+Y: front tip right, left-camera tip left, rear tip left.
blade_shape = [(0,112),(-4,120),(-5,131),(0,141),(12,148),(7,137),(6,126),(0,112)]
direction = sm.unit((1,1,0))
blade = [sm.add(j['glaive_butt'], sm.add(sm.mul(direction,w),(0,0,h))) for w,h in blade_shape]
report = {'status':'guide only; not generated-art QA', 'pose':pose,'solve_issues':issues,'views':{}}
for view,name in [('front','front'),('left','side'),('rear','back')]:
    im = render.draw_view(rig,j,view,None,target=None,support=())
    s = im.width/256
    d = ImageDraw.Draw(im)
    poly = [tuple(v*s for v in sm.project(view,p)[:2]) for p in blade]
    d.polygon(poly,fill='#b9c8dd',outline='#252e40',width=max(1,round(1.5*s)))
    for key,color in [('r_hand.R','#ff9f43'),('r_hand.L','#49ceea')]:
        x,y,_=sm.project(view,j[key]); d.ellipse(((x-2)*s,(y-2)*s,(x+2)*s,(y+2)*s),fill=color)
    im.save(OUT/f'{name}.png')
    report['views'][name] = {k:[round(v,2) for v in sm.project(view,p)] for k,p in j.items()}
(OUT/'coordinates.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'out':str(OUT),'issues':issues,'landmarks':{v:{k:pts[k] for k in ['r_head_top','r_head','r_pelvis','r_hand.R','r_hand.L','h_ear_tip.L','h_fore_ground.L','h_hind_ground.L','glaive_butt','glaive_collar','glaive_tip']} for v,pts in report['views'].items()}},ensure_ascii=False))
