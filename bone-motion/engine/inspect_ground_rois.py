import json
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
root=Path.cwd();p=root/'bone-motion/out/ground-audit';rows=json.loads((p/'audit.json').read_text(encoding='utf8'))
for r in rows:
 if r['clip']:
  a=np.array(Image.open(root/r['path']))[:,:,3];y,x=np.where(a>0);dx,dy=r['offset']; bad=(x+dx<0)|(x+dx>=a.shape[1])|(y+dy<0)|(y+dy>=a.shape[0]); print(r['id'],r['view'],r['clip'],'maxAlpha',int(a[y[bad],x[bad]].max()))
for start in range(0,49,7):
 sheet=Image.new('RGB',(840,7*160),(55,59,65));d=ImageDraw.Draw(sheet)
 for k,r in enumerate(rows[start*3:(start+7)*3]):
  im=Image.open(root/r['path']).convert('RGBA').resize((256,256),Image.Resampling.NEAREST);crop=im.crop((72,170,192,242)).resize((240,144),Image.Resampling.NEAREST);x=k%3*280;y=k//3*160+16;sheet.paste(crop,(x,y),crop);d.text((x,y-14),r['id']+' '+r['view'],fill='white')
  for xx in [96,112,128,144,160,176]:
   q=x+(xx-72)*2;d.line((q,y,q,y+144),fill=(70,100,90));d.text((q,y+120),str(xx),fill='lime')
 sheet.save(p/f'feet-{start//7}.png')
