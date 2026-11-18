"""One neutral 3D Guan Yu pose, fixed148/48 glaive; art never edited here."""
import json
from pathlib import Path
from PIL import ImageDraw
import samto_motion as sm, render, cavalry
from clips import mounted_blade as m
OUT=Path(sm.WORK)/'out'/'guanyu-base-v2-guides'
OUT.mkdir(parents=True,exist_ok=True)
weapon=cavalry.Glaive(total=148,main_socket=55,collar=100)
rig=cavalry.CavalryRig(str(Path(sm.WORK)/'inputs/request/samto-body-cavalry-neutral.json'),weapon)
pose=m.pose(chest_lean=0,main=(-35,0,100),axis=(0,0,1),**{'hand.L':(7,20,92)})
j,issues=rig.solve(pose)
direction=sm.unit((1,-1,0))
shape=[(0,100),(-5,109),(-6,125),(-2,136),(12,148),(6,134),(5,116),(0,100)]
blade=[sm.add(j['glaive_butt'],sm.add(sm.mul(direction,w),(0,0,h))) for w,h in shape]
report={'hero':'1','status':'rig solved; art match unverified','weapon_length':148,'weapon_head':48,'pose':pose,'issues':issues,'views':{}}
for camera,name in [('front','front'),('left','side'),('rear','back')]:
    im=render.draw_view(rig,j,camera,None,target=None,support=())
    d=ImageDraw.Draw(im); scale=im.width/256
    d.polygon([tuple(v*scale for v in sm.project(camera,p)[:2]) for p in blade],fill='#d5d7e3',outline='#161b2a',width=3)
    pts={k:[round(v,2) for v in sm.project(camera,p)] for k,p in j.items()}
    pts['blade_sharp_tip']=[round(v,2) for v in sm.project(camera,blade[4])]
    for key in ['glaive_butt','glaive_collar','blade_sharp_tip','r_hand.R','r_hand.L']:
        x,y=pts[key][:2];d.ellipse(((x-1)*scale,(y-1)*scale,(x+1)*scale,(y+1)*scale),fill='#ff8055')
    im.save(OUT/f'{name}.png');report['views'][name]=pts
(OUT/'rig.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
assert not issues,issues
print(json.dumps({v:{k:p[k] for k in ['r_head_top','r_pelvis','r_hand.R','r_hand.L','glaive_butt','glaive_collar','blade_sharp_tip']} for v,p in report['views'].items()}))
