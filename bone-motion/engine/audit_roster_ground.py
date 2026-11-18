import json, math
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
root=Path.cwd(); data=json.loads((root/'bone-motion/art-in/roster-49-v1/progress.json').read_text(encoding='utf8'))
out=root/'bone-motion/out/ground-audit';out.mkdir(parents=True,exist_ok=True)
rows=[]
for r in data['records']:
 for v,item in r['views'].items():
  im=Image.open(root/item['path']);a=np.array(im)[:,:,3];scale=im.width/256
  # Foot ROI excludes low weapons near the far left/right.
  yy,xx=np.indices(a.shape); mask=(a>=128)&(xx>=round(80*scale))&(xx<round(176*scale))
  y,x=np.where(mask); b=int(y.max()+1)
  foot=mask&(yy>=b-round(4*scale));fy,fx=np.where(foot)
  cx=(int(fx.min())+int(fx.max())+1)/2
  dx=math.floor(128*scale-cx+0.5);dy=round(224*scale)-b
  nz_y,nz_x=np.where(a>0)
  clip=int(np.sum((nz_x+dx<0)|(nz_x+dx>=im.width)|(nz_y+dy<0)|(nz_y+dy>=im.height)))
  rows.append(dict(id=r['id'],name=r['name'],view=v,path=item['path'],size=list(im.size),scale=scale,foot_bottom=b,foot_center=cx,offset=[dx,dy],clip=clip))
for start in range(0,len(data['records']),7):
 records=data['records'][start:start+7]; sheet=Image.new('RGB',(840,len(records)*270),(55,59,65));draw=ImageDraw.Draw(sheet)
 for ri,r in enumerate(records):
  for vi,(v,item) in enumerate(r['views'].items()):
   im=Image.open(root/item['path']).convert('RGBA');im=im.resize((256,256),Image.Resampling.NEAREST)
   x=vi*280;y=ri*270+14;sheet.paste(im,(x,y),im)
   draw.line((x,y+224,x+256,y+224),fill=(40,220,120));draw.line((x+128,y+195,x+128,y+245),fill=(40,220,120))
   row=next(z for z in rows if z['id']==r['id'] and z['view']==v)
   draw.text((x,y-13),f"{r['id']} {v} bottom={row['foot_bottom']/row['scale']:.1f} shift={row['offset']} clip={row['clip']}",fill='white')
 sheet.save(out/f'sheet-{start//7}.png')
(out/'audit.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf8')
print('147 measurements; sheets 0..6');print('clip risks',[(r['id'],r['view'],r['clip']) for r in rows if r['clip']]);print('dimensions',sorted(set(tuple(r['size']) for r in rows)))
